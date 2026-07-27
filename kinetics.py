"""Michaelis-Menten curve fitting and Lineweaver-Burk transformation."""

import numpy as np
from scipy.optimize import curve_fit


class FitError(ValueError):
    """Raised when the input data cannot be fit to the MM equation."""


def michaelis_menten(s, km, vmax):
    """v = Vmax * S / (Km + S)"""
    return vmax * s / (km + s)


def fit_michaelis_menten(substrate, velocity, curve_points=100):
    """Fit experimental (S, v) pairs to the Michaelis-Menten equation.

    Returns a dict with km, vmax, r_squared, standard errors, and a
    smooth fitted curve suitable for plotting.
    """
    s = np.asarray(substrate, dtype=float)
    v = np.asarray(velocity, dtype=float)

    if s.shape != v.shape:
        raise FitError("substrate and velocity must have the same length")
    if s.size < 3:
        raise FitError("at least 3 data points are required to fit Km and Vmax")
    if np.any(s < 0) or np.any(v < 0):
        raise FitError("substrate and velocity values must be non-negative")

    # Initial guesses: Vmax slightly above the highest observed velocity,
    # Km at the substrate concentration closest to half that Vmax.
    vmax0 = float(np.max(v)) * 1.2 or 1.0
    half_vmax_idx = int(np.argmin(np.abs(v - vmax0 / 2)))
    km0 = float(s[half_vmax_idx]) or 1.0

    try:
        params, covariance = curve_fit(
            michaelis_menten,
            s,
            v,
            p0=[km0, vmax0],
            bounds=([1e-9, 1e-9], [np.inf, np.inf]),
            maxfev=10000,
        )
    except RuntimeError as exc:
        raise FitError(f"curve fitting did not converge: {exc}") from exc

    km, vmax = params
    perr = np.sqrt(np.diag(covariance))
    km_stderr, vmax_stderr = float(perr[0]), float(perr[1])

    predicted = michaelis_menten(s, km, vmax)
    ss_res = float(np.sum((v - predicted) ** 2))
    ss_tot = float(np.sum((v - np.mean(v)) ** 2))
    r_squared = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0

    s_smooth = np.linspace(0, float(np.max(s)) * 1.1, curve_points)
    v_smooth = michaelis_menten(s_smooth, km, vmax)

    return {
        "km": float(km),
        "vmax": float(vmax),
        "km_stderr": km_stderr,
        "vmax_stderr": vmax_stderr,
        "r_squared": r_squared,
        "fitted_curve": [
            {"substrate": float(x), "velocity": float(y)}
            for x, y in zip(s_smooth, v_smooth)
        ],
    }


def lineweaver_burk(substrate, velocity):
    """Compute the double-reciprocal (1/S, 1/v) transform plus a linear fit.

    Provided as a secondary diagnostic view only -- the primary fit is
    always the nonlinear regression in fit_michaelis_menten.
    """
    s = np.asarray(substrate, dtype=float)
    v = np.asarray(velocity, dtype=float)

    if np.any(s == 0) or np.any(v == 0):
        raise FitError("Lineweaver-Burk transform requires non-zero substrate and velocity values")

    inv_s = 1.0 / s
    inv_v = 1.0 / v

    slope, intercept = np.polyfit(inv_s, inv_v, 1)
    km_lb = slope / intercept
    vmax_lb = 1.0 / intercept

    return {
        "points": [{"inv_s": float(x), "inv_v": float(y)} for x, y in zip(inv_s, inv_v)],
        "slope": float(slope),
        "intercept": float(intercept),
        "km": float(km_lb),
        "vmax": float(vmax_lb),
    }
