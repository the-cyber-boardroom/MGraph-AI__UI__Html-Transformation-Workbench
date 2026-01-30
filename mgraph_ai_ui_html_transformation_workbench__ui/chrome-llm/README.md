# Nano Classifier — On-Device Sentiment Analysis

A pure browser-based MVP that uses **Chrome's built-in Gemini Nano model** for text classification (sentiment analysis). Once the model is downloaded by Chrome, it works completely **offline**.

## Design Choices Summary

- **Chrome AI API**: Uses `window.ai.languageModel` (Prompt API) to access Gemini Nano
- **Classification**: Prompt-based sentiment analysis returning structured JSON scores
- **Offline Strategy**: Service Worker caches app assets; Chrome manages model cache
- **UI Framework**: Vanilla JS with ES modules (no build step required)
- **Styling**: Custom CSS with CSS variables for theming

---

## Architecture

### Chrome AI API Usage

This app uses Chrome's **Prompt API** (`window.ai.languageModel`) to access the on-device Gemini Nano model:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Chrome 127+)                │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Web App       │    │   Chrome Built-in AI            │ │
│  │                 │    │   ┌───────────────────────────┐ │ │
│  │  ai.js ─────────┼────┼──►│ window.ai.languageModel   │ │ │
│  │                 │    │   │  ├─ capabilities()        │ │ │
│  │                 │    │   │  ├─ create()              │ │ │
│  │                 │    │   │  └─ session.prompt()      │ │ │
│  │                 │    │   └───────────┬───────────────┘ │ │
│  └─────────────────┘    │               │                 │ │
│                         │   ┌───────────▼───────────────┐ │ │
│                         │   │    Gemini Nano Model      │ │ │
│                         │   │    (Downloaded by Chrome) │ │ │
│                         │   └───────────────────────────┘ │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### API Flow

1. **Feature Detection**: Check if `window.ai.languageModel` exists
2. **Capabilities Check**: Call `capabilities()` to determine model status:
   - `'readily'` — Model is downloaded and ready
   - `'after-download'` — Model needs to be downloaded first
   - `'no'` — Model not supported on this device/OS
3. **Session Creation**: Call `create()` with a system prompt for classification
4. **Inference**: Call `session.prompt()` with the text to classify

### Model Download Behavior

The Gemini Nano model is managed entirely by Chrome:

| State | Detection | Behavior |
|-------|-----------|----------|
| Not downloaded | `capabilities().available === 'after-download'` | First `create()` triggers download |
| Downloading | Monitor via `downloadprogress` events | UI shows progress |
| Ready | `capabilities().available === 'readily'` | Instant session creation |

