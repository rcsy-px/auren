const EXTENSION_NEW_TAB_URL = chrome.runtime.getURL("newtab.html");
const NEW_TAB_CHECK_DELAYS_MS = [40, 160, 420, 900];
const INTERNAL_NEW_TAB_PREFIXES = [
  "about:blank",
  "about:newtab",
  "chrome://newtab",
  "edge://newtab",
  "vivaldi://newtab",
  "vivaldi://startpage",
  "chrome://vivaldi-webui/startpage",
  "chrome-extension://mpognobbkildjkofajifpdfhcoklimli/"
];

function isExtensionNewTabUrl(url) {
  return Boolean(url && url.startsWith(EXTENSION_NEW_TAB_URL));
}

function isInternalNewTabUrl(url) {
  if (!url || isExtensionNewTabUrl(url)) {
    return false;
  }

  return INTERNAL_NEW_TAB_PREFIXES.some((candidate) => url === candidate || url.startsWith(candidate));
}

async function updateToExtensionNewTab(tabId) {
  if (!tabId) {
    return;
  }

  await chrome.tabs.update(tabId, { url: EXTENSION_NEW_TAB_URL });
}

async function inspectAndMaybeReplace(tabId) {
  if (!tabId) {
    return;
  }

  const tab = await chrome.tabs.get(tabId);
  const url = tab.pendingUrl || tab.url || "";

  if (isInternalNewTabUrl(url)) {
    await updateToExtensionNewTab(tabId);
  }
}

function scheduleNewTabChecks(tabId) {
  for (const delay of NEW_TAB_CHECK_DELAYS_MS) {
    setTimeout(() => {
      inspectAndMaybeReplace(tabId).catch(() => {});
    }, delay);
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  const url = tab.pendingUrl || tab.url || "";

  if (isInternalNewTabUrl(url)) {
    updateToExtensionNewTab(tab.id).catch(() => {});
    return;
  }

  scheduleNewTabChecks(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.pendingUrl || tab.url || "";

  if (isInternalNewTabUrl(url)) {
    updateToExtensionNewTab(tabId).catch(() => {});
  }
});