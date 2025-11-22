// popup.js
document.getElementById("applyBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const newTitle = document.getElementById("titleInput").value.trim();
  const status = document.getElementById("status");

  if (!tab) {
    status.innerText = "No active tab found.";
    return;
  }

  // Send to background which will store and apply (and reapply on reload)
  chrome.runtime.sendMessage(
    { action: "setTitle", tabId: tab.id, title: newTitle },
    (response) => {
      if (chrome.runtime.lastError) {
        status.innerText = "Error: " + chrome.runtime.lastError.message;
        return;
      }
      if (response && response.status === "ok") {
        status.innerText = newTitle
          ? `Tab renamed to "${newTitle}"`
          : "Title cleared.";
        setTimeout(() => (status.innerText = ""), 1500);
      } else {
        status.innerText = "Failed to set title.";
      }
    }
  );
});
