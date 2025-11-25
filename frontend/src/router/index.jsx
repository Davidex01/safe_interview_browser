// frontend/src/router/index.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import RootLayout from "../layouts/RootLayout.jsx";
import LandingPage from "../pages/Landing/LandingPage.jsx";
import NotFoundPage from "../pages/NotFound/NotFoundPage.jsx";

function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
        {/* В будущем: /candidate, /admin, /login и т.д. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;