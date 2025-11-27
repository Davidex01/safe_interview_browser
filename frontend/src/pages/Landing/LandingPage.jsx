import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";
import TokenInputModal from "../../components/session/TokenInputModal.jsx";
import { getHrUser } from "../../utils/hrAuth.js";
import Section from "../../components/ui/Section.jsx";

function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <ForCandidatesSection />
      <ForCompaniesSection />
      <HowItWorksSection />
      <WhatWeMeasureSection />
      <AntiCheatSection />
    </div>
  );
}

function HeroSection() {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [hrUser, setHrUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // читаем того же HR-пользователя, что и Navbar
    const stored = getHrUser();
    if (stored) {
      setHrUser(stored);
    }
  }, []);

  const handleStartInterviewClick = () => {
    setIsTokenModalOpen(true);
  };

  const handleTokenSubmit = (token) => {
    setIsTokenModalOpen(false);
    navigate(`/session/${encodeURIComponent(token)}`);
  };

  const handleGoToWorkshop = () => {
    navigate("/hr/workshop");
  };

  return (
    <>
      <section className="landing-hero">
        <Container className="landing-hero__inner">
          <div className="landing-hero__content">
            <h1 className="landing-hero__title">
              Автоматизированные технические интервью
            </h1>
            <p className="landing-hero__subtitle">
              Платформа проводит техническое собеседование прямо в браузере:
              адаптивные задачи, безопасное выполнение кода в Docker и
              объективная оценка без человеческого фактора.
            </p>

            <div className="landing-hero__actions">
              <Button
                variant="primary"
                onClick={handleStartInterviewClick}
              >
                Начать интервью
              </Button>
              <Button
                as={Link}
                to="/demo"
                variant="secondary"
              >
                Демо для соискателя
              </Button>

              {/* Кнопка мастерской — только для залогиненных HR */}
              {hrUser && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleGoToWorkshop}
                >
                  Перейти в мастерскую
                </Button>
              )}
            </div>

            <p className="landing-hero__note">
              Не требуется установка. Всё работает в браузере.
            </p>
          </div>

          <div className="landing-hero__visual" aria-hidden="true">
            <div className="hero-mockup">
              <div className="hero-mockup__task">
                <div className="hero-mockup__task-title">
                  Задача: Найти дубликаты в массиве
                </div>
                <div className="hero-mockup__task-body">
                  Напишите функцию, которая возвращает все элементы,
                  встречающиеся более одного раза...
                </div>
              </div>
              <div className="hero-mockup__editor">
                <div className="hero-mockup__editor-header">
                  <span>solution.py</span>
                  <span className="hero-mockup__badge">Python</span>
                </div>
                <div className="hero-mockup__editor-body">
                  <code>
                    {`def find_duplicates(arr):\n    # Напишите ваше решение здесь\n    pass\n`}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <TokenInputModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSubmit={handleTokenSubmit}
      />
    </>
  );
}


