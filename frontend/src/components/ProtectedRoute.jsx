/**
 * Protection des routes : si non authentifié, redirection vers /login.
 */

import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken } from "../api/auth.js";

export default function ProtectedRoute({ children }) {
  const token = getAccessToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
