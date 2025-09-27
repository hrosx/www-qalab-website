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

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-ga-event="qa_lab_ai"]');
    if (!button) {
      return;
    }
    pushEvent('qa_lab_ai_click', {
      page_path: lastPath,
      event_label: button.textContent.trim()
    });
  });
})();
