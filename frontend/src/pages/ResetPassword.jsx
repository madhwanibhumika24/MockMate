import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout.jsx";
import OtpCodeInput from "../components/auth/OtpCodeInput.jsx";
import Button from "../components/common/Button.jsx";

const CODE_LENGTH = 6;
const CODE_TTL_SECONDS = 5 * 60;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ResetPassword() {
  // "email" -> "code" -> "password" -> "done"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Count the code down to 0 while the code step is showing.
  useEffect(() => {
    if (step !== "code") return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const codeExpired = secondsLeft <= 0;

  const handleEmailSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setCode("");
    setSecondsLeft(CODE_TTL_SECONDS);
    setStep("code");
  };

  const handleResendCode = () => {
    // TODO: trigger the backend to actually generate and email a new code
    // once real auth is wired up -- this just resets the mock timer for now.
    setCode("");
    setSecondsLeft(CODE_TTL_SECONDS);
    setError("");
  };

  const handleCodeSubmit = (event) => {
    event.preventDefault();
    if (codeExpired) {
      setError("This code has expired. Send a new one and try again.");
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setError("");
    setStep("password");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    setStep("done");
  };

  const stepCopy = {
    email: { eyebrow: "Reset password", title: "Forgot your password?" },
    code: { eyebrow: "Check your email", title: "Enter the verification code" },
    password: { eyebrow: "Almost done", title: "Choose a new password" },
    done: { eyebrow: "All set", title: "Password reset" },
  }[step];

  return (
    <AuthLayout
      eyebrow={stepCopy.eyebrow}
      title={stepCopy.title}
      description="No worries -- we'll send a 6-digit code to verify it's really you, valid for 5 minutes."
      showOAuth={false}
      footer={
        step !== "done" && (
          <>
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </>
        )
      }
    >
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label htmlFor="resetEmail" className="field-label">
              Email
            </label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="input-field"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <Button type="submit" className="w-full">
            Send reset code
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="space-y-5">
          <p className="text-center text-sm text-slate-600">
            We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>.
          </p>

          <OtpCodeInput value={code} onChange={setCode} disabled={codeExpired} />

          <p className={`text-center text-xs font-medium ${codeExpired ? "text-red-600" : "text-slate-500"}`}>
            {codeExpired ? "Code expired" : `Expires in ${formatTime(secondsLeft)}`}
          </p>

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <Button type="submit" className="w-full" disabled={codeExpired}>
            Verify code
          </Button>

          <p className="text-center text-sm text-slate-600">
            Didn&rsquo;t get it?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Resend code
            </button>
          </p>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="field-label">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="********"
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="field-label">
              Confirm new password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="********"
              className="input-field"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <Button type="submit" loading={submitting} className="w-full">
            Reset password
          </Button>
        </form>
      )}

      {step === "done" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-emerald-600">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-700">
            Your password has been reset. You can now log in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            Back to log in
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
