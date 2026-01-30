/**
 * ui.js — UI Logic and DOM Interactions
 */

window.NanoUI = (function() {

  const elements = {};
  let onClassifyCallback = null;
  let isReadyCallback = null;

  const sentimentConfig = {
    positive: { icon: '😊', label: 'Positive' },
    negative: { icon: '😔', label: 'Negative' },
    neutral: { icon: '😐', label: 'Neutral' }
  };

  function init(handlers) {
    // Cache DOM elements
    elements.aiStatus = document.getElementById('ai-status');
    elements.networkStatus = document.getElementById('network-status');
    elements.textInput = document.getElementById('text-input');
    elements.charCount = document.getElementById('char-count');
    elements.classifyBtn = document.getElementById('classify-btn');
    elements.outputSection = document.getElementById('output-section');
    elements.inferenceTime = document.getElementById('inference-time');
    elements.sentimentBadge = document.getElementById('sentiment-badge');
    elements.confidenceValue = document.getElementById('confidence-value');
    elements.scoreBars = document.getElementById('score-bars');
    elements.messageBox = document.getElementById('message-box');
    elements.messageTitle = document.getElementById('message-title');
    elements.messageText = document.getElementById('message-text');

    onClassifyCallback = handlers.onClassify;
    isReadyCallback = handlers.isReady;

    // Text input handler
    elements.textInput.addEventListener('input', function() {
      var length = elements.textInput.value.length;
      elements.charCount.textContent = length + ' chars';
      if (isReadyCallback && isReadyCallback()) {
        elements.classifyBtn.disabled = length === 0;
      }
    });

    // Classify button
    elements.classifyBtn.addEventListener('click', function() {
      if (onClassifyCallback) {
        var text = elements.textInput.value.trim();
        if (text) onClassifyCallback(text);
      }
    });

    // Keyboard shortcut
    elements.textInput.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        elements.classifyBtn.click();
      }
    });

    updateNetworkStatus();
  }

  function updateAIStatus(status, message) {
    var el = elements.aiStatus;
    el.classList.remove('ready', 'loading', 'error');
    
    if (status === 'ready') {
      el.classList.add('ready');
      el.querySelector('.status-text').textContent = message || 'AI Ready (On-Device)';
    } else if (status === 'loading') {
      el.classList.add('loading');
      el.querySelector('.status-text').textContent = message || 'Loading Model...';
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
      el.querySelector('.status-text').textContent = 'Offline (Using Cache)';
    }
  }

  function setButtonEnabled(enabled) {
    var hasInput = elements.textInput.value.trim().length > 0;
    elements.classifyBtn.disabled = !(enabled && hasInput);
  }

  function setButtonLoading(loading) {
    var btn = elements.classifyBtn;
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'Classifying';
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'Classify';
    }
  }

  function showResults(result) {
    hideMessage();
    elements.outputSection.hidden = false;
    elements.inferenceTime.textContent = result.inferenceTime + 'ms';

    var config = sentimentConfig[result.label] || sentimentConfig.neutral;
    var badge = elements.sentimentBadge;
    
    badge.className = 'sentiment-badge ' + result.label;
    badge.querySelector('.sentiment-icon').textContent = config.icon;
    badge.querySelector('.sentiment-label').textContent = config.label;

    var confidence = Math.round(result.scores[result.label] * 100);
    elements.confidenceValue.textContent = confidence + '%';

    renderScoreBars(result.scores);
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

  function showMessage(type, title, text) {
    elements.outputSection.hidden = true;
    var box = elements.messageBox;
    box.className = 'message-box ' + type;
    box.hidden = false;
    elements.messageTitle.textContent = title;
    elements.messageText.textContent = text;
  }

  function hideMessage() {
    elements.messageBox.hidden = true;
  }

  function clearResults() {
    elements.outputSection.hidden = true;
    hideMessage();
  }

  function focusInput() {
    elements.textInput.focus();
  }

  return {
    init: init,
    updateAIStatus: updateAIStatus,
    updateNetworkStatus: updateNetworkStatus,
    setButtonEnabled: setButtonEnabled,
    setButtonLoading: setButtonLoading,
    showResults: showResults,
    showMessage: showMessage,
    hideMessage: hideMessage,
    clearResults: clearResults,
    focusInput: focusInput
  };

})();
