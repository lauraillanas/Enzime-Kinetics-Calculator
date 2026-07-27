"""Client for the SABIO-RK kinetic law database.

SABIO-RK relaunched its site as a SPA; the REST API documented at
sabioRestWebServices (searchKineticLaws/kineticLawsExportTsv) is gone and
now 302-redirects into the SPA's 404 page. The current public, unauthenticated
JSON endpoint -- found in the SPA's own bundled docs page -- lives under
/export-api instead:

    GET https://sabiork.h-its.org/export-api/sabio/kinlaw-entry/json?q=ECNumber:<ec>

Each entry's kineticlaw.parameter list holds Km/Vmax as separate items with
their own unit, and different experiments report them in different units
(mM vs uM, umol/min/mg vs U/mg, ...), so values are grouped by unit rather
than blindly averaged together.
"""

import re
from collections import defaultdict
from statistics import mean

import httpx

BASE_URL = "https://sabiork.h-its.org/export-api/sabio/kinlaw-entry/json"
REQUEST_TIMEOUT = 10.0
MAX_ENTRIES = 50

EC_NUMBER_RE = re.compile(r"^\d+\.\d+\.\d+\.\d+$")


def _is_valid_ec_number(ec_number: str) -> bool:
    return bool(EC_NUMBER_RE.match(ec_number))


def _group_parameter_values(entries: list[dict], parameter_name: str) -> list[dict]:
    """Group a parameter's (value, unit) pairs across entries by unit."""
    by_unit: dict[str, list[float]] = defaultdict(list)

    for entry in entries:
        for param in entry.get("kineticlaw", {}).get("parameter", []):
            if param.get("name") != parameter_name or param.get("role") != "Constant":
                continue
            start = param.get("start_value")
            end = param.get("end_value")
            if start is None:
                continue
            value = (start + end) / 2 if end is not None else start
            unit = (param.get("unit") or {}).get("name", "unknown")
            by_unit[unit].append(float(value))

    return [
        {"unit": unit, "mean": mean(values), "min": min(values), "max": max(values), "n": len(values)}
        for unit, values in sorted(by_unit.items(), key=lambda kv: -len(kv[1]))
    ]


async def get_reference_kinetics(ec_number: str) -> dict:
    """Fetch literature Km/Vmax values for an EC number from SABIO-RK.

    Returns a dict with `available: False` and a `message` on any failure
    (invalid EC number, network/timeout error, or no matching entries) so
    callers can degrade gracefully instead of failing the whole request.
    """
    if not _is_valid_ec_number(ec_number):
        return {
            "ec_number": ec_number,
            "available": False,
            "message": "invalid EC number format, expected e.g. 3.2.1.26",
        }

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(
                BASE_URL,
                params={"q": f"ECNumber:{ec_number}", "pageSize": MAX_ENTRIES},
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.TimeoutException, httpx.HTTPError, ValueError) as exc:
        return {
            "ec_number": ec_number,
            "available": False,
            "message": f"SABIO-RK request failed: {exc}",
        }

    entries = payload.get("data", [])
    if not entries:
        return {
            "ec_number": ec_number,
            "available": False,
            "message": "no SABIO-RK entries found for this EC number",
        }

    km = _group_parameter_values(entries, "Km")
    vmax = _group_parameter_values(entries, "Vmax")

    return {
        "ec_number": ec_number,
        "available": True,
        "entries_used": len(entries),
        "total_entries": payload.get("meta", {}).get("total_count", len(entries)),
        "km": km,
        "vmax": vmax,
        "source": "SABIO-RK (sabiork.h-its.org)",
    }
