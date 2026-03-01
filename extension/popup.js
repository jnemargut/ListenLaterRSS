const backendUrlInput = document.getElementById('backendUrl');
const apiKeyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('save');
const statusDiv = document.getElementById('status');
const feedSection = document.getElementById('feedSection');
const feedUrlInput = document.getElementById('feedUrl');
const copyBtn = document.getElementById('copyFeed');

// Load saved settings
chrome.storage.sync.get(['backendUrl', 'apiKey'], ({ backendUrl, apiKey }) => {
  if (backendUrl) backendUrlInput.value = backendUrl;
  if (apiKey) apiKeyInput.value = apiKey;
  updateFeedUrl();
});

saveBtn.addEventListener('click', () => {
  const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
  const apiKey = apiKeyInput.value.trim();

  if (!backendUrl) {
    showStatus('Please enter a backend URL', 'error');
    return;
  }
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  chrome.storage.sync.set({ backendUrl, apiKey }, () => {
    showStatus('Settings saved!', 'success');
    updateFeedUrl();
  });
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(feedUrlInput.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  } catch {
    feedUrlInput.select();
  }
});

function updateFeedUrl() {
  const backendUrl = backendUrlInput.value.trim().replace(/\/+$/, '');
  if (backendUrl) {
    feedUrlInput.value = `${backendUrl}/feed`;
    feedSection.hidden = false;
  } else {
    feedSection.hidden = true;
  }
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status status--${type}`;
  statusDiv.hidden = false;
  setTimeout(() => { statusDiv.hidden = true; }, 3000);
}

backendUrlInput.addEventListener('input', updateFeedUrl);
