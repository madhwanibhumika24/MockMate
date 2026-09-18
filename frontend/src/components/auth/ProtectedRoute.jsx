import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../store/AuthContext.jsx";

/**
 * Wraps a route that requires a logged-in user. Shows a small loading state
 * while the session cookie is still being checked (so a page refresh doesn't
 * flash-redirect an already-logged-in user to /login), then either renders
 * the page or bounces to /login.
 *
 * `requireOnboarding` (default true) additionally sends a freshly-registered
 * user to /onboarding until they've completed or skipped it -- pass false
 * for /onboarding itself, which is the one page that must stay reachable
 * regardless of that status.
 */
function ProtectedRoute({ children, requireOnboarding = true }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarding && user.onboarding_status === "pending") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default ProtectedRoute;
