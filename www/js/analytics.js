(function () {
  var measurementId = 'G-9EGHJ6SEEN';
  var prodHosts = ['qalab.ai', 'www.qalab.ai'];
  if (prodHosts.indexOf(window.location.hostname) === -1) {
    return;
  }

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(loader);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false });

  function currentPath() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function trackPageView(path) {
    gtag('event', 'page_view', {
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
    if (!window.gtag) {
      return;
    }
    var button = event.target.closest('[data-ga-event="qa_lab_ai"]');
    if (!button) {
      return;
    }
    gtag('event', 'qa_lab_ai_button_click', {
      page_path: lastPath,
      event_label: button.textContent.trim()
    });
  });
})();
