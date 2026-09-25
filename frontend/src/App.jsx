import { Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Footer from "./components/common/Footer.jsx";
import Header from "./components/common/Header.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Feedback from "./pages/Feedback.jsx";
import Home from "./pages/Home.jsx";
import Interview from "./pages/Interview.jsx";
import InterviewPrepare from "./pages/InterviewPrepare.jsx";
import Login from "./pages/Login.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Signup from "./pages/Signup.jsx";
import StartInterview from "./pages/StartInterview.jsx";

// Pages with no marketing chrome at all -- auth pages keep a stripped-down
// header (handled inside Header.jsx) but still show the footer's nav; the
// app shell pages below bring their own header (or none) instead of the
// marketing one. Matched by first path segment rather than exact strings so
// dynamic routes like /interview/:sessionId and /feedback/:sessionId are
// covered too, without having to remember to add every new protected page
// here one at a time.
const AUTH_ROUTES = ["/login", "/signup", "/reset-password"];
const APP_SHELL_SEGMENTS = ["dashboard", "onboarding", "start", "interview", "feedback"];

function App() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const isAppShellPage = APP_SHELL_SEGMENTS.includes(pathname.split("/")[1]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {!isAppShellPage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/start"
            element={
              <ProtectedRoute>
                <StartInterview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/prepare"
            element={
              <ProtectedRoute>
                <InterviewPrepare />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:sessionId"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback/:sessionId"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isAuthPage && !isAppShellPage && <Footer />}
    </div>
  );
}

export default App;
