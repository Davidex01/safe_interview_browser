import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

function Modal({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="ui-modal-backdrop"
      onMouseDown={handleBackdropClick}
    >
      <div className={clsx("ui-modal", className)}>
        <div className="ui-modal__header">
          {title && <h2 className="ui-modal__title">{title}</h2>}
          <button
            type="button"
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Modal;