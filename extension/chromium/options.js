const optionsForm = document.querySelector("#options-form");
const dashboardInput = document.querySelector("#dashboard-url");
const statusText = document.querySelector("#status");
const extensionVersionText = document.querySelector("#extension-version");
const dashboardVersionText = document.querySelector("#dashboard-version");
const versionStatusText = document.querySelector("#version-status");

function setExtensionVersion() {
  extensionVersionText.textContent = `v${getExtensionVersion()}`;
}

function setDashboardVersionState(info) {
  if (!info) {
    dashboardVersionText.textContent = "Not connected";
    dashboardVersionText.className = "version-badge is-muted";
    versionStatusText.textContent = "Save a dashboard URL to check the installed Auren version.";
    return;
  }

  dashboardVersionText.textContent = `v${info.version || "dev"}`;
  dashboardVersionText.className = info.updateAvailable ? "version-badge is-warning" : "version-badge is-success";

  if (info.updateAvailable && info.latestVersion) {
    versionStatusText.textContent = `Auren v${info.latestVersion} is available.`;
    return;
  }

  if (info.error) {
    versionStatusText.textContent = "Version check reached the dashboard, but GitHub lookup is unavailable.";
    return;
  }

  versionStatusText.textContent = "Dashboard version is readable.";
}

async function refreshDashboardVersion(dashboardUrl) {
  if (!dashboardUrl) {
    setDashboardVersionState(null);
    return;
  }

  dashboardVersionText.textContent = "Checking...";
  dashboardVersionText.className = "version-badge is-muted";
  versionStatusText.textContent = "Reading /api/version from the configured dashboard.";

  try {
    setDashboardVersionState(await fetchDashboardVersion(dashboardUrl));
  } catch {
    dashboardVersionText.textContent = "Unavailable";
    dashboardVersionText.className = "version-badge is-danger";
    versionStatusText.textContent = "Could not read /api/version from this dashboard URL.";
  }
}

setExtensionVersion();

getDashboardUrl().then((dashboardUrl) => {
  dashboardInput.value = dashboardUrl;
  refreshDashboardVersion(dashboardUrl);
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const dashboardUrl = await saveDashboardUrl(dashboardInput.value);
    dashboardInput.value = dashboardUrl;
    statusText.textContent = "Saved.";
    refreshDashboardVersion(dashboardUrl);
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Please enter a valid dashboard URL.";
    refreshDashboardVersion("");
  }
});
