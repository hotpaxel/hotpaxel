use axum::{
    body::Body,
    extract::State,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

/// Authenticator trait allowing interchangeable authentication strategies.
pub trait Authenticator: Send + Sync {
    /// Returns true if authentication is active/enforced.
    fn is_enabled(&self) -> bool;

    /// Validates an incoming token string.
    fn validate_token(&self, token: &str) -> bool;
}

/// Simple token-based authenticator implementation.
#[derive(Clone)]
pub struct TokenAuthenticator {
    expected_token: Option<String>,
}

impl TokenAuthenticator {
    pub fn new(token: Option<String>) -> Self {
        let expected_token = token.and_then(|t| {
            let trimmed = t.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        });

        Self { expected_token }
    }
}

impl Authenticator for TokenAuthenticator {
    fn is_enabled(&self) -> bool {
        self.expected_token.is_some()
    }

    fn validate_token(&self, token: &str) -> bool {
        match &self.expected_token {
            Some(expected) => expected == token.trim(),
            None => true,
        }
    }
}

pub type SharedAuthenticator = Arc<dyn Authenticator>;

/// Extracts token from Authorization header, X-Auth-Token, or cookie.
pub fn extract_token<B>(req: &Request<B>) -> Option<String> {
    // 1. Authorization: Bearer <token>
    if let Some(auth_val) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(auth_str) = auth_val.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return Some(token.trim().to_string());
            }
        }
    }

    // 2. X-Auth-Token: <token>
    if let Some(token_val) = req.headers().get("x-auth-token") {
        if let Ok(token_str) = token_val.to_str() {
            return Some(token_str.trim().to_string());
        }
    }

    // 3. Cookie: hotpaxel_token=<token>
    if let Some(cookie_val) = req.headers().get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_val.to_str() {
            for cookie in cookie_str.split(';') {
                let mut parts = cookie.trim().splitn(2, '=');
                if let (Some(key), Some(val)) = (parts.next(), parts.next()) {
                    if key == "hotpaxel_token" {
                        return Some(val.trim().to_string());
                    }
                }
            }
        }
    }

    None
}

#[derive(Serialize)]
pub struct AuthStatusResponse {
    pub auth_required: bool,
    pub authenticated: bool,
}

#[derive(Deserialize)]
pub struct VerifyTokenRequest {
    pub token: String,
}

/// GET /api/auth/status
pub async fn auth_status(
    State(auth): State<SharedAuthenticator>,
    req: Request<Body>,
) -> impl IntoResponse {
    let auth_required = auth.is_enabled();
    let authenticated = if !auth_required {
        true
    } else {
        extract_token(&req).is_some_and(|token| auth.validate_token(&token))
    };

    Json(AuthStatusResponse {
        auth_required,
        authenticated,
    })
}

/// POST /api/auth/verify
pub async fn verify_token(
    State(auth): State<SharedAuthenticator>,
    Json(payload): Json<VerifyTokenRequest>,
) -> impl IntoResponse {
    if !auth.is_enabled() {
        return (
            StatusCode::OK,
            Json(json!({ "status": "ok", "authenticated": true })),
        )
            .into_response();
    }

    if auth.validate_token(&payload.token) {
        let cookie_header = format!(
            "hotpaxel_token={}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000",
            payload.token.trim()
        );
        (
            StatusCode::OK,
            [(header::SET_COOKIE, cookie_header)],
            Json(json!({ "status": "ok", "authenticated": true })),
        )
            .into_response()
    } else {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid token", "authenticated": false })),
        )
            .into_response()
    }
}

/// POST /api/auth/logout
pub async fn logout() -> impl IntoResponse {
    let cookie_header = "hotpaxel_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
    (
        StatusCode::OK,
        [(header::SET_COOKIE, cookie_header)],
        Json(json!({ "status": "ok", "authenticated": false })),
    )
}

/// Middleware to enforce authentication on protected endpoints.
pub async fn require_auth(
    State(auth): State<SharedAuthenticator>,
    req: Request<Body>,
    next: Next,
) -> Response {
    if !auth.is_enabled() {
        return next.run(req).await;
    }

    let path = req.uri().path();

    // Whitelisted paths (health checks, auth endpoints, docs)
    if path == "/health"
        || path == "/api/health"
        || path == "/version"
        || path == "/api/version"
        || path.starts_with("/api/auth/")
        || path.starts_with("/docs")
    {
        return next.run(req).await;
    }

    // Protected API & RPC paths
    let is_protected = path.starts_with("/api/") || path.starts_with("/hotpaxel.v1.");

    if is_protected {
        let is_valid = extract_token(&req).is_some_and(|token| auth.validate_token(&token));
        if !is_valid {
            let error_json = json!({
                "error": "Unauthorized",
                "message": "Valid authentication token required",
                "status": 401
            });
            return (
                StatusCode::UNAUTHORIZED,
                [(header::CONTENT_TYPE, "application/json")],
                Json(error_json).into_response(),
            )
                .into_response();
        }
    }

    next.run(req).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::Request;

    #[test]
    fn test_token_authenticator_disabled() {
        let auth = TokenAuthenticator::new(None);
        assert!(!auth.is_enabled());
        assert!(auth.validate_token("any_token"));

        let empty_auth = TokenAuthenticator::new(Some("   ".to_string()));
        assert!(!empty_auth.is_enabled());
    }

    #[test]
    fn test_token_authenticator_enabled() {
        let auth = TokenAuthenticator::new(Some("secret-token-123".to_string()));
        assert!(auth.is_enabled());
        assert!(auth.validate_token("secret-token-123"));
        assert!(auth.validate_token("  secret-token-123  "));
        assert!(!auth.validate_token("wrong-token"));
        assert!(!auth.validate_token(""));
    }

    #[test]
    fn test_extract_token_from_bearer() {
        let req = Request::builder()
            .header(header::AUTHORIZATION, "Bearer my-secret-token")
            .body(())
            .unwrap();

        assert_eq!(extract_token(&req), Some("my-secret-token".to_string()));
    }

    #[test]
    fn test_extract_token_from_header() {
        let req = Request::builder()
            .header("x-auth-token", "custom-header-token")
            .body(())
            .unwrap();

        assert_eq!(extract_token(&req), Some("custom-header-token".to_string()));
    }

    #[test]
    fn test_extract_token_from_cookie() {
        let req = Request::builder()
            .header(
                header::COOKIE,
                "other=abc; hotpaxel_token=cookie-token-value; foo=bar",
            )
            .body(())
            .unwrap();

        assert_eq!(extract_token(&req), Some("cookie-token-value".to_string()));
    }

    #[test]
    fn test_extract_token_none() {
        let req = Request::builder().body(()).unwrap();
        assert_eq!(extract_token(&req), None);
    }
}
