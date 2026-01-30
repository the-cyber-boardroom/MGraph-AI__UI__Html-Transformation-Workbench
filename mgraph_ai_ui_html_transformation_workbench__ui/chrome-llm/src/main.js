/**
 * main.js — Application Bootstrap
 * Wires together AI, UI, and Service Worker
 */

(function() {

  var state = { aiReady: false };

  // Register Service Worker for offline support
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
      NanoUI.updateAIStatus('ready', 'AI Ready (On-Device)');
      NanoUI.setButtonsEnabled(true);
      console.log('[App] AI ready');
    } else {
      state.aiReady = false;
      NanoUI.updateAIStatus('error', 'AI Unavailable');
      NanoUI.setButtonsEnabled(false);
      NanoUI.showClassifierMessage('error', 'Chrome AI Not Available', result.reason);
    }
  }

  // Handle chat message
  async function handleChat(message) {
    if (!state.aiReady) {
      NanoUI.showChatError('AI not ready');
      return;
    }

    try {
      // Use streaming for better UX
      await NanoAI.chatStreaming(message, function(chunk, fullText) {
        NanoUI.updateChatResponse(fullText, false);
      });
      
      // Mark as done
      NanoUI.updateChatResponse(null, true);
      
    } catch (error) {
      console.error('[App] Chat error:', error);
      NanoUI.showChatError(error.message);
    }
  }

  // Handle classification
  async function handleClassify(text) {
    if (!state.aiReady) {
      NanoUI.showClassifierMessage('error', 'AI Not Ready', 'Please wait for initialization.');
      return;
    }

    NanoUI.setClassifyLoading(true);
    NanoUI.hideClassifierMessage();

    try {
      var result = await NanoAI.classifyText(text);
      NanoUI.showClassifierResults(result);
      console.log('[App] Classification result:', result);
    } catch (error) {
      console.error('[App] Classification error:', error);
      NanoUI.showClassifierMessage('error', 'Classification Failed', error.message);
    } finally {
      NanoUI.setClassifyLoading(false);
    }
  }

  // Network status listeners
  function setupNetworkListeners() {
    window.addEventListener('online', function() {
      NanoUI.updateNetworkStatus();
    });
    window.addEventListener('offline', function() {
      NanoUI.updateNetworkStatus();
    });
  }

  // Main initialization
  function init() {
    console.log('[App] Initializing Nano AI...');
    
    registerServiceWorker();
    setupNetworkListeners();
    
    NanoUI.init({
      onChat: handleChat,
      onClassify: handleClassify,
      isReady: function() { return state.aiReady; }
    });
    
    initializeAI();
    
    console.log('[App] Init complete');
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
