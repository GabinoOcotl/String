import type { AuthError } from "@supabase/supabase-js";

export const GENERIC_AUTH_ERROR =
  "Something went wrong. Check your connection and try again.";

export const INIT_SESSION_ERROR =
  "We couldn't restore your session. Check your connection and try again.";

export function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before signing in.";
    case "user_already_registered":
      return "An account with this email already exists. Try signing in.";
    case "over_email_send_rate_limit":
      return "Too many emails sent. Please wait a few minutes and try again.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "validation_failed":
      return error.message || "Please check your email and password.";
    default:
      return error.message || GENERIC_AUTH_ERROR;
  }
}
