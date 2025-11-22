// background.js

// Utility: apply title to a tab, with error handling
async function applyTitleToTab(tabId, title) {
  try {
    // executeScript returns a Promise in MV3
    await chrome.scripting.executeScript({
      target: { tabId: Number(tabId) },
      func: (t) => {
        document.title = t;
      },
      args: [title],
    });
    console.log(`Applied custom title to tab ${tabId}: "${title}"`);
  } catch (err) {
    console.error(`Failed to apply title to tab ${tabId}:`, err);
  }
}

// Save requested title for a tab (persist until tab closes)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "setTitle") {
    const tabIdStr = String(msg.tabId);
    const title = msg.title;

    // Save as string-keyed property
    const obj = {};
    obj[tabIdStr] = title;

    chrome.storage.session.set(obj, () => {
      // Try immediate apply (best-effort)
      applyTitleToTab(tabIdStr, title);
      sendResponse({ status: "ok" });
    });

    // keep message channel open for async response
    return true;
  }

  // optionally handle getTitle or clearTitle actions here
});

// When a tab finishes loading or navigates, reapply saved title (if any).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We care when the page has finished loading (and for SPA navigation this may fire multiple times)
  if (changeInfo.status === "complete") {
    const tabIdStr = String(tabId);
    chrome.storage.session.get(tabIdStr, (res) => {
      const customTitle = res[tabIdStr];
      if (customTitle) {
        // Apply immediately, and also retry after short delays to handle pages that change title afterwards
        applyTitleToTab(tabId, customTitle);
        setTimeout(() => applyTitleToTab(tabId, customTitle), 300);
        setTimeout(() => applyTitleToTab(tabId, customTitle), 1000);
      }
    });
  }

  // If you want to catch title changes from the page itself (optional):
  // if (changeInfo.title) { ... }
});

// When tab closed, remove stored custom title
chrome.tabs.onRemoved.addListener((tabId) => {
  const tabIdStr = String(tabId);
  chrome.storage.session.remove(tabIdStr, () => {
    // nothing else needed
  });
});
