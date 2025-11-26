import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";

function HrLoginForm({ onSuccess, isSubmitting = false, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setTouched({ email: true, password: true });
      return;
    }
    onSuccess?.({ email, password });
  };

  const emailError =
    touched.email && !email ? "Введите e-mail" : null;
  const passwordError =
    touched.password && !password ? "Введите пароль" : null;

  return (
    <form className="hr-login-form" onSubmit={handleSubmit}>
      <div className="hr-login-form__field">
        <label htmlFor="hr-email">E-mail</label>
        <input
          id="hr-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() =>
            setTouched((prev) => ({ ...prev, email: true }))
          }
          autoComplete="email"
        />
        {emailError && (
          <div className="hr-login-form__error">{emailError}</div>
        )}
      </div>

      <div className="hr-login-form__field">
        <label htmlFor="hr-password">Пароль</label>
        <input
          id="hr-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() =>
            setTouched((prev) => ({ ...prev, password: true }))
          }
          autoComplete="current-password"
        />
        {passwordError && (
          <div className="hr-login-form__error">
            {passwordError}
          </div>
        )}
      </div>

      {error && (
        <div className="hr-login-form__error hr-login-form__error--global">
          {error}
        </div>
      )}

      <div className="hr-login-form__actions">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Вход..." : "Войти"}
        </Button>
      </div>
    </form>
  );
}

HrLoginForm.propTypes = {
  onSuccess: PropTypes.func,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
};

export default HrLoginForm;