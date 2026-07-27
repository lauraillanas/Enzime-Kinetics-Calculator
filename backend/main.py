"""FastAPI app for the Enzyme Kinetics Calculator."""

from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from kinetics import FitError, fit_michaelis_menten, lineweaver_burk
from sabio_client import get_reference_kinetics

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_DATASETS = {
    "invertase": "sample_invertase.csv",
    "alkaline_phosphatase": "sample_alkaline_phosphatase.csv",
}

app = FastAPI(title="Enzyme Kinetics Calculator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class FitRequest(BaseModel):
    substrate: list[float] = Field(min_length=3)
    velocity: list[float] = Field(min_length=3)


@app.post("/api/fit")
def fit(request: FitRequest):
    try:
        result = fit_michaelis_menten(request.substrate, request.velocity)
    except FitError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result["lineweaver_burk"] = lineweaver_burk(request.substrate, request.velocity)
    except FitError:
        result["lineweaver_burk"] = None

    return result


@app.get("/api/reference/{ec_number}")
async def reference(ec_number: str):
    return await get_reference_kinetics(ec_number)


@app.get("/api/sample-data/{name}")
def sample_data(name: str):
    filename = SAMPLE_DATASETS.get(name)
    if filename is None:
        raise HTTPException(
            status_code=404,
            detail=f"unknown sample dataset '{name}', available: {list(SAMPLE_DATASETS)}",
        )

    df = pd.read_csv(DATA_DIR / filename)
    return {
        "name": name,
        "substrate": df.iloc[:, 0].tolist(),
        "velocity": df.iloc[:, 1].tolist(),
    }
