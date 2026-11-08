"""Pruebas de humo de la API (requieren un modelo entrenado)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.app.main import app  # noqa: E402

client = TestClient(app)

EXAMPLE_CASE = {
    "Prov_EESS": "SANROMAN", "Dist_EESS": "JULIACA", "Sexo": "F",
    "EdadMeses": 53.62, "Juntos": 0, "SIS": 1, "Qaliwarma": 0, "Cred": 1,
    "Suplementacion": 1, "Consejeria": 0, "Sesion": 0, "Hemoglobina": 13.7,
    "ProvinciaREN": "SANROMAN", "DistritoREN": "JULIACA", "AlturaREN": 3877,
}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.slow
def test_predict():
    r = client.post("/predict", json={"case": EXAMPLE_CASE, "model": "random_forest"})
    assert r.status_code == 200
    body = r.json()
    assert body["diagnosis_code"] in {"Normal", "AnemiaLeve", "AnemiaModerada", "AnemiaSevera"}
    assert body["hbc"] == 11.06
