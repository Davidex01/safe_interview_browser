import React from "react";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";

function DemoReportPage() {
  const report = {
    score: 82,
    verdict:
      "Демо-отчёт: интерфейс показывает, как кандидат будет видеть результаты интервью.",
    metrics: {
      correctness: 80,
      optimality: 75,
      codeStyle: 78,
      honesty: 100,
    },
    tasks: [
      { title: "Алгоритмы", status: "solved" },
      { title: "Строки", status: "solved" },
      { title: "Продуктовая", status: "solved" },
    ],
  };

  return (
    <section className="session-report">
      <Container className="session-report__inner">
        <header className="session-report__header">
          <h1>Демо-отчёт об интервью</h1>
          <p className="session-report__status">
            Это пример итогового окна, которое увидит кандидат после
            реального интервью.
          </p>
          <div className="session-report__score-block">
            <div className="session-report__score-circle">
              <span className="session-report__score-value">
                {report.score}
              </span>
              <span className="session-report__score-label">
                из 100
              </span>
            </div>
            <p className="session-report__verdict">
              {report.verdict}
            </p>
          </div>
        </header>

        <section className="session-report__section">
          <h2>Ключевые метрики (демо)</h2>
          <div className="session-report__metrics-grid">
            <MetricCard
              label="Правильность"
              value={report.metrics.correctness}
            />
            <MetricCard
              label="Оптимальность"
              value={report.metrics.optimality}
            />
            <MetricCard
              label="Стиль кода"
              value={report.metrics.codeStyle}
            />
            <MetricCard
              label="Честность"
              value={report.metrics.honesty}
            />
          </div>
        </section>

        <section className="session-report__section">
          <h2>Задачи (демо)</h2>
          <ul className="session-report__tasks-list">
            {report.tasks.map((t, idx) => (
              <li key={idx} className="session-report__task-card">
                <header className="session-report__task-header">
                  <h3>{t.title}</h3>
                  <span className="session-report__task-status">
                    {t.status}
                  </span>
                </header>
                <p className="session-report__task-comment">
                  Здесь в реальном отчёте будет краткий комментарий по
                  задаче.
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="session-report__footer">
          <Button as="a" href="/" variant="secondary">
            Вернуться на главную
          </Button>
        </footer>
      </Container>
    </section>
  );
}

function MetricCard({ label, value }) {
  const normalized = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="session-report__metric-card">
      <div className="session-report__metric-header">
        <span className="session-report__metric-label">{label}</span>
        <span className="session-report__metric-value">{normalized}</span>
      </div>
      <div className="session-report__metric-bar">
        <div
          className="session-report__metric-bar-fill"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

export default DemoReportPage;