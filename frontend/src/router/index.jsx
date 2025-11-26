// src/router/index.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import RootLayout from "../layouts/RootLayout.jsx";
import SessionLayout from "../layouts/SessionLayout.jsx";

import LandingPage from "../pages/Landing/LandingPage.jsx";
import NotFoundPage from "../pages/NotFound/NotFoundPage.jsx";

import HrWorkshopPage from "../pages/Hr/HrWorkshopPage.jsx";

import SessionConsentPage from "../pages/Session/SessionConsentPage.jsx";
import SessionDeclinedPage from "../pages/Session/SessionDeclinedPage.jsx";
import SessionInterviewPage from "../pages/Session/SessionInterviewPage.jsx";
import SessionReportPage from "../pages/Session/SessionReportPage.jsx";

import DemoStartPage from "../pages/Demo/DemoStartPage.jsx";
import DemoInterviewPage from "../pages/Demo/DemoInterviewPage.jsx";
import DemoReportPage from "../pages/Demo/DemoReportPage.jsx";

function AppRouter() {
  return (
    <Routes>
      {/* Публичная часть + HR */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoStartPage />} />
        <Route path="/demo/interview" element={<DemoInterviewPage />} />
        <Route path="/demo/report" element={<DemoReportPage />} />
        <Route path="/hr/workshop" element={<HrWorkshopPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Интервью по приглашению */}
      <Route path="/session/:token" element={<SessionLayout />}>
        <Route index element={<SessionConsentPage />} />
        <Route path="declined" element={<SessionDeclinedPage />} />
        <Route path="interview" element={<SessionInterviewPage />} />
        <Route path="report" element={<SessionReportPage />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;