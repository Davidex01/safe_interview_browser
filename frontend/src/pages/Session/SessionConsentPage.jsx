import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

function SessionConsentPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [trackingAccepted, setTrackingAccepted] = useState(false);

  const allAccepted = rulesAccepted && trackingAccepted;

  const handleStart = () => {
    if (!allAccepted) return;

    // На будущее: здесь можно вызвать API "подтвердить согласие"
    // и только после успешного ответа перенаправлять.

    navigate(`/session/${token}/interview`, { replace: false });
  };

  const handleDecline = () => {
    // Можно сразу редиректить на /declined
    navigate(`/session/${token}/declined`, { replace: true });
  };

  return (
    <section className="session-consent">
      <div className="session-consent__card">
        <h1 className="session-consent__title">
          Приглашение на техническое интервью
        </h1>
        <p className="session-consent__intro">
          Вы приглашены на автоматизированное техническое интервью на платформе{" "}
          <strong>Safe Interview</strong>. Интервью проходит в браузере и
          включает решение задач в IDE и фидбэк от ИИ-интервьюера.
        </p>

        <div className="session-consent__block">
          <h2>Как будет проходить интервью</h2>
          <ul>
            <li>Вы получите одну или несколько задач по выбранному направлению.</li>
            <li>Код пишется и запускается прямо в браузере, в защищённой среде.</li>
            <li>По завершении система сформирует отчёт по результатам.</li>
          </ul>
        </div>

        <div className="session-consent__block">
          <h2>Правила и условия</h2>
          <p>
            Чтобы обеспечить честную и объективную оценку, во время интервью
            фиксируются некоторые действия в браузере:
          </p>
          <ul>
            <li>переключения между вкладками и сворачивание окна;</li>
            <li>потеря фокуса окна (переход в другие приложения);</li>
            <li>использование контекстного меню (правый клик мышью);</li>
            <li>попытки копирования и вставки текста/кода;</li>
            <li>попытки открыть инструменты разработчика (DevTools, F12 и т.п.).</li>
          </ul>
          <p>
            Эти данные используются только для анализа хода интервью и формирования
            итоговой оценки.
          </p>
        </div>

        <div className="session-consent__block">
          <h2>Античит‑контроль</h2>
          <p>
            Во время интервью действуют жёсткие правила защиты от списывания:
          </p>
          <ul>
            <li>
              <strong>Запрещено переключаться на другие вкладки и окна</strong> во время решения задачи.
            </li>
            <li>
              <strong>Запрещено копировать и вставлять код или текст</strong> (Ctrl+C, Ctrl+V, правый клик мыши и т.п.).
            </li>
            <li>
              <strong>Запрещено открывать инструменты разработчика браузера</strong> (DevTools, F12, Ctrl+Shift+I и аналогичные сочетания).
            </li>
          </ul>
          <p>
            При фиксации попытки нарушить эти правила интервью может быть
            <strong> немедленно остановлено</strong>, а результаты собеседования
            засчитаны как неуспешные.
          </p>
        </div>

        <div className="session-consent__checkboxes">
          <label className="session-consent__checkbox">
            <input
              type="checkbox"
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
            />
            <span>
              Я ознакомился(лась) с правилами проведения интервью и понимаю,
              как оно будет проходить.
            </span>
          </label>
          <label className="session-consent__checkbox">
            <input
              type="checkbox"
              checked={trackingAccepted}
              onChange={(e) => setTrackingAccepted(e.target.checked)}
            />
            <span>
              Я согласен(на) на фиксирование описанных действий в браузере в
              целях оценки моих навыков во время интервью.
            </span>
          </label>
        </div>

        <div className="session-consent__actions">
          <Button
            variant="primary"
            disabled={!allAccepted}
            onClick={handleStart}
          >
            Начать интервью
          </Button>
          <Button
            variant="ghost"
            onClick={handleDecline}
          >
            Отказаться
          </Button>
        </div>

        <p className="session-consent__note">
          Если у вас есть вопросы по формату интервью, свяжитесь, пожалуйста, с
          представителем компании, которая выдала вам эту ссылку.
        </p>

        {/* Опционально: ссылка на политику */}
        <p className="session-consent__small">
          <Link to="/privacy">Политика конфиденциальности</Link>
        </p>
      </div>
    </section>
  );
}

export default SessionConsentPage;