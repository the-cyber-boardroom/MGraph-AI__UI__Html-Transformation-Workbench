/**
 * ai.js — Chrome Built-in AI (Gemini Nano) Integration
 * Supports both chat and sentiment classification
 */

window.NanoAI = (function() {
  
  let chatSession = null;
  let classifierSession = null;
  
  // Message log for debugging
  const messageLog = [];

  const AIStatus = {
    UNAVAILABLE: 'unavailable',
    DOWNLOADING: 'downloading', 
    READY: 'ready',
    ERROR: 'error'
  };

  // Log a message (sent, received, error, system)
  function logMessage(type, content, metadata) {
    const entry = {
      type: type,
      content: content,
      metadata: metadata || {},
      timestamp: new Date()
    };
    messageLog.push(entry);
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('ai-log', { detail: entry }));
    
    return entry;
  }

  function getLog() {
    return messageLog.slice();
  }

  function clearLog() {
    messageLog.length = 0;
  }

  function isAIAvailable() {
    if (typeof LanguageModel !== 'undefined') {
      console.log('[AI] Found LanguageModel global');
      return true;
    }
    console.log('[AI] LanguageModel not found');
    return false;
  }

  async function initAI() {
    if (!isAIAvailable()) {
      logMessage('system', 'Chrome built-in AI not available');
      return {
        ready: false,
        status: AIStatus.UNAVAILABLE,
        reason: 'Chrome built-in AI is not available. Make sure you\'re using Chrome 138+ with the Prompt API enabled.'
      };
    }

    try {
      logMessage('system', 'Checking AI availability...');
      
      let availability = 'available';
      try {
        availability = await LanguageModel.availability();
        logMessage('system', 'Availability: ' + availability);
      } catch (e) {
        logMessage('system', 'Could not check availability: ' + e.message);
      }

      if (availability === 'unavailable') {
        return {
          ready: false,
          status: AIStatus.UNAVAILABLE,
          reason: 'Gemini Nano is not available on this device.'
        };
      }

      // Create chat session (general purpose)
      logMessage('system', 'Creating chat session...');
      chatSession = await LanguageModel.create({
        systemPrompt: 'You are a helpful AI assistant. Be concise and friendly.'
      });

      // Create classifier session (structured output)
      logMessage('system', 'Creating classifier session...');
      classifierSession = await LanguageModel.create({
        systemPrompt: 'You are a sentiment classifier. Analyze text and provide sentiment scores.'
      });

      logMessage('system', 'AI initialization complete');
      
      return { ready: true, status: AIStatus.READY };

    } catch (error) {
      logMessage('error', 'Initialization failed: ' + error.message);
      return {
        ready: false,
        status: AIStatus.ERROR,
        reason: 'Failed to initialize: ' + error.message
      };
    }
  }

  // ====== Chat Functions ======
  
  async function chat(message) {
    if (!chatSession) throw new Error('Chat session not initialized');
    if (!message || !message.trim()) throw new Error('Message required');

    const text = message.trim();
    logMessage('sent', text, { type: 'chat' });

    try {
      const start = performance.now();
      const response = await chatSession.prompt(text);
      const elapsed = Math.round(performance.now() - start);

      logMessage('received', response, { type: 'chat', time: elapsed + 'ms' });

      return {
        message: response,
        time: elapsed
      };

    } catch (error) {
      logMessage('error', 'Chat failed: ' + error.message);
      throw new Error('Chat failed: ' + error.message);
    }
  }

  async function chatStreaming(message, onChunk) {
    if (!chatSession) throw new Error('Chat session not initialized');
    if (!message || !message.trim()) throw new Error('Message required');

    const text = message.trim();
    logMessage('sent', text, { type: 'chat-stream' });

    try {
      const start = performance.now();
      let fullResponse = '';

      const stream = chatSession.promptStreaming(text);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        if (onChunk) onChunk(chunk, fullResponse);
      }

      const elapsed = Math.round(performance.now() - start);
      logMessage('received', fullResponse, { type: 'chat-stream', time: elapsed + 'ms' });

      return {
        message: fullResponse,
        time: elapsed
      };

    } catch (error) {
      logMessage('error', 'Chat stream failed: ' + error.message);
      throw new Error('Chat failed: ' + error.message);
    }
  }

  // ====== Classification Functions ======

  async function classifyText(input) {
    if (!classifierSession) throw new Error('Classifier not initialized');
    if (!input || !input.trim()) throw new Error('Input required');

    const text = input.length > 4000 ? input.substring(0, 4000) : input;
    
    logMessage('sent', text, { type: 'classify' });

    try {
      const start = performance.now();
      
      // Try structured output first
      const responseSchema = {
        type: "object",
        properties: {
          sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
          confidence: { type: "number" },
          positive_score: { type: "number" },
          negative_score: { type: "number" },
          neutral_score: { type: "number" },
          reasoning: { type: "string" }
        },
        required: ["sentiment", "positive_score", "negative_score", "neutral_score"]
      };

      const prompt = 'Analyze the sentiment of this text. Provide scores for positive, negative, and neutral that sum to 1.0.\n\nText: "' + text + '"';

      let response;
      let useStructured = true;

      try {
        response = await classifierSession.prompt(prompt, {
          responseConstraint: responseSchema
        });
      } catch (e) {
        // Fallback to unstructured
        useStructured = false;
        response = await classifierSession.prompt(
          'Classify the sentiment as positive, negative, or neutral. Respond with JSON: {"sentiment": "...", "positive_score": 0.0, "negative_score": 0.0, "neutral_score": 0.0, "reasoning": "..."}\n\nText: "' + text + '"'
        );
      }

      const elapsed = Math.round(performance.now() - start);
      
      logMessage('received', response, { 
        type: 'classify', 
        time: elapsed + 'ms',
        structured: useStructured 
      });

      const result = parseClassification(response);
      
      return {
        label: result.sentiment,
        scores: {
          positive: result.positive_score,
          negative: result.negative_score,
          neutral: result.neutral_score
        },
        confidence: result.confidence,
        reasoning: result.reasoning,
        inferenceTime: elapsed,
        raw: response
      };

    } catch (error) {
      logMessage('error', 'Classification failed: ' + error.message);
      throw new Error('Classification failed: ' + error.message);
    }
  }

  function parseClassification(response) {
    try {
      // Try to parse as JSON
      const text = typeof response === 'string' ? response : JSON.stringify(response);
      const match = text.match(/\{[\s\S]*\}/);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        
        // If we have numeric scores
        if (typeof parsed.positive_score === 'number') {
          const scores = {
            positive_score: clamp(parsed.positive_score),
            negative_score: clamp(parsed.negative_score || 0),
            neutral_score: clamp(parsed.neutral_score || 0)
          };
          
          // Normalize
          const total = scores.positive_score + scores.negative_score + scores.neutral_score;
          if (total > 0) {
            scores.positive_score /= total;
            scores.negative_score /= total;
            scores.neutral_score /= total;
          }
          
          return {
            sentiment: parsed.sentiment || getTopLabel(scores),
            confidence: clamp(parsed.confidence || Math.max(scores.positive_score, scores.negative_score, scores.neutral_score)),
            positive_score: scores.positive_score,
            negative_score: scores.negative_score,
            neutral_score: scores.neutral_score,
            reasoning: parsed.reasoning || ''
          };
        }
        
        // If we have a sentiment label only
        const sentiment = (parsed.sentiment || parsed.label || '').toLowerCase();
        if (sentiment.indexOf('positive') !== -1) {
          return { sentiment: 'positive', confidence: 0.85, positive_score: 0.85, negative_score: 0.05, neutral_score: 0.10, reasoning: parsed.reasoning || '' };
        }
        if (sentiment.indexOf('negative') !== -1) {
          return { sentiment: 'negative', confidence: 0.85, positive_score: 0.05, negative_score: 0.85, neutral_score: 0.10, reasoning: parsed.reasoning || '' };
        }
        if (sentiment.indexOf('neutral') !== -1) {
          return { sentiment: 'neutral', confidence: 0.80, positive_score: 0.10, negative_score: 0.10, neutral_score: 0.80, reasoning: parsed.reasoning || '' };
        }
      }
    } catch (e) {
      console.warn('[AI] Parse error:', e);
    }
    
    // Fallback: keyword scan
    const lower = response.toLowerCase();
    if (lower.indexOf('negative') !== -1 && lower.indexOf('positive') === -1) {
      return { sentiment: 'negative', confidence: 0.70, positive_score: 0.10, negative_score: 0.70, neutral_score: 0.20, reasoning: '' };
    }
    if (lower.indexOf('positive') !== -1 && lower.indexOf('negative') === -1) {
      return { sentiment: 'positive', confidence: 0.70, positive_score: 0.70, negative_score: 0.10, neutral_score: 0.20, reasoning: '' };
    }
    
    return { sentiment: 'neutral', confidence: 0.50, positive_score: 0.33, negative_score: 0.33, neutral_score: 0.34, reasoning: '' };
  }

  function clamp(v) { 
    return typeof v === 'number' && !isNaN(v) ? Math.max(0, Math.min(1, v)) : 0; 
  }

  function getTopLabel(scores) {
    if (scores.positive_score >= scores.negative_score && scores.positive_score >= scores.neutral_score) return 'positive';
    if (scores.negative_score >= scores.positive_score && scores.negative_score >= scores.neutral_score) return 'negative';
    return 'neutral';
  }

  // Reset sessions (clear context)
  async function resetChat() {
    if (chatSession) {
      try {
        const newSession = await chatSession.clone();
        chatSession.destroy();
        chatSession = newSession;
        logMessage('system', 'Chat session reset');
      } catch (e) {
        logMessage('error', 'Failed to reset chat: ' + e.message);
      }
    }
  }

  return {
    AIStatus: AIStatus,
    initAI: initAI,
    chat: chat,
    chatStreaming: chatStreaming,
    classifyText: classifyText,
    resetChat: resetChat,
    getLog: getLog,
    clearLog: clearLog,
    hasActiveSession: function() { return chatSession !== null; }
  };

})();
