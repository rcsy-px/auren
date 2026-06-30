const optionsForm = document.querySelector("#options-form");
const dashboardInput = document.querySelector("#dashboard-url");
const statusText = document.querySelector("#status");

getDashboardUrl().then((dashboardUrl) => {
  dashboardInput.value = dashboardUrl;
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const dashboardUrl = await saveDashboardUrl(dashboardInput.value);
    dashboardInput.value = dashboardUrl;
    statusText.textContent = "Saved.";
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Please enter a valid dashboard URL.";
  }
});