import React from "react";
import { Outlet, useParams } from "react-router-dom";
import Container from "../components/ui/Container.jsx";

function SessionLayout() {
  const { token } = useParams();

  // На будущее: здесь можно запросить данные сессии по token
  // и показать спиннер/ошибку, если токен невалиден.

  return (
    <div className="session-root">
      <header className="session-header">
        <Container className="session-header__inner">
          <div className="session-header__brand">
            <div className="session-header__logo">
              <span className="session-header__logo-icon">⚡</span>
              <span className="session-header__logo-text">ИНТЕРВЬЮ</span>
            </div>
          </div>
          <div className="session-header__meta">
            {/* Здесь позже можно вывести название компании/интервью */}
            <span className="session-header__badge">
              Автоматизированное интервью
            </span>
          </div>
        </Container>
      </header>

      <main className="session-main">
        <Container className="session-main__inner">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}

export default SessionLayout;