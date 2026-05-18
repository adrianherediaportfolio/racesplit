"""Stripe payment integration scaffold."""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.api.auth import get_current_user
from src.config import settings
from src.database import get_db
from src.models import CheckoutRequest, CheckoutResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stripe", tags=["stripe"])

stripe.api_key = settings.stripe_secret_key


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout_session(
    data: CheckoutRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    if user.is_paid:
        raise HTTPException(status_code=400, detail="Already on paid plan")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": settings.stripe_price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            customer_email=user.email,
            metadata={"user_id": str(user.id)},
        )
        return CheckoutResponse(checkout_url=session.url)
    except stripe.error.StripeError as e:
        logger.error("Stripe error: %s", e)
        raise HTTPException(status_code=500, detail="Payment service error")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            from src.database import User

            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.is_paid = True
                user.stripe_customer_id = session.get("customer")
                db.commit()
                logger.info("User %s upgraded to paid plan", user.email)

    return {"status": "ok"}
