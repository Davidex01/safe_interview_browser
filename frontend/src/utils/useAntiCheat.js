// src/utils/useAntiCheat.js
import { useEffect, useRef } from "react";

/**
 * enabled: boolean — включать/выключать хук
 * token: string | undefined — токен сессии (для логирования на бэк)
 * onCheat: () => void — callback, который вызывается при первом серьёзном нарушении
 */
export function useAntiCheat(enabled, token, onCheat) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (!enabled || !token) return;

    const addEvent = async (type) => {
      const time = new Date().toISOString();

      // уже среагировали на читерство — не дёргаем повторно
      if (triggeredRef.current) return;
      triggeredRef.current = true;

      // 1. логируем событие на бэке
      try {
        await fetch(
          `/api/interview/${encodeURIComponent(token)}/cheat-event`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, time }),
          }
        );
      } catch (e) {
        console.error("Ошибка логирования cheat-event:", e);
      }

      // 2. вызываем callback (submit пустых решений + переход на отчёт)
      if (typeof onCheat === "function") {
        onCheat();
      }
    };

    // вкладка ушла в фон: переход на другую вкладку ИЛИ сворачивание окна
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addEvent("tab_hidden_or_minimized");
      }
    };

    // окно потеряло фокус (перешли в другое приложение)
    const handleBlur = () => {
      addEvent("window_blur");
    };

    // блокируем контекстное меню
    const handleContextMenu = (e) => {
      e.preventDefault();
      addEvent("context_menu");
    };

    // блокируем копирование
    const handleCopy = (e) => {
      e.preventDefault();
      addEvent("copy_attempt");
    };

    // блокируем вставку (Ctrl+V, Shift+Insert и т.п.)
    const handlePaste = (e) => {
      e.preventDefault();
      addEvent("paste_attempt");
    };

    // блокируем DevTools (F12, Ctrl+Shift+I)
    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"))
      ) {
        e.preventDefault();
        addEvent("devtools_attempt");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, token, onCheat]);
}