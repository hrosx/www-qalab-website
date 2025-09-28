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
  var signupTracked = false;
  var signupResetTimer;

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

    // Check for sign-up link clicks
    var signupLink = event.target.closest('a[href*="signup"], a.nav-signup-link');
    if (signupLink && !signupTracked) {
      // Prevent double tracking for 3 seconds (in case user navigates back)
      signupTracked = true;
      clearTimeout(signupResetTimer);
      signupResetTimer = setTimeout(function() {
        signupTracked = false;
      }, 3000);

      // Push the event that GTM expects
      pushEvent('Sign-up free trial', {
        page_path: lastPath,
        link_url: signupLink.href,
        link_text: signupLink.textContent.trim()
      });
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
})();
