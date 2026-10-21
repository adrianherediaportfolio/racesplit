# RaceSplit — Análisis de Rendimiento en Carreras (App Móvil)

App móvil multiplataforma (Android + iOS) para análisis estación por estación, rankings por percentiles y detección de debilidades en carreras de fitness.

## Características

- **Búsqueda de Atletas** — Busca por nombre o dorsal, seleccionando el evento y la división
- **Desglose por Percentiles Estación a Estación** — Mira dónde te posicionas dentro de tu categoría (grupo de edad + género) para cada una de las 8 estaciones
- **Detector de Debilidades** — Destaca automáticamente las 2-3 estaciones donde más tiempo pierdes respecto a la mediana de tu categoría
- **Gráficos Comparativos** — Gráficos de barras comparando tus tiempos vs mediana de categoría vs top 10%
- **Desglose Running vs Fuerza** — Agrega tiempos de running vs estaciones para identificar el balance cardio vs fuerza
- **Cuentas de Usuario** — Autenticación por email + contraseña con historial de carreras guardadas
- **Modelo Freemium** — Tier gratuito (1 análisis) y tier de pago (ilimitado) con suscripciones de Stripe

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| App Móvil | React Native (Expo SDK 55), TypeScript |
| Navegación | React Navigation (native stack + bottom tabs) |
| Gráficos | Gráficos de barras custom, visualizaciones de percentiles |
| Almacenamiento | AsyncStorage para tokens de auth |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2 |
| Scraper | BeautifulSoup4, httpx, lxml |
| Base de Datos | PostgreSQL 16 |
| Auth | JWT (PyJWT), bcrypt |
| Pagos | Stripe Checkout y webhooks de suscripción |
| DevOps | Docker, docker-compose, GitHub Actions CI |

## Inicio Rápido

### Prerrequisitos

- Node.js 22+
- Python 3.11+
- PostgreSQL 16 (o usa Docker)
- App Expo Go en tu teléfono (para desarrollo)

### Configuración del Backend

```bash
# Iniciar base de datos + backend con Docker
docker-compose up --build

# O manualmente:
cd backend
cp .env.example .env
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

### Configuración de la App Móvil

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Escanea el código QR con Expo Go (Android) o la app de Cámara (iOS) para ejecutar en tu teléfono.

El emulador de Android usa `http://10.0.2.2:8000` por defecto y las demás plataformas usan `http://localhost:8000`. Un teléfono físico no puede usar el `localhost` del ordenador. Define `EXPO_PUBLIC_API_URL` en `mobile/.env` con la IP LAN del ordenador, por ejemplo `http://192.168.1.25:8000`, y conecta ambos dispositivos a la misma red.

## Configuración de Stripe

Define estos valores en `backend/.env`:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
PUBLIC_BASE_URL=http://localhost:8000
```

Crea un precio recurrente en Stripe y usa su ID en `STRIPE_PRICE_ID`. Activa los eventos `checkout.session.completed`, `customer.subscription.deleted` y `customer.subscription.updated` para el endpoint `/api/stripe/webhook`. Para probar localmente, reenvía los eventos de Stripe con:

```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

Copia el secreto de firma que muestra Stripe CLI en `STRIPE_WEBHOOK_SECRET`. En despliegues, configura `PUBLIC_BASE_URL` con una dirección accesible para el navegador del checkout. Los webhooks de Stripe actualizan el acceso a la suscripción; la redirección de éxito no lo hace.

### Compilar para Producción

```bash
# Android e iOS
npx eas build --platform all
```

## Cómo Funciona

1. **Buscar**: Introduce el nombre del atleta y selecciona el evento
2. **Scrapear**: El backend obtiene los splits detallados de la página de resultados
3. **Dataset de Categoría**: Si es la primera vez para esta categoría, scrapea todos los atletas del mismo género + grupo de edad
4. **Análisis**: Calcula percentiles, detecta debilidades, genera datos de comparación
5. **Visualizar**: La app renderiza barras de percentiles, gráficos comparativos y tarjetas de debilidades

### Cálculo de Percentiles

```
percentil = (atletas_más_lentos_en_categoría / total_en_categoría) × 100
```

Un percentil de 85 significa "más rápido que el 85% de los atletas de tu categoría" (top 15%).

## Testing

```bash
# Tests del backend
cd backend
pytest -v

# Type check de la app
cd mobile
npx tsc --noEmit
```

## Licencia

Copyright (c) 2026 Adrian Heredia Jimenez. Todos los derechos reservados.

Software propietario. El código es público para que puedas verlo, pero no puedes usarlo, copiarlo, modificarlo ni distribuirlo sin mi permiso por escrito. Consulta [LICENSE](LICENSE).

¿Quieres usarlo o comprar una licencia? Escríbeme a adrian.heredia.jimenez@gmail.com.
