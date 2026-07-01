const setupShell = document.querySelector("#setup-shell");
const setupForm = document.querySelector("#setup-form");
const dashboardInput = document.querySelector("#dashboard-url");
const statusText = document.querySelector("#status");
const dashboardFrame = document.querySelector("#dashboard-frame");
const settingsButton = document.querySelector("#settings-button");
const frameActions = document.querySelector("#frame-actions");
const retryButton = document.querySelector("#retry-button");
const openDirectButton = document.querySelector("#open-direct-button");
const changeUrlButton = document.querySelector("#change-url-button");
const extensionVersionText = document.querySelector("#extension-version");
const dashboardVersionText = document.querySelector("#dashboard-version");
const versionStatusText = document.querySelector("#version-status");

let currentDashboardUrl = "";
let loadTimer = 0;

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

function showSetup(message, value = currentDashboardUrl) {
  document.body.classList.remove("is-rendering-dashboard");
  window.clearTimeout(loadTimer);
  statusText.textContent = message;
  dashboardInput.value = value || "";
  setupForm.hidden = false;
  setupShell.hidden = false;
  frameActions.hidden = true;
  settingsButton.hidden = true;
  dashboardFrame.hidden = true;
  dashboardInput.focus();
}

function showFrame() {
  document.body.classList.add("is-rendering-dashboard");
  window.clearTimeout(loadTimer);
  setupShell.hidden = true;
  setupForm.hidden = true;
  frameActions.hidden = true;
  settingsButton.hidden = false;
  dashboardFrame.hidden = false;
}

function showFrameFallback(message) {
  statusText.textContent = message;
  setupForm.hidden = true;
  setupShell.hidden = false;
  frameActions.hidden = false;
  settingsButton.hidden = false;
  dashboardFrame.hidden = false;
}

function renderDashboard(dashboardUrl) {
  currentDashboardUrl = dashboardUrl;
  dashboardInput.value = dashboardUrl;
  dashboardFrame.src = dashboardUrl;
  refreshDashboardVersion(dashboardUrl);
  showFrame();
}

setExtensionVersion();

dashboardFrame.addEventListener("load", () => {
  showFrame();
});

getDashboardUrl()
  .then((dashboardUrl) => {
    if (dashboardUrl) {
      renderDashboard(dashboardUrl);
      return;
    }

    refreshDashboardVersion("");
    showSetup("Set your dashboard address once, then every new tab will render it here.");
  })
  .catch(() => {
    refreshDashboardVersion("");
    showSetup("Could not read the saved dashboard address. Set it again below.");
  });

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const dashboardUrl = await saveDashboardUrl(dashboardInput.value);
    renderDashboard(dashboardUrl);
  } catch (error) {
    refreshDashboardVersion("");
    showSetup(error instanceof Error ? error.message : "Please enter a valid dashboard URL.", dashboardInput.value);
  }
});

settingsButton.addEventListener("click", () => {
  showSetup("Change the dashboard address used by this new tab.");
  refreshDashboardVersion(currentDashboardUrl);
});

retryButton.addEventListener("click", () => {
  if (currentDashboardUrl) {
    renderDashboard(currentDashboardUrl);
  }
});

openDirectButton.addEventListener("click", () => {
  if (currentDashboardUrl) {
    window.location.href = currentDashboardUrl;
  }
});

changeUrlButton.addEventListener("click", () => {
  showSetup("Change the dashboard address used by this new tab.");
  refreshDashboardVersion(currentDashboardUrl);
});
