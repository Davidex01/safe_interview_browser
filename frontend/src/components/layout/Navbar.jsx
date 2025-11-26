import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";
import HrLoginForm from "../auth/HrLoginForm.jsx";
import HrRegisterForm from "../auth/HrRegisterForm.jsx";
import { getHrUser, saveHrUser } from "../../utils/hrAuth.js";
import { loginHr, registerHr } from "../../api/hrAuthApi.js";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === "/";
  const isHrWorkshop = location.pathname.startsWith("/hr");
  const isDemoRoute = location.pathname.startsWith("/demo");

  const [hrUser, setHrUser] = useState(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    const stored = getHrUser();
    if (stored) {
      setHrUser(stored);
    }
  }, []);

  const handleLoginClick = () => {
    setAuthMode("login");
    setLoginError("");
    setRegisterError("");
    setIsAuthOpen(true);
  };

  const handleLoginSubmit = async ({ email, password }) => {
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const data = await loginHr({ email, password });

      const user = data.user || {
        id: data.id,
        email: data.email,
        name: data.name,
        company: data.company,
      };

      saveHrUser(user);
      setHrUser(user);

      setIsAuthOpen(false);

      if (!isHrWorkshop) {
        navigate("/hr/workshop");
      }
    } catch (e) {
      if (e.status === 401) {
        setLoginError("Неверный e-mail или пароль.");
      } else {
        setLoginError("Не удалось войти. Попробуйте ещё раз.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (payload) => {
    setIsRegistering(true);
    setRegisterError("");

    try {
      const data = await registerHr(payload);

      const user = data.user || {
        id: data.id,
        email: data.email,
        name: data.name,
        company: data.company,
      };

      saveHrUser(user);
      setHrUser(user);

      setIsAuthOpen(false);
      navigate("/hr/workshop");
    } catch (e) {
      if (e.status === 409) {
        setRegisterError("Пользователь с таким e-mail уже существует.");
      } else {
        setRegisterError(
          "Не удалось зарегистрироваться. Попробуйте ещё раз."
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const hrLabel = hrUser?.email || "";

  return (
    <>
      <header className="navbar">
        <Container className="navbar__inner">
          <div className="navbar__logo">
            <Link to="/" aria-label="Safe Interview Home">
              <span className="navbar__logo-text">Safe Interview</span>
            </Link>
          </div>

          {isLanding && (
            <nav className="navbar__nav" aria-label="Главная навигация">
              <a href="#how-it-works" className="navbar__link">
                Как это работает
              </a>
              <a href="#for-candidates" className="navbar__link">
                Для кандидатов
              </a>
              <a href="#for-companies" className="navbar__link">
                Для компаний
              </a>
            </nav>
          )}

          <div className="navbar__actions">
            {hrUser ? (
              <span className="navbar__user">{hrLabel}</span>
            ) : (
              <Button
                variant="ghost"
                className="navbar__button"
                onClick={handleLoginClick}
              >
                Войти
              </Button>
            )}

            {/* Справа-сверху: демо или возврат на главную */}
            {!isHrWorkshop && (
              isDemoRoute ? (
                <Button
                  type="button"
                  variant="primary"
                  className="navbar__button"
                  onClick={() => navigate("/")}
                >
                  Вернуться на главную
                </Button>
              ) : (
                <Button
                  as={Link}
                  to="/demo"
                  variant="primary"
                  className="navbar__button"
                >
                  Попробовать демо
                </Button>
              )
            )}
          </div>
        </Container>
      </header>

      {!hrUser && (
        <Modal
          isOpen={isAuthOpen}
          onClose={() => {
            if (!isLoggingIn && !isRegistering) setIsAuthOpen(false);
          }}
          title={
            authMode === "login"
              ? "Вход для компаний"
              : "Регистрация HR-аккаунта"
          }
        >
          {authMode === "login" ? (
            <>
              <HrLoginForm
                onSuccess={handleLoginSubmit}
                isSubmitting={isLoggingIn}
                error={loginError}
              />
              <div className="hr-auth-switch">
                <span>Нет аккаунта?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setLoginError("");
                  }}
                >
                  Зарегистрироваться
                </button>
              </div>
            </>
          ) : (
            <>
              <HrRegisterForm
                onSubmit={handleRegisterSubmit}
                isSubmitting={isRegistering}
                error={registerError}
              />
              <div className="hr-auth-switch">
                <span>Уже есть аккаунт?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setRegisterError("");
                  }}
                >
                  Войти
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

export default Navbar;