function ForCandidatesSection() {
  return (
    <Section
      id="for-candidates"
      title="Как проходит интервью для кандидата"
      subtitle="Пишите код в знакомой среде, общайтесь с ИИ-интервьюером и получайте понятную обратную связь."
      className="landing-section--candidates"
    >
      <div className="landing-grid landing-grid--2">
        <div className="landing-grid__col">
          <ul className="landing-list">
            <li className="landing-list__item">
              <h3>Браузерная IDE</h3>
              <p>
                Пишите и запускайте код с подсветкой синтаксиса и
                автодополнением. Всё выполняется в изолированных
                Docker-контейнерах.
              </p>
            </li>
            <li className="landing-list__item">
              <h3>Короткие, реалистичные задачи</h3>
              <p>
                Задачи рассчитаны на 10–20 минут и позволяют показать реальные
                навыки, не устраивая марафон на несколько часов.
              </p>
            </li>
            <li className="landing-list__item">
              <h3>Мгновенная обратная связь</h3>
              <p>
                После завершения вы видите сильные стороны, зоны роста и
                рекомендации по развитию.
              </p>
            </li>
          </ul>
        </div>
        <div className="landing-grid__col">
          {/* Дополнительный визуальный блок / карта прогресса */}
          <div className="landing-card landing-card--mock">
            <h4>Ваш прогресс в интервью</h4>
            <ul className="landing-card__progress-list">
              <li>
                <span>Определение уровня</span>
                <span className="status status--done">Завершено</span>
              </li>
              <li>
                <span>Основная задача</span>
                <span className="status status--active">В процессе</span>
              </li>
              <li>
                <span>Обратная связь</span>
                <span className="status status--pending">Ожидается</span>
              </li>
            </ul>
            <p className="landing-card__note">
              Интерфейс показывает оставшееся время и шаги, помогая снизить
              волнение и не потеряться в процессе.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ForCompaniesSection() {
  return (
    <Section
      id="for-companies"
      title="Что даёт платформа компаниям"
      subtitle="Масштабируемые, объективные и автоматизированные технические интервью."
      className="landing-section--companies"
    >
      <div className="landing-grid landing-grid--3">
        <div className="landing-card">
          <h3>Единые и объективные оценки</h3>
          <p>
            Стандартизированные задачи и отчёты по навыкам: правильность,
            оптимальность, стиль кода.
          </p>
        </div>
        <div className="landing-card">
          <h3>Снижение затрат на интервью</h3>
          <p>
            ИИ проводит первичное техническое интервью 24/7. Команда подключается
            только к кандидатам, прошедшим порог.
          </p>
        </div>
        <div className="landing-card">
          <h3>Масштабируемость без потери качества</h3>
          <p>
            Проводите десятки и сотни интервью одновременно, сохраняя единый
            формат и критерии оценки.
          </p>
        </div>
        <div className="landing-card">
          <h3>Глубокая аналитика</h3>
          <p>
            Время решения, количество попыток, ошибки, динамика улучшения кода —
            всё доступно в одном отчёте.
          </p>
        </div>
        <div className="landing-card">
          <h3>Гибкая настройка интервью</h3>
          <p>
            Задавайте направления, уровни, лимиты времени и приоритеты метрик
            через административную панель.
          </p>
        </div>
      </div>

      <div className="landing-section__cta">
        <Button as={Link} to="/demo/report" variant="primary">
          Посмотреть пример отчёта
        </Button>
      </div>
    </Section>
  );
}

function HowItWorksSection() {
  return (
    <Section
      id="how-it-works"
      title="Как это работает"
      subtitle="От приглашения до финального отчёта — полностью автоматизированный процесс."
      className="landing-section--how"
    >
      <ol className="steps-list">
        <li>
          <h3>1. Определение уровня</h3>
          <p>
            ИИ выдаёт стартовую задачу, чтобы оценить базовый уровень. Кандидат
            пишет код в браузере, запускает тесты и общается с интервьюером.
          </p>
        </li>
        <li>
          <h3>2. Адаптивные задачи</h3>
          <p>
            В зависимости от качества решения ИИ подбирает следующие задачи,
            сохраняя общий лимит времени интервью.
          </p>
        </li>
        <li>
          <h3>3. Финальный отчёт</h3>
          <p>
            Система формирует детальный отчёт по всем ключевым метрикам и даёт
            рекомендации по дальнейшему общению с кандидатом.
          </p>
        </li>
      </ol>

      <p className="landing-note">
        Весь код запускается в изолированных Docker-контейнерах с ограничениями
        по времени и ресурсам, обеспечивая безопасность и честную оценку.
      </p>
    </Section>
  );
}

function WhatWeMeasureSection() {
  return (
    <Section
      title="Что оценивает ИИ-интервьюер"
      subtitle="Не субъективное впечатление, а конкретные метрики."
      className="landing-section--metrics"
    >
      <div className="landing-grid landing-grid--3">
        <div className="landing-card">
          <h3>Правильность решения</h3>
          <p>
            Прохождение тест-кейсов, корректность обработки граничных и
            неочевидных случаев.
          </p>
        </div>
        <div className="landing-card">
          <h3>Оптимальность</h3>
          <p>
            Время выполнения и использование ресурсов, оценка сложности
            алгоритма и пригодность для продакшена.
          </p>
        </div>
        <div className="landing-card">
          <h3>Стиль и читаемость кода</h3>
          <p>
            Структура кода, нейминг, разбиение на функции, наличие и качество
            комментариев.
          </p>
        </div>
        <div className="landing-card">
          <h3>Работа под ограничениями</h3>
          <p>
            Как кандидат управляет временем, количеством попыток и реакцией на
            ошибки во время решения задачи.
          </p>
        </div>
        <div className="landing-card">
          <h3>Честность выполнения</h3>
          <p>
            Сигналы о возможном читерстве: подозрительные вставки кода,
            переключения вкладок и другие аномалии поведения.
          </p>
        </div>
      </div>
    </Section>
  );
}

function AntiCheatSection() {
  return (
    <Section
      title="Защита от читерства"
      subtitle="Честным кандидатам — комфортная среда. Системе — доверие к результатам."
      className="landing-section--anticheat"
    >
      <div className="landing-grid landing-grid--2">
        <div className="landing-grid__col">
          <ul className="landing-list">
            <li className="landing-list__item">
              <h3>Мониторинг копипаста</h3>
              <p>
                Система фиксирует объём и характер вставляемого кода, помогая
                отличать нормальное использование буфера от подозрительных
                паттернов.
              </p>
            </li>
            <li className="landing-list__item">
              <h3>Сигналы активности браузера</h3>
              <p>
                Переключения вкладок, активность DevTools и другие события
                учитываются ИИ при формировании итоговой оценки.
              </p>
            </li>
          </ul>
        </div>

        <div className="landing-grid__col">
          <div className="landing-card landing-card--note">
            <p>
              Защита от читерства не блокирует работу и не мешает честным
              кандидатам. Она даёт системе дополнительный контекст для
              интерпретации результатов интервью.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default LandingPage;