### Offline Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     OFFLINE MODE                         │
│                                                          │
│  ┌────────────────────┐    ┌────────────────────────┐   │
│  │  Service Worker    │    │  Chrome Model Cache    │   │
│  │  ┌──────────────┐  │    │  ┌──────────────────┐  │   │
│  │  │ index.html   │  │    │  │ Gemini Nano      │  │   │
│  │  │ styles.css   │  │    │  │ (~2GB)           │  │   │
│  │  │ src/*.js     │  │    │  │                  │  │   │
│  │  └──────────────┘  │    │  └──────────────────┘  │   │
│  │  Managed by App    │    │  Managed by Chrome     │   │
│  └────────────────────┘    └────────────────────────┘   │
│                                                          │
│  ✓ Both caches required for offline classification      │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
chrome-ai-classifier/
├── index.html           # Main HTML with UI structure
├── styles.css           # All styling (CSS variables, dark theme)
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline caching for app assets
├── src/
│   ├── main.js          # Bootstrap: SW registration, AI init, event wiring
│   ├── ai.js            # Chrome AI wrapper: initAI(), classifyText()
│   └── ui.js            # DOM manipulation and UI state management
└── README.md            # This file
```

### File Responsibilities

| File | Purpose |
|------|---------|
| `main.js` | Entry point. Registers SW, initializes AI, wires UI events |
| `ai.js` | Wraps Chrome AI APIs. Exports `initAI()` and `classifyText()` |
| `ui.js` | Pure UI logic. Updates DOM, handles user input, shows results |
| `service-worker.js` | Caches app shell for offline use (not the model) |

---

## Chrome AI Integration Details

### initAI()

```typescript
export async function initAI(): Promise<{
  ready: boolean;
  status: 'ready' | 'downloading' | 'unavailable' | 'error';
  reason?: string;
}>
```

Handles:
- Feature detection (`window.ai.languageModel` exists)
- Capability checking (model available/downloading/not supported)
- Session creation with classification-optimized system prompt
- Download progress monitoring via custom events

### classifyText()

```typescript
export async function classifyText(input: string): Promise<{
  label: 'positive' | 'negative' | 'neutral';
  scores: { positive: number; negative: number; neutral: number };
  inferenceTime: number;
  raw: string;
}>
```

Handles:
- Input validation and truncation (4000 char limit)
- Prompt construction for structured JSON output
- Response parsing with fallback strategies
- Score normalization (sum to 1.0)

---

## Setup & Testing Instructions

### Prerequisites

1. **Chrome Version**: 127 or newer (Dev/Canary channel recommended)
2. **Operating System**: 
   - Windows 10/11 (64-bit)
   - macOS 13+ (Apple Silicon or Intel)
   - ChromeOS
   - Linux (limited support)
3. **Storage**: ~2GB free for Gemini Nano model

### Step 1: Enable Chrome Flags

Open Chrome and navigate to these flag URLs:

```
chrome://flags/#optimization-guide-on-device-model
```
→ Set to **Enabled BypassPerfRequirement**

```
chrome://flags/#prompt-api-for-gemini-nano
```
→ Set to **Enabled**

**Relaunch Chrome** after changing flags.

### Step 2: Verify Model Availability

1. Open Chrome DevTools (F12)
2. In the Console, run:
   ```javascript
   await window.ai.languageModel.capabilities()
   ```
3. Check the `available` property:
   - `'readily'` — Good to go!
   - `'after-download'` — Model will download on first use
   - `'no'` — Not supported (check flags/OS)

### Step 3: Trigger Model Download (if needed)

If `available` is `'after-download'`, force the download:

1. Go to `chrome://components`
2. Find **Optimization Guide On Device Model**
3. Click **Check for update**
4. Wait for download (~2GB)

### Step 4: Serve the App

From the project directory:

```bash
# Python 3
python -m http.server 8080

# Node.js (if you have `serve` installed)
npx serve -p 8080

# Or any static file server
```

### Step 5: Test the App

1. Open `http://localhost:8080` in Chrome
2. Check the status bar:
   - **AI Ready (On-Device)** — Good!
   - **Model Downloading...** — Wait for completion
   - **AI Unavailable** — Check flags/requirements
3. Enter text and click **Classify**
4. View sentiment results

### Step 6: Test Offline Mode

1. Open DevTools → Network tab
2. Check **Offline** checkbox (or use Application → Service Workers → Offline)
3. Verify status bar shows **Offline (Using Cache)**
4. Try classifying text — should still work!
5. Refresh the page — should load from Service Worker cache

---

## Troubleshooting

### "AI Unavailable" Error

| Cause | Solution |
|-------|----------|
| Chrome too old | Update to 127+ |
| Flags not enabled | Enable both flags listed above |
| Model not downloaded | Go to `chrome://components`, update Optimization Guide |
| Unsupported OS | Try Windows/macOS, Linux support is limited |
| Insufficient storage | Free up ~2GB for the model |

### "Model Downloading" Takes Forever

- The Gemini Nano model is ~2GB
- First download can take 5-15 minutes depending on connection
- Check `chrome://components` for download progress

### Classification Returns Weird Results

- Gemini Nano is optimized for conversation, not strict JSON
- The `ai.js` module includes fallback parsing for non-JSON responses
- Very short inputs (<10 chars) may produce unreliable results

### Service Worker Not Registering

- Must be served over HTTPS or localhost
- Check DevTools → Application → Service Workers
- Try unregistering and refreshing

---

## Notes & Caveats

### Platform Limitations

- **Chrome-only**: This uses Chrome's proprietary Prompt API
- **Desktop-only**: Mobile Chrome doesn't support Gemini Nano yet
- **OS-dependent**: Best support on Windows/macOS

### Performance Expectations

| Metric | Typical Value |
|--------|---------------|
| First load (model download) | 5-15 minutes |
| Session creation | 100-500ms |
| Classification (short text) | 200-500ms |
| Classification (long text) | 500-2000ms |
| Memory usage | ~500MB during inference |

### Model Behavior

- Gemini Nano is a general-purpose LLM, not a dedicated classifier
- Results depend heavily on prompt engineering
- JSON output is not guaranteed — fallback parsing is essential
- Confidence scores are model estimates, not calibrated probabilities

### Offline Considerations

- App assets cached by Service Worker (~50KB)
- Model cached by Chrome (~2GB, not controlled by app)
- Both caches must exist for offline to work
- Model cache persists across browser sessions
- Clearing Chrome data may remove the model

---

## API Reference

### ai.js Exports

```javascript
// Initialize Chrome AI session
export async function initAI(): Promise<InitResult>

// Classify text sentiment  
export async function classifyText(input: string): Promise<ClassifyResult>

// Clean up session
export async function destroySession(): Promise<void>

// Check if session exists
export function hasActiveSession(): boolean

// Status enum
export const AIStatus = {
  UNAVAILABLE: 'unavailable',
  DOWNLOADING: 'downloading',
  READY: 'ready',
  ERROR: 'error'
}
```

### Custom Events

```javascript
// Fired during model download
window.addEventListener('ai-download-progress', (e) => {
  const { loaded, total } = e.detail;
  console.log(`${Math.round(loaded/total*100)}%`);
});
```

---

## License

MIT — Use freely, modify as needed.

---

## Resources

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Explainer](https://github.com/nicoverall/nicoverall.github.io/blob/main/prompt-api.md)
- [Chrome Flags for AI](https://chromestatus.com/feature/5118286462550016)

sites that work:

- https://chrome.dev/web-ai-demos/prompt-api-playground/
- https://prompt-api.com/
