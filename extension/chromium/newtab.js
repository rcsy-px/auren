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

let currentDashboardUrl = "";
let loadTimer = 0;

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
  showFrame();
}

dashboardFrame.addEventListener("load", () => {
  showFrame();
});

getDashboardUrl()
  .then((dashboardUrl) => {
    if (dashboardUrl) {
      renderDashboard(dashboardUrl);
      return;
    }

    showSetup("Set your dashboard address once, then every new tab will render it here.");
  })
  .catch(() => {
    showSetup("Could not read the saved dashboard address. Set it again below.");
  });

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const dashboardUrl = await saveDashboardUrl(dashboardInput.value);
    renderDashboard(dashboardUrl);
  } catch (error) {
    showSetup(error instanceof Error ? error.message : "Please enter a valid dashboard URL.", dashboardInput.value);
  }
});

settingsButton.addEventListener("click", () => {
  showSetup("Change the dashboard address used by this new tab.");
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
});