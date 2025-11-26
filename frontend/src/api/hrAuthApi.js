const BASE_URL = "/api/hr";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${res.status}`
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Регистрация HR
export function registerHr(payload) {
  // payload: { email, password, name?, company? }
  return request("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Логин HR
export function loginHr(payload) {
  // payload: { email, password }
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}