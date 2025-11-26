export async function fetchInterviewByToken(token) {
  const res = await fetch(`/api/interview/${encodeURIComponent(token)}`, {
    method: "GET",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const error = new Error(
      data?.detail || data?.message || `Ошибка ${res.status}`
    );
    error.status = res.status;
    throw error;
  }

  return data;
}