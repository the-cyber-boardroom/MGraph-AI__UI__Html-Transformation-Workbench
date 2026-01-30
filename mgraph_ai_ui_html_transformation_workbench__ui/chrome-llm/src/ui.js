/**
 * ui.js — UI Logic for Chat, Classifier, and Log panels
 */

window.NanoUI = (function() {

  const elements = {};
  let onChatCallback = null;
  let onClassifyCallback = null;
  let isReadyCallback = null;

  const sentimentConfig = {
    positive: { icon: '😊', label: 'Positive' },
    negative: { icon: '😔', label: 'Negative' },
    neutral: { icon: '😐', label: 'Neutral' }
  };

  function init(handlers) {
    // Cache DOM elements
    // Status
    elements.aiStatus = document.getElementById('ai-status');
    elements.networkStatus = document.getElementById('network-status');
    
    // Chat
    elements.chatMessages = document.getElementById('chat-messages');
    elements.chatInput = document.getElementById('chat-input');
    elements.chatSend = document.getElementById('chat-send');
    elements.clearChat = document.getElementById('clear-chat');
    
    // Classifier
    elements.textInput = document.getElementById('text-input');
    elements.charCount = document.getElementById('char-count');
    elements.classifyBtn = document.getElementById('classify-btn');
    elements.outputSection = document.getElementById('output-section');
    elements.inferenceTime = document.getElementById('inference-time');
    elements.sentimentBadge = document.getElementById('sentiment-badge');
    elements.confidenceValue = document.getElementById('confidence-value');
    elements.scoreBars = document.getElementById('score-bars');
    elements.reasoningSection = document.getElementById('reasoning-section');
    elements.reasoningText = document.getElementById('reasoning-text');
    elements.messageBox = document.getElementById('message-box');
    elements.messageTitle = document.getElementById('message-title');
    elements.messageText = document.getElementById('message-text');
    
    // Log
    elements.logMessages = document.getElementById('log-messages');
    elements.clearLog = document.getElementById('clear-log');

    // Save callbacks
    onChatCallback = handlers.onChat;
    onClassifyCallback = handlers.onClassify;
    isReadyCallback = handlers.isReady;

    // ====== Chat Event Handlers ======
    elements.chatSend.addEventListener('click', function() {
      sendChatMessage();
    });

    elements.chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    elements.chatInput.addEventListener('input', function() {
      if (isReadyCallback && isReadyCallback()) {
        elements.chatSend.disabled = elements.chatInput.value.trim().length === 0;
      }
    });

    elements.clearChat.addEventListener('click', function() {
      clearChat();
    });

    // ====== Classifier Event Handlers ======
    elements.textInput.addEventListener('input', function() {
      var length = elements.textInput.value.length;
      elements.charCount.textContent = length + ' chars';
      if (isReadyCallback && isReadyCallback()) {
        elements.classifyBtn.disabled = length === 0;
      }
    });

    elements.classifyBtn.addEventListener('click', function() {
      if (onClassifyCallback) {
        var text = elements.textInput.value.trim();
        if (text) onClassifyCallback(text);
      }
    });

    // ====== Log Event Handlers ======
    elements.clearLog.addEventListener('click', function() {
      clearLogPanel();
      if (window.NanoAI) window.NanoAI.clearLog();
    });

    // Listen for log events from AI module
    window.addEventListener('ai-log', function(e) {
      addLogEntry(e.detail);
    });

    updateNetworkStatus();
  }

  // ====== Chat Functions ======

  function sendChatMessage() {
    var text = elements.chatInput.value.trim();
    if (!text || !onChatCallback) return;
    
    // Add user message to chat
    addChatMessage('user', text);
    elements.chatInput.value = '';
    elements.chatSend.disabled = true;
    
    // Add typing indicator
    var typingEl = addChatMessage('assistant', '...', true);
    typingEl.classList.add('typing');
    
    // Send to AI
    onChatCallback(text);
  }

  function addChatMessage(role, content, isTyping) {
    // Remove welcome message if present
    var welcome = elements.chatMessages.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
    
    var msgEl = document.createElement('div');
    msgEl.className = 'chat-message ' + role;
    msgEl.textContent = content;
    
    if (isTyping) {
      msgEl.id = 'typing-indicator';
    }
    
    elements.chatMessages.appendChild(msgEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    return msgEl;
  }

  function updateChatResponse(content, done) {
    var typingEl = document.getElementById('typing-indicator');
    
    if (typingEl) {
      // Only update text if content is provided
      if (content !== null && content !== undefined) {
        typingEl.textContent = content;
      }
      typingEl.classList.remove('typing');

      if (done) {
        typingEl.removeAttribute('id');
      }
    } else if (done && content) {
      addChatMessage('assistant', content);
    }

    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

    if (done && isReadyCallback && isReadyCallback()) {
      elements.chatSend.disabled = elements.chatInput.value.trim().length === 0;
    }
  }

  function showChatError(message) {
    var typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();

    addChatMessage('assistant', '⚠️ ' + message);

    if (isReadyCallback && isReadyCallback()) {
      elements.chatSend.disabled = elements.chatInput.value.trim().length === 0;
    }
  }

  function clearChat() {
    elements.chatMessages.innerHTML =
      '<div class="chat-welcome">' +
        '<p>Chat with Gemini Nano running locally on your device.</p>' +
        '<p class="chat-hint">All processing happens offline — no data leaves your browser.</p>' +
      '</div>';
  }

  // ====== Status Functions ======

  function updateAIStatus(status, message) {
    var el = elements.aiStatus;
    el.classList.remove('ready', 'loading', 'error');

    if (status === 'ready') {
      el.classList.add('ready');
      el.querySelector('.status-text').textContent = message || 'AI Ready';
    } else if (status === 'loading') {
      el.classList.add('loading');
      el.querySelector('.status-text').textContent = message || 'Loading...';
    } else {
      el.classList.add('error');
      el.querySelector('.status-text').textContent = message || 'AI Unavailable';
    }
  }

  function updateNetworkStatus() {
    var el = elements.networkStatus;
    el.classList.remove('ready', 'offline');

    if (navigator.onLine) {
      el.classList.add('ready');
      el.querySelector('.status-text').textContent = 'Online';
    } else {
      el.classList.add('offline');
      el.querySelector('.status-text').textContent = 'Offline';
    }
  }

  function setButtonsEnabled(enabled) {
    // Chat
    if (enabled) {
      elements.chatSend.disabled = elements.chatInput.value.trim().length === 0;
      elements.classifyBtn.disabled = elements.textInput.value.trim().length === 0;
    } else {
      elements.chatSend.disabled = true;
      elements.classifyBtn.disabled = true;
    }
  }

  // ====== Classifier Functions ======

  function setClassifyLoading(loading) {
    elements.classifyBtn.disabled = loading;
    elements.classifyBtn.textContent = loading ? 'Analyzing...' : 'Classify Sentiment';
  }

  function showClassifierResults(result) {
    hideClassifierMessage();
    elements.outputSection.hidden = false;
    elements.inferenceTime.textContent = result.inferenceTime + 'ms';

    var config = sentimentConfig[result.label] || sentimentConfig.neutral;
    var badge = elements.sentimentBadge;

    badge.className = 'sentiment-badge ' + result.label;
    badge.querySelector('.sentiment-icon').textContent = config.icon;
    badge.querySelector('.sentiment-label').textContent = config.label;

    var confidence = result.confidence
      ? Math.round(result.confidence * 100)
      : Math.round(result.scores[result.label] * 100);
    elements.confidenceValue.textContent = confidence + '%';

    renderScoreBars(result.scores);

    if (result.reasoning && result.reasoning.trim()) {
      elements.reasoningText.textContent = result.reasoning;
      elements.reasoningSection.hidden = false;
    } else {
      elements.reasoningSection.hidden = true;
    }
  }

  function renderScoreBars(scores) {
    var container = elements.scoreBars;
    container.innerHTML = '';

    var order = ['positive', 'negative', 'neutral'];

    for (var i = 0; i < order.length; i++) {
      var sentiment = order[i];
      var score = scores[sentiment] || 0;
      var percent = Math.round(score * 100);

      var row = document.createElement('div');
      row.className = 'score-row';
      row.innerHTML =
        '<span class="score-label">' + sentiment + '</span>' +
        '<div class="score-bar-track">' +
          '<div class="score-bar-fill ' + sentiment + '" style="width: 0%"></div>' +
        '</div>' +
        '<span class="score-value">' + percent + '%</span>';

      container.appendChild(row);

      // Animate
      (function(row, percent) {
        requestAnimationFrame(function() {
          row.querySelector('.score-bar-fill').style.width = percent + '%';
        });
      })(row, percent);
    }
  }

  function showClassifierMessage(type, title, text) {
    elements.outputSection.hidden = true;
    var box = elements.messageBox;
    box.className = 'message-box ' + type;
    box.hidden = false;
    elements.messageTitle.textContent = title;
    elements.messageText.textContent = text;
  }

  function hideClassifierMessage() {
    elements.messageBox.hidden = true;
  }

  // ====== Log Functions ======

  function addLogEntry(entry) {
    // Remove empty message if present
    var empty = elements.logMessages.querySelector('.log-empty');
    if (empty) empty.remove();

    var time = formatTime(entry.timestamp);
    var typeLabel = entry.type.toUpperCase();

    var entryEl = document.createElement('div');
    entryEl.className = 'log-entry ' + entry.type;

    var metaStr = '';
    if (entry.metadata) {
      var metaParts = [];
      if (entry.metadata.type) metaParts.push(entry.metadata.type);
      if (entry.metadata.time) metaParts.push(entry.metadata.time);
      if (entry.metadata.structured !== undefined) metaParts.push('structured: ' + entry.metadata.structured);
      if (metaParts.length > 0) metaStr = ' [' + metaParts.join(', ') + ']';
    }

    var content = entry.content;
    if (content.length > 500) {
      content = content.substring(0, 500) + '... [truncated]';
    }

    entryEl.innerHTML =
      '<div class="log-header">' +
        '<span class="log-type">' + typeLabel + metaStr + '</span>' +
        '<span class="log-time">' + time + '</span>' +
      '</div>' +
      '<div class="log-content">' + escapeHtml(content) + '</div>';

    elements.logMessages.appendChild(entryEl);
    elements.logMessages.scrollTop = elements.logMessages.scrollHeight;
  }

  function clearLogPanel() {
    elements.logMessages.innerHTML = '<div class="log-empty">No messages yet</div>';
  }

  function formatTime(date) {
    var h = date.getHours().toString().padStart(2, '0');
    var m = date.getMinutes().toString().padStart(2, '0');
    var s = date.getSeconds().toString().padStart(2, '0');
    var ms = date.getMilliseconds().toString().padStart(3, '0');
    return h + ':' + m + ':' + s + '.' + ms;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    init: init,
    updateAIStatus: updateAIStatus,
    updateNetworkStatus: updateNetworkStatus,
    setButtonsEnabled: setButtonsEnabled,
    // Chat
    addChatMessage: addChatMessage,
    updateChatResponse: updateChatResponse,
    showChatError: showChatError,
    clearChat: clearChat,
    // Classifier
    setClassifyLoading: setClassifyLoading,
    showClassifierResults: showClassifierResults,
    showClassifierMessage: showClassifierMessage,
    hideClassifierMessage: hideClassifierMessage,
    // Log
    addLogEntry: addLogEntry,
    clearLogPanel: clearLogPanel
  };

})();