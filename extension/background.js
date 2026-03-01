chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'saveVideo') {
    handleSaveVideo(message.videoUrl).then(sendResponse);
    return true; // keep the message channel open for async response
  }
});

async function handleSaveVideo(videoUrl) {
  const { backendUrl, apiKey } = await chrome.storage.sync.get(['backendUrl', 'apiKey']);

  if (!backendUrl || !apiKey) {
    return {
      success: false,
      error: 'Please configure your backend URL and API key in the extension settings.',
    };
  }

  try {
    const url = backendUrl.replace(/\/+$/, '');
    const response = await fetch(`${url}/api/episodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ url: videoUrl }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message, id: data.id };
    }
    return { success: false, error: data.error || `Server returned ${response.status}` };
  } catch (err) {
    return { success: false, error: `Could not reach server: ${err.message}` };
  }
}
