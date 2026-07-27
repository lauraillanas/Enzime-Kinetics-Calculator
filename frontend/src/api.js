// `??` (not `||`): an explicitly empty VITE_API_URL means "same-origin relative
// requests" (used behind the Docker/nginx reverse proxy) and must not be
// overridden by the localhost fallback the way `||` would treat "" as unset.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `request failed with status ${response.status}`);
  }
  return response.json();
}

export function fitKinetics(substrate, velocity) {
  return fetch(`${API_URL}/api/fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ substrate, velocity }),
  }).then(handleResponse);
}

export function fetchSampleData(name) {
  return fetch(`${API_URL}/api/sample-data/${name}`).then(handleResponse);
}

export function fetchReference(ecNumber) {
  return fetch(`${API_URL}/api/reference/${ecNumber}`).then(handleResponse);
}
