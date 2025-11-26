import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";

function DemoStartPage() {
  const navigate = useNavigate();

  const handleStartDemo = () => {
    navigate("/demo/interview");
  };

  return (
    <section className="demo-start">
      <Container className="demo-start__inner">
        <h1>Демо-интервью</h1>
        <p className="demo-start__subtitle">
          Это демо-режим платформы Safe Interview. Вы пройдёте сокращённое
          интервью: 5 задач, ограниченное время и итоговый отчёт — всё как в
          настоящем процессе, но без сохранения результатов.
        </p>
        <ul className="demo-start__list">
          <li>Фиксированный набор задач по разным темам.</li>
          <li>Таймер интервью (например, 30 минут).</li>
          <li>Рабочее пространство с условием, редактором и тестами.</li>
          <li>Итоговая страница со сводной статистикой (демо-данные).</li>
        </ul>

        <div className="demo-start__actions">
          <Button variant="primary" onClick={handleStartDemo}>
            Начать демо-интервью
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default DemoStartPage;