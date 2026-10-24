
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth, ROLE_HOME } from "../../context/AuthContext";

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to={ROLE_HOME[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}
