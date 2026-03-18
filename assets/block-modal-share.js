(function() {
  const modals = document.querySelectorAll('[data-modal-share]');
  if (!modals.length) return;

  modals.forEach(function(modal) {
    const modalId = modal.dataset.modalShare;

    let currentUrl   = window.location.href;
    let currentTitle = document.title;
    let currentImage = '';

    document.addEventListener('click', function(e) {
      const trigger = e.target.closest('[data-modal-trigger="' + modalId + '"]');
      if (!trigger) return;

      currentUrl   = trigger.dataset.shareUrl   || window.location.href;
      currentTitle = trigger.dataset.shareTitle || document.title;
      currentImage = trigger.dataset.shareImage || '';

      updateShareLinks();
    });

    function updateShareLinks() {
      const encodedUrl   = encodeURIComponent(currentUrl);
      const encodedTitle = encodeURIComponent(currentTitle);
      const encodedImage = encodeURIComponent(currentImage);

      const platforms = {
        facebook  : 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
        twitter   : 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle,
        pinterest : 'https://pinterest.com/pin/create/button/?url=' + encodedUrl + '&media=' + encodedImage + '&description=' + encodedTitle,
        whatsapp  : 'https://api.whatsapp.com/send?text=' + encodedTitle + '%20' + encodedUrl,
        email     : 'mailto:?subject=' + encodedTitle + '&body=' + encodedUrl
      };

      Object.entries(platforms).forEach(function([platform, href]) {
        const el = modal.querySelector('[data-share-platform="' + platform + '"]');
        if (el) el.href = href;
      });

      const urlInput = modal.querySelector('[data-share-url-input]');
      if (urlInput) urlInput.value = currentUrl;
    }

    const copyBtn  = modal.querySelector('[data-share-copy]');
    const urlInput = modal.querySelector('[data-share-url-input]');

    if (copyBtn && urlInput) {
      copyBtn.addEventListener('click', function() {
        const copyLabel   = copyBtn.querySelector('[data-copy-label]');
        const copiedLabel = copyBtn.querySelector('[data-copied-label]');

        navigator.clipboard.writeText(urlInput.value).then(function() {
          if (copyLabel)   copyLabel.hidden   = true;
          if (copiedLabel) copiedLabel.hidden = false;
          setTimeout(function() {
            if (copyLabel)   copyLabel.hidden   = false;
            if (copiedLabel) copiedLabel.hidden = true;
          }, 2000);
        }).catch(function() {
          urlInput.select();
          document.execCommand('copy');
        });
      });
    }

    updateShareLinks();
  });
})();
