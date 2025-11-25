import React from "react";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="not-found">
      <Container className="not-found__inner">
        <h1>Страница не найдена</h1>
        <p>
          Возможно, ссылка устарела или была введена некорректно.
        </p>
        <Button as={Link} to="/" variant="primary">
          Вернуться на главную
        </Button>
      </Container>
    </section>
  );
}

export default NotFoundPage;