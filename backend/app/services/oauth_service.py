"""Minimal OAuth2 "authorization code" flow for Google and GitHub sign-in,
built directly on httpx (already a dependency) instead of an OAuth library --
there are only two providers and each is a couple of well-documented REST
calls, so a small extra dependency isn't worth it.
"""

from urllib.parse import urlencode

import httpx

from app.core.config import get_settings

settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


class OAuthError(RuntimeError):
    """Raised when a provider rejects the code exchange or the profile fetch fails."""


def build_google_auth_url(state: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def fetch_google_profile(code: str) -> dict:
    """Exchanges an authorization code for a Google profile: {email, name, provider_id}."""
    with httpx.Client(timeout=10) as client:
        token_response = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise OAuthError(f"Google token exchange failed: {token_response.text}")
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise OAuthError("Google did not return an access token.")

        userinfo_response = client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise OAuthError(f"Google profile fetch failed: {userinfo_response.text}")
        profile = userinfo_response.json()

    email = profile.get("email")
    if not email:
        raise OAuthError("Google account has no email on file.")

    return {
        "email": email,
        "name": profile.get("name") or email.split("@")[0],
        "provider_id": profile.get("sub"),
    }


def build_github_auth_url(state: str) -> str:
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "read:user user:email",
        "state": state,
    }
    return f"{GITHUB_AUTH_URL}?{urlencode(params)}"


def fetch_github_profile(code: str) -> dict:
    """Exchanges an authorization code for a GitHub profile: {email, name, provider_id}."""
    with httpx.Client(timeout=10) as client:
        token_response = client.post(
            GITHUB_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code != 200:
            raise OAuthError(f"GitHub token exchange failed: {token_response.text}")
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise OAuthError("GitHub did not return an access token.")

        auth_headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
        user_response = client.get(GITHUB_USER_URL, headers=auth_headers)
        if user_response.status_code != 200:
            raise OAuthError(f"GitHub profile fetch failed: {user_response.text}")
        profile = user_response.json()

        email = profile.get("email")
        if not email:
            # GitHub only returns a public email here if the user set one --
            # otherwise look it up from their (possibly private) email list.
            emails_response = client.get(GITHUB_EMAILS_URL, headers=auth_headers)
            if emails_response.status_code == 200:
                emails = emails_response.json()
                primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                email = (primary or next((e for e in emails if e.get("verified")), {})).get("email")

    if not email:
        raise OAuthError(
            "Your GitHub account has no verified email address we can use. "
            "Add one at github.com/settings/emails and try again."
        )

    return {
        "email": email,
        "name": profile.get("name") or profile.get("login"),
        "provider_id": str(profile.get("id")),
    }
