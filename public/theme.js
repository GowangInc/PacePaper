// Theme: light/dark appearance, chosen independently for the teacher and
// student surfaces. The choice persists per surface in localStorage; before
// any explicit choice the page follows the operating-system preference.
const STORAGE_PREFIX = "pacepaper:theme:";
const KEY = (role) => `${STORAGE_PREFIX}${role}`;

export function themeRoleForPath(path = location.pathname) {
  return path.startsWith("/student") ? "student" : "teacher";
}

export function storedTheme(role) {
  try {
    const value = localStorage.getItem(KEY(role));
    if (value === "light" || value === "dark") return value;
  } catch {
    // localStorage unavailable (private mode, file URL): follow the system.
  }
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Set the initial theme as early as possible to avoid a light flash. */
export function initTheme(role) {
  document.documentElement.dataset.themeRole = role;
  document.documentElement.dataset.theme = storedTheme(role);
  syncThemeButtons();
  observeThemeButtons();
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-theme-action]");
    if (!button) return;
    const next = button.dataset.themeAction;
    if (next !== "light" && next !== "dark") return;
    applyTheme(next);
  });
}

export function applyTheme(theme, role = document.documentElement.dataset.themeRole ?? "teacher") {
  if (theme !== "light" && theme !== "dark") return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY(role), theme);
  } catch {
    // Persisting is optional; the in-memory choice still applies.
  }
  syncThemeButtons();
}

function themeButtons() {
  return Array.from(document.querySelectorAll("[data-theme-action]"));
}

function syncThemeButtons() {
  const current = document.documentElement.dataset.theme;
  for (const button of themeButtons()) {
    button.setAttribute("aria-pressed", String(button.dataset.themeAction === current));
  }
}

let observing = false;
function observeThemeButtons() {
  if (observing || typeof MutationObserver === "undefined") return;
  observing = true;
  // Views are swapped with innerHTML; resync pressed state when new toggle
  // buttons appear so the active option stays highlighted.
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && (node.matches?.("[data-theme-action]") || node.querySelector?.("[data-theme-action]"))) {
          syncThemeButtons();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** A labelled pair of Light/Dark buttons; insert once per surface. */
export function themeToggleMarkup() {
  return `
    <span class="theme-toggle" role="group" aria-label="Appearance">
      <button type="button" data-theme-action="light" aria-pressed="false">Light</button>
      <button type="button" data-theme-action="dark" aria-pressed="false">Dark</button>
    </span>`;
}
