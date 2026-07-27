import numpy as np
import pytest

from kinetics import FitError, fit_michaelis_menten, lineweaver_burk, michaelis_menten


def test_fit_recovers_known_parameters():
    true_km, true_vmax = 15.0, 80.0
    s = np.array([1, 2, 5, 10, 15, 20, 30, 50, 80, 120], dtype=float)
    v = michaelis_menten(s, true_km, true_vmax)

    result = fit_michaelis_menten(s, v)

    assert result["km"] == pytest.approx(true_km, rel=1e-3)
    assert result["vmax"] == pytest.approx(true_vmax, rel=1e-3)
    assert result["r_squared"] == pytest.approx(1.0, abs=1e-6)


def test_fit_handles_noisy_data_reasonably():
    true_km, true_vmax = 20.0, 100.0
    s = np.array([2, 5, 10, 15, 20, 30, 40, 60, 80, 100], dtype=float)
    rng = np.random.default_rng(42)
    v = michaelis_menten(s, true_km, true_vmax) * (1 + rng.normal(0, 0.03, size=s.size))

    result = fit_michaelis_menten(s, v)

    assert result["km"] == pytest.approx(true_km, rel=0.15)
    assert result["vmax"] == pytest.approx(true_vmax, rel=0.15)
    assert result["r_squared"] > 0.95


def test_fit_returns_smooth_curve():
    s = [1, 2, 5, 10, 20, 40]
    v = michaelis_menten(np.array(s), 10.0, 50.0)

    result = fit_michaelis_menten(s, v, curve_points=25)

    assert len(result["fitted_curve"]) == 25
    assert result["fitted_curve"][0]["substrate"] == pytest.approx(0.0)


def test_fit_rejects_mismatched_lengths():
    with pytest.raises(FitError):
        fit_michaelis_menten([1, 2, 3], [1, 2])


def test_fit_rejects_too_few_points():
    with pytest.raises(FitError):
        fit_michaelis_menten([1, 2], [1, 2])


def test_fit_rejects_negative_values():
    with pytest.raises(FitError):
        fit_michaelis_menten([1, 2, -3], [1, 2, 3])


def test_lineweaver_burk_transform():
    s = np.array([1, 2, 5, 10, 20], dtype=float)
    v = michaelis_menten(s, 10.0, 50.0)

    result = lineweaver_burk(s, v)

    assert result["km"] == pytest.approx(10.0, rel=1e-3)
    assert result["vmax"] == pytest.approx(50.0, rel=1e-3)
    assert len(result["points"]) == 5


def test_lineweaver_burk_rejects_zero_values():
    with pytest.raises(FitError):
        lineweaver_burk([0, 1, 2], [1, 2, 3])
