"""Sends transactional email over SMTP (Gmail by default -- see backend/.env.example
for how to get an app password). Uses the standard library only, so no extra
dependency or native build step is needed.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


class EmailSendError(RuntimeError):
    """Raised when the SMTP send itself fails (bad credentials, host down, ...)."""


def send_email(to_email: str, subject: str, html_body: str, text_body: str | None = None) -> None:
    if not settings.smtp_username or not settings.smtp_password:
        raise EmailSendError(
            "SMTP is not configured yet -- fill in SMTP_USERNAME/SMTP_PASSWORD "
            "(and SMTP_FROM_EMAIL) in backend/.env."
        )

    from_email = settings.smtp_from_email or settings.smtp_username

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{from_email}>"
    message["To"] = to_email

    if text_body:
        message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(from_email, [to_email], message.as_string())
    except (smtplib.SMTPException, OSError) as exc:
        raise EmailSendError(f"Couldn't send email via SMTP: {exc}") from exc


def send_reset_code_email(to_email: str, code: str, expire_minutes: int) -> None:
    subject = "Your MockMate password reset code"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Reset your password</h2>
      <p style="color: #334155; font-size: 15px;">
        Use this code to reset your MockMate password. It expires in
        {expire_minutes} minutes.
      </p>
      <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;
                  background: #eef2ff; padding: 16px 24px; border-radius: 12px;
                  text-align: center; margin: 20px 0;">
        {code}
      </div>
      <p style="color: #64748b; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """
    text_body = (
        f"Your MockMate password reset code is {code}. It expires in {expire_minutes} minutes. "
        "If you didn't request this, you can ignore this email."
    )
    send_email(to_email, subject, html_body, text_body)
