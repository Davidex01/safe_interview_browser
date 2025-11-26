import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";

function HrRegisterForm({ onSubmit, isSubmitting = false, error }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
  });

  const [touched, setTouched] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Введите e-mail";
    if (!form.password) errs.password = "Введите пароль";
    if (form.password && form.password.length < 8) {
      errs.password = "Пароль должен быть не короче 8 символов";
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = "Подтвердите пароль";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Пароли не совпадают";
    }
    return errs;
  };

  const errors = validate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (Object.keys(errors).length > 0) return;

    onSubmit?.({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim() || undefined,
      company: form.company.trim() || undefined,
    });
  };

  const showError = (field) => touched[field] && errors[field];

  return (
    <form className="hr-register-form" onSubmit={handleSubmit}>
      <div className="hr-register-form__field">
        <label htmlFor="hr-reg-email">E-mail</label>
        <input
          id="hr-reg-email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          autoComplete="email"
        />
        {showError("email") && (
          <div className="hr-register-form__error">
            {errors.email}
          </div>
        )}
      </div>

      <div className="hr-register-form__field">
        <label htmlFor="hr-reg-password">Пароль</label>
        <input
          id="hr-reg-password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          autoComplete="new-password"
        />
        {showError("password") && (
          <div className="hr-register-form__error">
            {errors.password}
          </div>
        )}
      </div>

      <div className="hr-register-form__field">
        <label htmlFor="hr-reg-confirm">
          Подтверждение пароля
        </label>
        <input
          id="hr-reg-confirm"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          autoComplete="new-password"
        />
        {showError("confirmPassword") && (
          <div className="hr-register-form__error">
            {errors.confirmPassword}
          </div>
        )}
      </div>

      <div className="hr-register-form__field">
        <label htmlFor="hr-reg-name">Имя (опционально)</label>
        <input
          id="hr-reg-name"
          type="text"
          value={form.name}
          onChange={handleChange("name")}
          onBlur={handleBlur("name")}
        />
      </div>

      <div className="hr-register-form__field">
        <label htmlFor="hr-reg-company">
          Компания (опционально)
        </label>
        <input
          id="hr-reg-company"
          type="text"
          value={form.company}
          onChange={handleChange("company")}
          onBlur={handleBlur("company")}
        />
      </div>

      {error && (
        <div className="hr-register-form__error hr-register-form__error--global">
          {error}
        </div>
      )}

      <div className="hr-register-form__actions">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
      </div>
    </form>
  );
}

HrRegisterForm.propTypes = {
  onSubmit: PropTypes.func,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
};

export default HrRegisterForm;