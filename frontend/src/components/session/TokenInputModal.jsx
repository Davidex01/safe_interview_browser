import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

function TokenInputModal({ isOpen, onClose, onSubmit }) {
  const [token, setToken] = useState("");
  const [touched, setTouched] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const trimmed = token.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setToken("");
    setTouched(false);
  };

  const showError = touched && !token.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setToken("");
        setTouched(false);
        onClose?.();
      }}
      title="Введите токен приглашения"
    >
      <form onSubmit={handleSubmit} className="token-input-form">
        <div className="token-input-form__field">
          <label htmlFor="interview-token">
            Токен интервью
          </label>
          <input
            id="interview-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Например: abcd1234..."
          />
          {showError && (
            <div className="token-input-form__error">
              Введите токен, указанный в приглашении.
            </div>
          )}
        </div>

        <div className="token-input-form__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!token.trim()}
          >
            Перейти к интервью
          </Button>
        </div>
      </form>
    </Modal>
  );
}

TokenInputModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func, // (token: string) => void
};

export default TokenInputModal;