/**
 * Client-side constants and auth helpers.
 * Manus OAuth (startLogin / OAUTH_STATE_COOKIE) has been removed.
 * Login is now handled by the /login page with email + password.
 */
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Navigate to the login page.
 * Call this from an event handler, never during render.
 */
export const startLogin = () => {
  window.location.href = "/login";
};
