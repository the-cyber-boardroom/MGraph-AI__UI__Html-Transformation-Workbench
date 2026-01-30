/**
 * main.js — Application Bootstrap
 */

(function() {

  var state = { aiReady: false };

  // Register Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then(function(reg) {
          console.log('[SW] Registered:', reg.scope);
        })
        .catch(function(err) {
          console.warn('[SW] Registration failed:', err);
        });
    }
  }

  // Initialize AI
  async function initializeAI() {
    NanoUI.updateAIStatus('loading', 'Initializing AI...');
    
    var result = await NanoAI.initAI();
    
    if (result.ready) {
      state.aiReady = true;
      NanoUI.updateAIStatus('ready');
      NanoUI.setButtonEnabled(true);
      console.log('[App] AI ready');
    } else {
      state.aiReady = false;
      NanoUI.updateAIStatus('error', 'AI Unavailable');
      NanoUI.setButtonEnabled(false);
      NanoUI.showMessage('error', 'Chrome AI Not Available', result.reason);
    }
  }

  // Handle classification
  async function handleClassify(text) {
    if (!state.aiReady) {
      NanoUI.showMessage('error', 'AI Not Ready', 'Please wait for initialization.');
      return;
    }

    NanoUI.setButtonLoading(true);
    NanoUI.clearResults();

    try {
      var result = await NanoAI.classifyText(text);
      NanoUI.showResults(result);
      console.log('[App] Result:', result);
    } catch (error) {
      console.error('[App] Error:', error);
      NanoUI.showMessage('error', 'Classification Failed', error.message);
    } finally {
      NanoUI.setButtonLoading(false);
    }
  }

  // Network listeners
  function setupNetworkListeners() {
    window.addEventListener('online', function() {
      NanoUI.updateNetworkStatus();
    });
    window.addEventListener('offline', function() {
      NanoUI.updateNetworkStatus();
    });
  }

  // Main init
  function init() {
    console.log('[App] Initializing...');
    
    registerServiceWorker();
    setupNetworkListeners();
    
    NanoUI.init({
      onClassify: handleClassify,
      isReady: function() { return state.aiReady; }
    });
    
    initializeAI();
    NanoUI.focusInput();
    
    console.log('[App] Init complete');
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
