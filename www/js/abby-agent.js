// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, setting up Abby agent expansion');
  
  // Find the agent iframe specifically
  const agentIframe = document.querySelector('iframe[src*="/agent"]');
  if (agentIframe) {
    console.log('Agent iframe found:', agentIframe.src);
  } else {
    console.warn('Agent iframe not found on page!');
  }
});

// Global function to trigger agent expansion
function expandAbbyAgent() {
  console.log('expandAbbyAgent function called');
  
  // Store trigger in localStorage (agents check this)
  localStorage.setItem('abby_agent_expanded', 'true');
  console.log('localStorage item set:', localStorage.getItem('abby_agent_expanded'));
  
  // Try to identify the specific agent iframe
  const agentIframe = document.querySelector('iframe[src*="/agent"]');
  
  if (agentIframe) {
    console.log('Agent iframe found, sending direct message');
    try {
      agentIframe.contentWindow.postMessage({ action: 'expandAbbyAgent' }, '*');
      console.log('Message sent directly to agent iframe');
    } catch (e) {
      console.error('Error posting to agent iframe:', e);
    }
  } else {
    console.warn('No agent iframe found, falling back to broadcast methods');
  }
  
  // Broadcast to all potential receivers as backup
  try {
    window.postMessage({ action: 'expandAbbyAgent' }, '*');
    console.log('Posted message to window');
  } catch (e) {
    console.error('Posting message to window failed:', e);
  }
  
  // Try to reach all iframes as a fallback
  try {
    const iframes = document.querySelectorAll('iframe');
    console.log('Found', iframes.length, 'total iframes');
    
    iframes.forEach((iframe, index) => {
      if (iframe !== agentIframe) { // Skip the agent iframe we already messaged
        try {
          console.log('Sending message to iframe', index);
          iframe.contentWindow.postMessage({ action: 'expandAbbyAgent' }, '*');
        } catch (e) {
          console.error('Error posting to iframe', index, e);
        }
      }
    });
  } catch (e) {
    console.error('Error accessing iframes:', e);
  }
  
  const btn = document.getElementById('talkToAbbyBtn');
  if (btn) {
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.classList.remove('btn-success');
    }, 500);
  }

  console.log('Abby agent expansion triggered - process complete');
  
  return false;
} 