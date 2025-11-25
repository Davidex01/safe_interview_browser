import React from "react";
import Container from "../ui/Container.jsx";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container className="footer__inner">
        <div className="footer__left">
          <span className="footer__brand">Safe Interview</span>
          <span className="footer__copy">
            © {currentYear} Все права защищены.
          </span>
        </div>

        <nav className="footer__nav" aria-label="Навигация футера">
          <Link to="/about" className="footer__link">
            О платформе
          </Link>
          <Link to="/privacy" className="footer__link">
            Политика конфиденциальности
          </Link>
          <Link to="/terms" className="footer__link">
            Условия использования
          </Link>
          <Link to="/contacts" className="footer__link">
            Контакты
          </Link>
        </nav>
      </Container>
    </footer>
  );
}

export default Footer;