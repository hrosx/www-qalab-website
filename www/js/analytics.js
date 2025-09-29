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

  var lastEventTimes = Object.create(null);
  var abbyConversationStarted = false;
  var abbyUserIntent = false;
  var isIosSafari = /iP(ad|hone|od)/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

  function copyPayload(payload) {
    var clone = {};
    if (!payload || typeof payload !== 'object') {
      return clone;
    }
    for (var key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        var value = payload[key];
        if (value !== undefined && value !== null) {
          clone[key] = value;
        }
      }
    }
    return clone;
  }

  function pushEvent(name, payload, dedupeWindowMs) {
    var now = Date.now();
    var windowMs = typeof dedupeWindowMs === 'number' ? dedupeWindowMs : 400;
    if (windowMs >= 0) {
      var last = lastEventTimes[name];
      if (last && now - last < windowMs) {
        return;
      }
    }

    lastEventTimes[name] = now;
    var eventData = copyPayload(payload);
    eventData.event = name;
    eventData.event_timestamp = now;
    window.dataLayer.push(eventData);
  }

  function currentPath() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  var lastPath = currentPath();

  function trackPageView(path) {
    pushEvent('spa_page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title
    }, -1); // never dedupe page views
  }

  trackPageView(lastPath);

  function handleNavigation() {
    var path = currentPath();
    if (path === lastPath) {
      return;
    }
    lastPath = path;
    trackPageView(path);
    setTimeout(bindInteractionHandlers, 0);
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

  function recordAbbyConversation(meta) {
    if (abbyConversationStarted) {
      return;
    }
    abbyConversationStarted = true;
    pushEvent('abby_conversation_start', copyPayload(meta), 1200);
  }

  function resetAbbyConversation() {
    abbyConversationStarted = false;
  }

  function pushAbbyConversation(trigger, label) {
    var source = trigger || 'widget_message';
    var btnLabel = label || 'Talk to Abby';
    recordAbbyConversation({
      page_path: lastPath,
      trigger: source,
      button_label: btnLabel
    });
  }

  window.qalabTrackAbbyEngagement = pushAbbyConversation;

  function bindInteractionHandlers() {
    bindSignupHandler();
    bindQaButtons();
    bindContactHandler();
  }

  function bindSignupHandler() {
    var link = document.querySelector('a.nav-signup-link[href*="signup"]');
    if (!link || link.__gtmBound) {
      return;
    }

    link.__gtmBound = true;

    link.addEventListener('click', function (event) {
      event.preventDefault();

      var navigated = false;
      function navigate() {
        if (navigated) {
          return;
        }
        navigated = true;
        window.location.href = link.href;
      }

      var payload = {
        page_path: lastPath,
        link_url: link.href,
        link_text: link.textContent.trim(),
        transport_type: 'beacon',
        event_callback: navigate,
        event_timeout: 1500
      };

      pushEvent('Sign-up free trial', payload, 1500);

      var delay = isIosSafari ? 600 : 200;
      setTimeout(navigate, delay);
    });
  }

  function bindQaButtons() {
    if (document.__qaGlobalBound) {
      return;
    }

    document.__qaGlobalBound = true;
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-ga-event="qa_lab_ai"]');
      if (!button) {
        return;
      }

      pushEvent('qa_lab_ai_click', {
        page_path: lastPath,
        event_label: button.textContent.trim(),
        trigger_source: 'cta_click'
      }, 800);
    }, true);
  }

  function bindContactHandler() {
    var contactLink = document.getElementById('contactUsLink');
    if (!contactLink || contactLink.__gtmBound) {
      return;
    }

    contactLink.__gtmBound = true;
    contactLink.addEventListener('click', function () {
      pushEvent('contact_us_click', {
        page_path: lastPath,
        link_text: contactLink.textContent.trim()
      }, 800);
    });
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== 'https://assistant.qalab.ai') {
      return;
    }

    var data = event.data;
    if (!data) {
      return;
    }

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // leave as string if not JSON
      }
    }

    var action = null;
    if (data && typeof data === 'object') {
      action = data.action || data.type || data.event;
      if (!action && data.payload && typeof data.payload === 'object') {
        action = data.payload.action || data.payload.type || data.payload.event;
      }
    } else if (typeof data === 'string') {
      action = data;
    }

    if (data && data.source === 'qalabs-voice-assistant') {
      if (data.event === 'conversation_start') {
        pushAbbyConversation('widget_message', data.label || data.button_label || 'VOICE CHAT');
        abbyUserIntent = true;
      } else if (data.event === 'conversation_end') {
        resetAbbyConversation();
        abbyUserIntent = false;
      }
      return;
    }

    if (!action) {
      return;
    }

      if (data.event === 'conversation_start') {
        pushAbbyConversation('widget_message', data.label || data.button_label || 'VOICE CHAT');
        abbyUserIntent = true;
      } else if (data.event === 'conversation_end') {
        resetAbbyConversation();
        abbyUserIntent = false;
      }
      return;
    }

    var normalized = String(action).toLowerCase();

    if (normalized.indexOf('conversation') !== -1 && normalized.indexOf('start') !== -1) {
      if (abbyUserIntent) {
        recordAbbyConversation({
          page_path: lastPath,
          trigger: 'widget_message',
          message_action: action
        });
      }
      return;
    }

    if (normalized.indexOf('conversation') !== -1 && normalized.indexOf('end') !== -1) {
      resetAbbyConversation();
      abbyUserIntent = false;
      return;
    }
  });

  bindInteractionHandlers();
})();
