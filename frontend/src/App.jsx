/**
 * Point d'entrée de l'application.
 * Routes : /login (public), /dashboard et /projects/new (protégées).
 * App Shell (sidebar + topbar) wrappe les routes protégées.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "./api/auth.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateProjectPage from "./pages/CreateProjectPage.jsx";
import ProjectDetailsPage from "./pages/ProjectDetailsPage.jsx";
import SupervisionRequestsPage from "./pages/SupervisionRequestsPage.jsx";

function LoginRedirect({ children }) {
  const token = getAccessToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginRedirect>
              <LoginPage />
            </LoginRedirect>
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/supervision-requests" element={<SupervisionRequestsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
