import React from "react";

function SessionDeclinedPage() {
  return (
    <section className="session-declined">
      <div className="session-declined__card">
        <h1>Собеседование не начато</h1>
        <p>
          Вы не приняли условия проведения интервью, поэтому сессия не была
          запущена.
        </p>
        <p>
          Если это произошло по ошибке, обратитесь к представителю компании за
          новой ссылкой или уточнением формата интервью.
        </p>
      </div>
    </section>
  );
}

export default SessionDeclinedPage;