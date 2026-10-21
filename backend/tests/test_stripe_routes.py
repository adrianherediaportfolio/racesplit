from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import stripe
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.api.auth import get_current_user
from src.api.stripe_routes import router
from src.config import settings
from src.database import Base, User, get_db


@pytest.fixture
def stripe_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with session_factory() as db:
        user = User(
            email="runner@example.com",
            hashed_password="hashed",
            is_paid=False,
        )
        db.add(user)
        db.commit()
        user_id = user.id

    app = FastAPI()
    app.include_router(router, prefix="/api")

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: User(
        id=user_id,
        email="runner@example.com",
        hashed_password="hashed",
        is_paid=False,
    )

    with TestClient(app) as client:
        yield client, session_factory, user_id

    app.dependency_overrides.clear()
    engine.dispose()


def _set_webhook_event(monkeypatch, event):
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_test")
    monkeypatch.setattr(stripe.Webhook, "construct_event", lambda *args: event)


def test_checkout_returns_503_when_stripe_is_unconfigured(stripe_client, monkeypatch):
    client, _, _ = stripe_client
    monkeypatch.setattr(settings, "stripe_secret_key", "")

    response = client.post("/api/stripe/checkout", json={})

    assert response.status_code == 503
    assert response.json()["detail"] == "Stripe not configured"


def test_checkout_uses_default_success_url(stripe_client, monkeypatch):
    client, _, _ = stripe_client
    monkeypatch.setattr(settings, "stripe_secret_key", "sk_test")
    monkeypatch.setattr(settings, "stripe_price_id", "price_test")
    monkeypatch.setattr(settings, "public_base_url", "https://api.example.com/")
    create_session = Mock(return_value=SimpleNamespace(url="https://checkout.stripe.com/session"))
    monkeypatch.setattr(stripe.checkout.Session, "create", create_session)

    response = client.post("/api/stripe/checkout", json={})

    assert response.status_code == 200
    assert response.json()["checkout_url"] == "https://checkout.stripe.com/session"
    assert (
        create_session.call_args.kwargs["success_url"]
        == "https://api.example.com/api/stripe/success"
    )


def test_webhook_rejects_bad_signature(stripe_client, monkeypatch):
    client, _, _ = stripe_client
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_test")

    def reject_signature(*args):
        raise ValueError("bad signature")

    monkeypatch.setattr(stripe.Webhook, "construct_event", reject_signature)
    response = client.post(
        "/api/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "invalid"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid webhook signature"


def test_checkout_completion_marks_user_paid(stripe_client, monkeypatch):
    client, session_factory, user_id = stripe_client
    _set_webhook_event(
        monkeypatch,
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {"user_id": str(user_id)},
                    "customer": "cus_runner",
                }
            },
        },
    )

    response = client.post("/api/stripe/webhook", content=b"{}")

    assert response.status_code == 200
    with session_factory() as db:
        user = db.get(User, user_id)
        assert user.is_paid is True
        assert user.stripe_customer_id == "cus_runner"


def test_subscription_deleted_marks_user_unpaid(stripe_client, monkeypatch):
    client, session_factory, user_id = stripe_client
    with session_factory() as db:
        user = db.get(User, user_id)
        user.stripe_customer_id = "cus_runner"
        user.is_paid = True
        db.commit()
    _set_webhook_event(
        monkeypatch,
        {
            "type": "customer.subscription.deleted",
            "data": {"object": {"customer": "cus_runner", "status": "canceled"}},
        },
    )

    response = client.post("/api/stripe/webhook", content=b"{}")

    assert response.status_code == 200
    with session_factory() as db:
        assert db.get(User, user_id).is_paid is False


def test_past_due_subscription_marks_user_unpaid(stripe_client, monkeypatch):
    client, session_factory, user_id = stripe_client
    with session_factory() as db:
        user = db.get(User, user_id)
        user.stripe_customer_id = "cus_runner"
        user.is_paid = True
        db.commit()
    _set_webhook_event(
        monkeypatch,
        {
            "type": "customer.subscription.updated",
            "data": {"object": {"customer": "cus_runner", "status": "past_due"}},
        },
    )

    response = client.post("/api/stripe/webhook", content=b"{}")

    assert response.status_code == 200
    with session_factory() as db:
        assert db.get(User, user_id).is_paid is False


def test_success_page_links_to_app(stripe_client):
    client, _, _ = stripe_client

    response = client.get("/api/stripe/success")

    assert response.status_code == 200
    assert "racesplit://upgrade?status=success" in response.text
    assert 'href="racesplit://upgrade?status=success"' in response.text
