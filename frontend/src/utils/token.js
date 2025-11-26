// Простейший генератор токена для фронта.
// В реальном проекте токен лучше выдавать с бэка.

export function generateInterviewToken() {
  const randomPart = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);
  // Можно чуть укоротить
  return randomPart.replace(/-/g, "").slice(0, 24);
}