# RaceSplit — Análisis de Rendimiento en Carreras

Análisis estación por estación, rankings por percentiles y detección de debilidades para eventos de carreras de fitness.

## Características

- **Búsqueda de Atletas** — Busca por nombre o dorsal, seleccionando el evento y la división
- **Desglose por Percentiles Estación a Estación** — Mira dónde te posicionas dentro de tu categoría (grupo de edad + género) para cada una de las 8 estaciones
- **Detector de Debilidades** — Destaca automáticamente las 2-3 estaciones donde más tiempo pierdes respecto a la mediana de tu categoría
- **Gráficos Comparativos** — Gráficos de barras comparando tus tiempos vs mediana de categoría vs top 10%
- **Desglose Running vs Fuerza** — Agrega tiempos de running vs estaciones para identificar el balance cardio vs fuerza
- **Cuentas de Usuario** — Autenticación por email + contraseña con historial de carreras guardadas
- **Modelo Freemium** — Tier gratuito (1 análisis) + tier de pago (ilimitado, integración Stripe preparada)

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2 |
| Scraper | BeautifulSoup4, httpx, lxml |
| Base de Datos | PostgreSQL 16 |
| Auth | JWT (python-jose), bcrypt |
| Pagos | Stripe (scaffold) |
| DevOps | Docker, docker-compose, GitHub Actions CI |

## Inicio Rápido

### Prerrequisitos

- Python 3.11+
- Node.js 22+
- PostgreSQL 16 (o usa Docker)

### Usando Docker (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- API Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

### Configuración Manual

**Backend:**

```bash
cd backend
cp .env.example .env
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Cómo Funciona

1. **Buscar**: Introduce el nombre del atleta y selecciona el evento
2. **Scrapear**: El backend obtiene los splits detallados de la página de resultados
3. **Dataset de Categoría**: Si es la primera vez para esta categoría, scrapea todos los atletas del mismo género + grupo de edad
4. **Análisis**: Calcula percentiles, detecta debilidades, genera datos de comparación
5. **Visualizar**: El frontend renderiza barras de percentiles, gráficos comparativos y tarjetas de debilidades

### Cálculo de Percentiles

```
percentil = (atletas_más_lentos_en_categoría / total_en_categoría) × 100
```

Un percentil de 85 significa "más rápido que el 85% de los atletas de tu categoría" (top 15%).

### Detección de Debilidades

Ordena las estaciones por la diferencia entre el tiempo del atleta y la mediana de la categoría. Las 3 estaciones con mayor diferencia positiva (más lento que la mediana) se marcan como debilidades.

## Testing

```bash
cd backend
pytest -v
```

20 tests cubriendo:
- Parseo y conversión de tiempos (12 tests)
- Lógica de cálculo de percentiles (8 tests)

## Licencia

MIT
