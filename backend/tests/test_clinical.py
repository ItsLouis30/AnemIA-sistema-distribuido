"""Pruebas unitarias de la lógica clínica (no requieren modelos ni DB)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing_pipeline import (  # noqa: E402
    altitude_adjustment,
    classify_anemia,
    correct_hemoglobin_for_altitude,
)


def test_altitude_adjustment_zero():
    # A nivel del mar (o altitud no válida) no hay ajuste.
    assert altitude_adjustment(0) == 0.0
    assert altitude_adjustment(-100) == 0.0


def test_altitude_adjustment_monotonic():
    # Fórmula continua: el ajuste es cada vez más negativo con la altitud.
    assert altitude_adjustment(1000) > altitude_adjustment(2000) > altitude_adjustment(4000)


def test_altitude_adjustment_juliaca():
    # 3877 m.s.n.m. con la fórmula continua OMS: -0.030 h^2 - 0.56384 h (h en km).
    assert round(altitude_adjustment(3877), 2) == -2.64


def test_correct_hemoglobin_juliaca():
    # Caso ejemplo: Hb 13.7 a 3877 m -> 13.7 - 2.637 = 11.06.
    assert correct_hemoglobin_for_altitude(13.7, 3877) == 11.06


def test_classify_normal_under5():
    dx = classify_anemia(11.4, 53.62)
    assert dx.code == "Normal"


def test_classify_moderada():
    dx = classify_anemia(8.0, 30)
    assert dx.code == "AnemiaModerada"


def test_classify_severa():
    dx = classify_anemia(6.0, 30)
    assert dx.code == "AnemiaSevera"
