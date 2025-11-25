import React from "react";
import { Link, useLocation } from "react-router-dom";
import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";

function Navbar() {
  const location = useLocation();

  // В будущем можно скрывать часть навигации на внутренних страницах.
  const isLanding = location.pathname === "/";

  return (
    <header className="navbar">
      <Container className="navbar__inner">
        <div className="navbar__logo">
          <Link to="/" aria-label="Safe Interview Home">
            {/* Можно заменить на svg/изображение */}
            <span className="navbar__logo-text">Safe Interview</span>
          </Link>
        </div>

        {isLanding && (
          <nav className="navbar__nav" aria-label="Главная навигация">
            <a href="#how-it-works" className="navbar__link">
              Как это работает
            </a>
            <a href="#for-candidates" className="navbar__link">
              Для кандидатов
            </a>
            <a href="#for-companies" className="navbar__link">
              Для компаний
            </a>
          </nav>
        )}

        <div className="navbar__actions">
          {/* В будущем: реальный роут на /login и /demo */}
          <Button
            as={Link}
            to="/login"
            variant="ghost"
            className="navbar__button"
          >
            Войти
          </Button>
          <Button
            as={Link}
            to="/demo"
            variant="primary"
            className="navbar__button"
          >
            Попробовать демо
          </Button>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;