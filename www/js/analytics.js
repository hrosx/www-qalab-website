(function () {
  var prodHosts = ['qalab.ai', 'www.qalab.ai'];
  var containerId = 'GTM-NWMMW3WL';

  if (prodHosts.indexOf(window.location.hostname) === -1) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (!window.google_tag_manager || !window.google_tag_manager[containerId]) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + containerId;
    document.head.appendChild(gtmScript);
  }

  function pushEvent(name, payload) {
    var eventData = payload || {};
    eventData.event = name;
    eventData._timestamp = Date.now();  // Add timestamp to detect duplicates
    eventData._random = Math.random();  // Add random ID to track unique pushes
    console.log('[GTM Debug] Pushing event:', name, eventData);

    // Also log the dataLayer to see if there are duplicates
    console.log('[GTM Debug] Current dataLayer length:', window.dataLayer.length);

    // Check last few events for duplicates
    var recentEvents = window.dataLayer.slice(-5).filter(function(item) {
      return item.event === name;
    });
    if (recentEvents.length > 0) {
      console.log('[GTM Debug] Recent', name, 'events in dataLayer:', recentEvents.length);
    }

    window.dataLayer.push(eventData);
  }

  function currentPath() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function trackPageView(path) {
    pushEvent('spa_page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title
    });
  }

  var lastPath = currentPath();
  trackPageView(lastPath);

  function handleNavigation() {
    var path = currentPath();
    if (path === lastPath) {
      return;
    }
    lastPath = path;
    trackPageView(path);
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    if (typeof history[method] !== 'function') {
      return;
    }
    var original = history[method];
    history[method] = function () {
      var result = original.apply(this, arguments);
      handleNavigation();
      return result;
    };
  });

  window.addEventListener('popstate', handleNavigation);

  // Track sign-up clicks with debouncing to prevent double triggers
  // Use window object to ensure persistence across any re-initialization
  window._gtmSignupState = window._gtmSignupState || {
    tracked: false,
    resetTimer: null,
    lastTime: 0
  };

  // Add flag to prevent multiple event listeners
  if (!window._gtmClickListenerAdded) {
    window._gtmClickListenerAdded = true;
    document.addEventListener('click', function (event) {
    // Check for QA Lab AI button clicks
    var button = event.target.closest('[data-ga-event="qa_lab_ai"]');
    if (button) {
      pushEvent('qa_lab_ai_click', {
        page_path: lastPath,
        event_label: button.textContent.trim()
      });
      return;
    }

    // Check for sign-up link clicks - use more specific selector
    var signupLink = event.target.closest('a.nav-signup-link[href*="signup"]');
    if (signupLink) {
      event.preventDefault(); // Stop immediate navigation
      event.stopPropagation(); // Stop event from bubbling

      var now = Date.now();
      var state = window._gtmSignupState;

      // Prevent tracking if clicked within 5 seconds (increased window)
      if (state.tracked && (now - state.lastTime < 5000)) {
        console.log('[GTM] Duplicate sign-up click blocked (within 5s)', now - state.lastTime);
        // Still navigate but don't track
        window.location.href = signupLink.href;
        return;
      }

      // Update state BEFORE pushing event
      state.lastTime = now;
      state.tracked = true;

      // Push the event that GTM expects - ONLY ONCE
      console.log('[GTM] Pushing Sign-up free trial event (single)', {
        timestamp: now,
        link_url: signupLink.href
      });

      // Simple push without callback to avoid multiple triggers
      pushEvent('Sign-up free trial', {
        page_path: lastPath,
        link_url: signupLink.href,
        link_text: signupLink.textContent.trim(),
        transport_type: 'beacon'  // Reliable delivery
      });

      // Navigate after short delay
      setTimeout(function() {
        // Reset flag after navigation
        state.tracked = false;
        window.location.href = signupLink.href;
      }, 200);

      return;
    }

    // Check for Contact Us clicks
    var contactLink = event.target.closest('#contactUsLink');
    if (contactLink) {
      pushEvent('contact_us_click', {
        page_path: lastPath,
        link_text: contactLink.textContent.trim()
      });
    }
  });
  } // Close the if statement for click listener
})();
