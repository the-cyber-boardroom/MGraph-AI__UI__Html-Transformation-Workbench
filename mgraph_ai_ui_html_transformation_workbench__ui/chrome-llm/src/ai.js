/**
 * ai.js — Chrome Built-in AI (Gemini Nano) Integration
 * 
 * Chrome AI API (Jan 2025):
 * - LanguageModel is exposed as a global
 * - LanguageModel.availability() checks model status
 * - LanguageModel.create() initializes a session
 * - session.prompt() runs inference
 */

window.NanoAI = (function() {
  
  let aiSession = null;

  const AIStatus = {
    UNAVAILABLE: 'unavailable',
    DOWNLOADING: 'downloading', 
    READY: 'ready',
    ERROR: 'error'
  };

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
      return {
        ready: false,
        status: AIStatus.UNAVAILABLE,
        reason: 'Chrome built-in AI is not available. Make sure you\'re using Chrome 138+ with the Prompt API enabled.'
      };
    }

    try {
      let availability = 'available';
      try {
        availability = await LanguageModel.availability();
        console.log('[AI] Availability:', availability);
      } catch (e) {
        console.log('[AI] Could not check availability:', e.message);
      }

      if (availability === 'unavailable') {
        return {
          ready: false,
          status: AIStatus.UNAVAILABLE,
          reason: 'Gemini Nano is not available on this device.'
        };
      }

      const sessionOptions = {
        systemPrompt: 'You are a sentiment classifier. Respond ONLY with valid JSON in this format: {"positive": 0.0, "negative": 0.0, "neutral": 0.0}. Scores must be between 0-1 and sum to 1.'
      };

      if (availability === 'downloadable' || availability === 'downloading') {
        console.log('[AI] Model downloading...');
        sessionOptions.monitor = function(m) {
          m.addEventListener('downloadprogress', function(e) {
            console.log('[AI] Download:', Math.round(e.loaded * 100) + '%');
          });
        };
      }

      aiSession = await LanguageModel.create(sessionOptions);
      console.log('[AI] Session created');
      
      return { ready: true, status: AIStatus.READY };

    } catch (error) {
      console.error('[AI] Init error:', error);
      return {
        ready: false,
        status: AIStatus.ERROR,
        reason: 'Failed to initialize: ' + error.message
      };
    }
  }

  async function classifyText(input) {
    if (!aiSession) throw new Error('AI not initialized');
    if (!input || !input.trim()) throw new Error('Input required');

    const text = input.length > 4000 ? input.substring(0, 4000) : input;

    try {
      console.log('[AI] Classifying...');
      const start = performance.now();
      
      // Define JSON Schema for structured output
      const responseSchema = {
        type: "object",
        properties: {
          sentiment: {
            type: "string",
            enum: ["positive", "negative", "neutral"]
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          positive_score: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          negative_score: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          neutral_score: {
            type: "number",
            minimum: 0,
            maximum: 1
          },
          reasoning: {
            type: "string"
          }
        },
        required: ["sentiment", "confidence", "positive_score", "negative_score", "neutral_score"]
      };

      const prompt = 'Analyze the sentiment of this text. Provide scores for each sentiment (positive, negative, neutral) that sum to 1.0.\n\nText: "' + text + '"';

      const response = await aiSession.prompt(prompt, {
        responseConstraint: responseSchema
      });
      
      const elapsed = Math.round(performance.now() - start);
      console.log('[AI] Done in ' + elapsed + 'ms:', response);

      // Parse the structured response
      const result = parseStructuredResponse(response);
      
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
      console.error('[AI] Error:', error);
      
      // Fallback to non-structured if responseConstraint fails
      if (error.message && error.message.indexOf('responseConstraint') !== -1) {
        console.log('[AI] Falling back to unstructured prompt...');
        return classifyTextFallback(text);
      }
      
      throw new Error('Classification failed: ' + error.message);
    }
  }

  // Fallback for browsers that don't support responseConstraint
  async function classifyTextFallback(text) {
    const start = performance.now();
    
    const response = await aiSession.prompt(
      'Classify sentiment as positive, negative, or neutral. Respond with JSON: {"sentiment": "...", "confidence": 0.0, "positive_score": 0.0, "negative_score": 0.0, "neutral_score": 0.0}\n\nText: "' + text + '"'
    );
    
    const elapsed = Math.round(performance.now() - start);
    const scores = parseScores(response);
    
    return {
      label: getTopLabel(scores),
      scores: scores,
      inferenceTime: elapsed,
      raw: response
    };
  }

  function parseStructuredResponse(response) {
    try {
      // Response should already be valid JSON from responseConstraint
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: clamp(parsed.confidence || 0.5),
        positive_score: clamp(parsed.positive_score || 0),
        negative_score: clamp(parsed.negative_score || 0),
        neutral_score: clamp(parsed.neutral_score || 0),
        reasoning: parsed.reasoning || ''
      };
    } catch (e) {
      console.warn('[AI] Structured parse failed, using fallback:', e);
      const scores = parseScores(response);
      return {
        sentiment: getTopLabel(scores),
        confidence: Math.max(scores.positive, scores.negative, scores.neutral),
        positive_score: scores.positive,
        negative_score: scores.negative,
        neutral_score: scores.neutral,
        reasoning: ''
      };
    }
  }

  function parseScores(response) {
    try {
      const match = response.match(/\{[\s\S]*?\}/);
      if (match) {
        const p = JSON.parse(match[0]);
        
        // Format 1: Model returned scores directly {"positive": 0.8, "negative": 0.1, "neutral": 0.1}
        if (typeof p.positive === 'number' || typeof p.negative === 'number' || typeof p.neutral === 'number') {
          const scores = {
            positive: clamp(p.positive || 0),
            negative: clamp(p.negative || 0),
            neutral: clamp(p.neutral || 0)
          };
          const total = scores.positive + scores.negative + scores.neutral;
          if (total > 0) {
            scores.positive /= total;
            scores.negative /= total;
            scores.neutral /= total;
          }
          return scores;
        }
        
        // Format 2: Model returned a label {"sentiment": "negative"} or {"label": "positive"}
        const label = (p.sentiment || p.label || p.classification || '').toLowerCase();
        if (label.indexOf('positive') !== -1) {
          return { positive: 0.85, negative: 0.05, neutral: 0.10 };
        }
        if (label.indexOf('negative') !== -1) {
          return { positive: 0.05, negative: 0.85, neutral: 0.10 };
        }
        if (label.indexOf('neutral') !== -1) {
          return { positive: 0.10, negative: 0.10, neutral: 0.80 };
        }
      }
    } catch (e) {
      console.warn('[AI] Parse error:', e);
    }
    
    // Fallback: scan for keywords in raw response
    const lower = response.toLowerCase();
    if (lower.indexOf('negative') !== -1 && lower.indexOf('positive') === -1) {
      return { positive: 0.05, negative: 0.85, neutral: 0.10 };
    }
    if (lower.indexOf('positive') !== -1 && lower.indexOf('negative') === -1) {
      return { positive: 0.85, negative: 0.05, neutral: 0.10 };
    }
    if (lower.indexOf('neutral') !== -1) {
      return { positive: 0.10, negative: 0.10, neutral: 0.80 };
    }
    return { positive: 0.33, negative: 0.33, neutral: 0.34 };
  }

  function clamp(v) { 
    return typeof v === 'number' && !isNaN(v) ? Math.max(0, Math.min(1, v)) : 0; 
  }

  function getTopLabel(scores) {
    if (scores.positive >= scores.negative && scores.positive >= scores.neutral) return 'positive';
    if (scores.negative >= scores.positive && scores.negative >= scores.neutral) return 'negative';
    return 'neutral';
  }

  return {
    AIStatus: AIStatus,
    initAI: initAI,
    classifyText: classifyText,
    hasActiveSession: function() { return aiSession !== null; }
  };

})();
