import { useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout.jsx";
import Button from "../components/common/Button.jsx";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setSubmitting(true);
    setSubmitted(true);
  };

  return (
    <AuthLayout
      eyebrow="Reset password"
      title={submitted ? "Check your email" : "Forgot your password?"}
      description="No worries -- enter your email and we'll send you a link to get back in."
      showOAuth={false}
      footer={
        !submitted && (
          <>
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </>
        )
      }
    >
      {submitted ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-700">
            If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a reset
            link is on its way.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button type="submit" loading={submitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
