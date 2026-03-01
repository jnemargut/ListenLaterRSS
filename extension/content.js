(() => {
  const BUTTON_ID = 'listen-later-rss-btn';

  function getVideoUrl() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'listen-later-btn';
    btn.textContent = 'Listen Later';
    btn.setAttribute('data-listen-later', 'true');

    btn.addEventListener('click', async () => {
      const url = getVideoUrl();
      if (!url) return;

      btn.textContent = 'Saving...';
      btn.disabled = true;
      btn.className = 'listen-later-btn listen-later-btn--saving';

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'saveVideo',
          videoUrl: url,
        });

        if (response.success) {
          btn.textContent = response.message === 'Video already in feed' ? 'Already Saved' : 'Saved!';
          btn.className = 'listen-later-btn listen-later-btn--saved';
        } else {
          btn.textContent = 'Error';
          btn.className = 'listen-later-btn listen-later-btn--error';
          console.error('Listen Later RSS:', response.error);
        }
      } catch (err) {
        btn.textContent = 'Error';
        btn.className = 'listen-later-btn listen-later-btn--error';
        console.error('Listen Later RSS:', err);
      }

      setTimeout(() => {
        btn.textContent = 'Listen Later';
        btn.className = 'listen-later-btn';
        btn.disabled = false;
      }, 3000);
    });

    return btn;
  }

  function injectButton() {
    // Don't inject if not on a watch page
    if (!window.location.pathname.startsWith('/watch')) return;

    // Don't inject if already present
    if (document.getElementById(BUTTON_ID)) return;

    // YouTube's action buttons container (below video title)
    const targets = [
      '#top-level-buttons-computed',
      'ytd-watch-metadata #actions',
      '#menu.ytd-watch-metadata',
    ];

    for (const selector of targets) {
      const container = document.querySelector(selector);
      if (container) {
        container.appendChild(createButton());
        return;
      }
    }
  }

  function removeButton() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn) btn.remove();
  }

  // YouTube is an SPA — handle navigation
  document.addEventListener('yt-navigate-finish', () => {
    removeButton();
    // Delay to let YouTube rebuild the DOM
    setTimeout(injectButton, 1000);
  });

  // Also watch for DOM changes as a fallback
  const observer = new MutationObserver(() => {
    if (window.location.pathname.startsWith('/watch') && !document.getElementById(BUTTON_ID)) {
      injectButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial injection
  setTimeout(injectButton, 1500);
})();
