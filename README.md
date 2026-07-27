# Enzyme Kinetics Calculator

Ajusta datos experimentales de un ensayo enzimático (sustrato S, velocidad v) a la
ecuación de Michaelis-Menten mediante regresión no lineal, devuelve Km, Vmax y R²,
y compara los resultados con valores de literatura consultando [SABIO-RK](https://sabiork.h-its.org).

## Stack

- **Backend**: Python + FastAPI + scipy.optimize (`curve_fit`) + numpy + pandas
- **Frontend**: React (Vite) + Recharts
- **Datos**: CSV de ejemplo para invertasa y fosfatasa alcalina en `data/`

## Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate       # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Tests:

```bash
pytest
```

Endpoints:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/fit` | Recibe `{substrate: [...], velocity: [...]}`, devuelve `km`, `vmax`, `r_squared`, `fitted_curve` y `lineweaver_burk` |
| `GET` | `/api/reference/{ec_number}` | Consulta SABIO-RK y devuelve Km/Vmax de literatura para ese EC, agrupados por unidad |
| `GET` | `/api/sample-data/{name}` | Sirve un dataset de ejemplo (`invertase` o `alkaline_phosphatase`) |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` (el backend debe estar corriendo en `http://localhost:8000`;
configurable con la variable de entorno `VITE_API_URL`).

## Notas técnicas

- **Ajuste no lineal**: se usa `scipy.optimize.curve_fit` directamente sobre
  `v = Vmax·S/(Km+S)` en vez de la linearización de Lineweaver-Burk, porque esta
  última distorsiona los errores experimentales (los puntos de baja concentración
  de sustrato, donde el ruido relativo es mayor, pesan desproporcionadamente en la
  regresión lineal de 1/v vs 1/S). El gráfico de Lineweaver-Burk se ofrece solo
  como vista secundaria de diagnóstico, no como método de ajuste.
- **API de SABIO-RK**: la API REST clásica documentada por el proyecto
  (`sabioRestWebServices`) fue retirada tras el relanzamiento de su sitio como SPA.
  El cliente (`backend/sabio_client.py`) usa en su lugar el endpoint JSON público
  `export-api/sabio/kinlaw-entry/json?q=ECNumber:<ec>`, no documentado oficialmente,
  localizado inspeccionando el bundle de la nueva web. Si SABIO-RK cambia de nuevo
  esta API, `/api/reference/{ec}` seguirá respondiendo con `available: false` en
  vez de fallar.
- **Unidades en los datos de referencia**: distintos experimentos en SABIO-RK
  reportan Km/Vmax en unidades distintas (mM vs µM, µmol/min/mg vs U/mg...), así
  que los valores se agrupan por unidad en vez de promediarse todos juntos.
