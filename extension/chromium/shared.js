const DASHBOARD_URL_KEY = "dashboardUrl";

function normalizeDashboardUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS dashboard URLs are supported.");
  }

  return parsed.toString();
}

function getDashboardUrl() {
  return chrome.storage.sync.get(DASHBOARD_URL_KEY).then((result) => result[DASHBOARD_URL_KEY] || "");
}

function saveDashboardUrl(value) {
  const normalized = normalizeDashboardUrl(value);
  return chrome.storage.sync.set({ [DASHBOARD_URL_KEY]: normalized }).then(() => normalized);
}