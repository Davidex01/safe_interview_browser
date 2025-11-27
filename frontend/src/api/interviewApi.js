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

  return data; // ожидаем { token, vacancy, coding_tasks, theory_tasks, ... }
}

// Отправка решений интервью на бэк
export async function submitInterview(token, payload) {
  const res = await fetch(
    `/api/interview/${encodeURIComponent(token)}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // { coding_solutions, theory_solutions }
    }
  );

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