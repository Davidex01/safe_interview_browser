import React, { useState } from "react";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";
import { generateInterviewToken } from "../../utils/token.js";

const COMPLEXITY_HINT = "Например: jun, jun+, mid, senior";

function HrWorkshopPage() {
  const [position, setPosition] = useState("");
  const [complexity, setComplexity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  const isValid = position.trim() !== "" && complexity.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError("");
    setCreatedToken("");
    setApiResponse(null);

    const token = generateInterviewToken();
    const payload = {
      token,
      position: position.trim(),
      complexity: complexity.trim(),
    };

    try {
      // Пока у тебя на бэке есть только /api/generate-tasks,
      // мы используем его и передаём vacancy как комбинированный текст.
      // Когда добавишь отдельную ручку для interview, можно будет менять здесь только URL/тело.

      const vacancyText = `Должность: ${payload.position}. Сложность: ${payload.complexity}.`;
      const res = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vacancy: vacancyText, token: payload.token }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `Ошибка бэка (${res.status}): ${errText || "unknown"}`
        );
      }

      const data = await res.json();
      setCreatedToken(token);
      setApiResponse(data);
      // здесь же можно будет дернуть отдельный endpoint "create_interview",
      // если ты его сделаешь (например POST /api/interviews)
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Не удалось сформировать интервью. Попробуйте ещё раз или свяжитесь с разработчиком."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const interviewLink =
    createdToken && `${window.location.origin}/session/${createdToken}`;

  return (
    <section className="hr-workshop">
      <div className="hr-workshop__wrapper">
        <Container className="hr-workshop__simple">
          <header className="hr-workshop__header">
            <h1>Мастерская собеседований</h1>
            <p>
              Укажите должность и сложность, на которую вы хотите провести
              собеседование. Система сгенерирует набор задач и уникальный
              токен интервью.
            </p>
          </header>

          <form className="hr-workshop__simple-form" onSubmit={handleSubmit}>
            <div className="hr-workshop__simple-field">
              <label htmlFor="position">Должность</label>
              <input
                id="position"
                type="text"
                placeholder="Например: Backend разработчик"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>

            <div className="hr-workshop__simple-field">
              <label htmlFor="complexity">Сложность</label>
              <input
                id="complexity"
                type="text"
                placeholder={COMPLEXITY_HINT}
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="hr-workshop__error">{submitError}</div>
            )}

            <div className="hr-workshop__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting
                  ? "Формируем интервью..."
                  : "Сформировать интервью"}
              </Button>
            </div>
          </form>

          {createdToken && (
            <div className="hr-workshop__result">
              <h2>Интервью создано</h2>
              <p>
                Отправьте кандидату эту ссылку. По ней он попадёт на экран
                согласия и затем в среду решения задач.
              </p>
              <div className="hr-workshop__link-box">
                <code>{interviewLink}</code>
              </div>
              <p className="hr-workshop__token-note">
                Токен интервью: <strong>{createdToken}</strong>
              </p>
            </div>
          )}

          {/* Для отладки можно показать сырые данные от бэка */}
          {apiResponse && (
            <details className="hr-workshop__api-debug">
              <summary>Показать ответ бэка (отладка)</summary>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </details>
          )}
        </Container>
      </div>
    </section>
  );
}

export default HrWorkshopPage;