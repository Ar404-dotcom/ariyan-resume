(function () {
  'use strict';

  // URL Shortener microservice - browser-only with sessionStorage

  const UrlShortenerService = {
    _storagePrefix: 'url_',
    _initialized: false,

    init() {
      console.log('=== URL Shortener init() ===');
      
      // Get elements
      const shortenBtn = document.getElementById('url-shorten-btn');
      const copyBtn = document.getElementById('url-copy-btn');
      const clearBtn = document.getElementById('url-clear-btn');
      const longInput = document.getElementById('url-long-input');

      console.log('Elements:', { shortenBtn, copyBtn, clearBtn, longInput });

      if (!shortenBtn || !longInput) {
        console.error('Critical elements not found!');
        return;
      }

      // Use onclick instead of addEventListener to avoid duplicate listeners
      const self = this;

      shortenBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Shorten clicked');
        self.shortenUrl();
      };

      if (copyBtn) {
        copyBtn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Copy clicked');
          self.copyShortUrl();
        };
      }

      if (clearBtn) {
        clearBtn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Clear clicked');
          self.clearFields();
        };
      }

      longInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('Enter pressed');
          self.shortenUrl();
        }
      };

      this._initialized = true;
      console.log('URL Shortener initialized!');
    },

    generateShortCode() {
      return Math.random().toString(36).substring(2, 8).toLowerCase();
    },

    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },

    shortenUrl() {
      console.log('=== shortenUrl() ===');
      
      const longInput = document.getElementById('url-long-input');
      const shortOutput = document.getElementById('url-short-output');
      const copyBtn = document.getElementById('url-copy-btn');

      if (!longInput || !shortOutput) {
        alert('Error: Fields not found!');
        return;
      }

      const longUrl = longInput.value.trim();
      console.log('Long URL:', longUrl);

      if (!longUrl) {
        alert('Please enter a URL');
        return;
      }

      if (!this.isValidUrl(longUrl)) {
        alert('Please enter a valid URL (include http:// or https://)');
        return;
      }

      // Generate short code
      let shortCode = this.generateShortCode();
      while (sessionStorage.getItem(this._storagePrefix + shortCode)) {
        shortCode = this.generateShortCode();
      }

      // Store in sessionStorage
      sessionStorage.setItem(this._storagePrefix + shortCode, longUrl);
      console.log('Stored:', this._storagePrefix + shortCode);

      // Create short URL
      const shortUrl = window.location.origin + window.location.pathname + '#/u/' + shortCode;
      console.log('Short URL:', shortUrl);

      // Display result
      shortOutput.value = shortUrl;
      
      // Enable copy button
      if (copyBtn) {
        copyBtn.disabled = false;
      }

      console.log('Done!');
    },

    copyShortUrl() {
      const shortOutput = document.getElementById('url-short-output');
      const copyBtn = document.getElementById('url-copy-btn');

      if (!shortOutput || !shortOutput.value) {
        alert('No short URL to copy!');
        return;
      }

      navigator.clipboard.writeText(shortOutput.value)
        .then(() => {
          console.log('Copied!');
          if (copyBtn) {
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.style.background = '#4CAF50';
            setTimeout(() => {
              copyBtn.innerHTML = orig;
              copyBtn.style.background = '';
            }, 2000);
          }
        })
        .catch(err => {
          console.error('Copy failed:', err);
          alert('Failed to copy');
        });
    },

    clearFields() {
      const longInput = document.getElementById('url-long-input');
      const shortOutput = document.getElementById('url-short-output');
      const copyBtn = document.getElementById('url-copy-btn');

      if (longInput) longInput.value = '';
      if (shortOutput) shortOutput.value = '';
      if (copyBtn) copyBtn.disabled = true;
      
      console.log('Fields cleared');
    },

    checkForRedirect() {
      const hash = window.location.hash;
      console.log('Checking redirect, hash:', hash);

      const match = hash.match(/^#\/u\/([a-z0-9]{6})$/);
      if (match) {
        const shortCode = match[1];
        const longUrl = sessionStorage.getItem(this._storagePrefix + shortCode);
        
        if (longUrl) {
          console.log('Redirecting to:', longUrl);
          window.location.href = longUrl;
        } else {
          window.location.hash = '';
          alert('Short URL not found or expired.');
        }
      }
    }
  };

  // Expose globally
  window.UrlShortenerService = UrlShortenerService;
  console.log('UrlShortenerService loaded');

  // Check for redirect on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      UrlShortenerService.checkForRedirect();
    });
  } else {
    UrlShortenerService.checkForRedirect();
  }
})();
