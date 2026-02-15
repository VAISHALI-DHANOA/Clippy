# Clippy 2.0 - Refactored Architecture

A clean, modular React application with proper separation of concerns.

## 📁 Project Structure

```
Clippy/
├── clippy.jsx                    # Original monolithic file (legacy)
├── clippy-refactored.jsx         # Backward-compatible entry point
└── src/
    ├── index.jsx                 # Main export
    ├── components/               # React components
    │   ├── AnnoyingClippy.jsx   # Main app component
    │   ├── ClippyCharacter.jsx  # SVG character visual
    │   ├── SpeechBubble.jsx     # Message bubble UI
    │   ├── ApiKeyInput.jsx      # API key configuration
    │   └── WritingArea.jsx      # Text editor with stats
    ├── hooks/                    # Custom React hooks
    │   ├── useClippyReactions.js  # Text reaction logic
    │   ├── useQuiz.js             # Quiz functionality
    │   └── useIdleDetection.js    # Idle timer management
    ├── services/                 # External services
    │   └── aiService.js          # Claude AI API integration
    ├── data/                     # Static data & constants
    │   ├── quotes.js             # Clippy quotes & expressions
    │   ├── reactions.js          # Text pattern reactions
    │   └── quizQuestions.js      # Quiz question bank
    ├── utils/                    # Utility functions
    │   └── textAnalysis.js       # Text processing utilities
    └── styles/                   # Style constants
        └── animations.js         # CSS animations & colors
```

## 🏗️ Architecture Principles

### Separation of Concerns
- **Components**: Pure presentational components, minimal logic
- **Hooks**: Reusable stateful logic
- **Services**: External API interactions
- **Data**: Static constants and configuration
- **Utils**: Pure utility functions

### Key Improvements

#### 1. **Components** ([src/components/](src/components/))
   - `AnnoyingClippy.jsx` - Main orchestration component
   - `ClippyCharacter.jsx` - Isolated SVG character rendering
   - `SpeechBubble.jsx` - Reusable message bubble with quiz UI
   - `ApiKeyInput.jsx` - API key configuration component
   - `WritingArea.jsx` - Text editor with word/character counts

#### 2. **Custom Hooks** ([src/hooks/](src/hooks/))
   - `useClippyReactions` - Handles text change detection and reactions
   - `useQuiz` - Manages quiz state and logic
   - `useIdleDetection` - Tracks user idle time

#### 3. **Services** ([src/services/](src/services/))
   - `aiService.js` - Encapsulates Claude AI API calls
   - Centralized configuration
   - Error handling

#### 4. **Data Layer** ([src/data/](src/data/))
   - `quotes.js` - All Clippy messages and expressions
   - `reactions.js` - Text pattern triggers with cooldowns
   - `quizQuestions.js` - Quiz question database

#### 5. **Utilities** ([src/utils/](src/utils/))
   - `textAnalysis.js` - Text processing functions
     - Word/character counting
     - Reaction matching with cooldowns
     - Cooldown management

#### 6. **Styles** ([src/styles/](src/styles/))
   - `animations.js` - CSS keyframe animations
   - `BUBBLE_COLORS` - Color schemes for different states

## 🎯 Benefits

### Maintainability
- Each file has a single, clear responsibility
- Easy to locate and modify specific features
- Components are isolated and testable

### Reusability
- Custom hooks can be reused across components
- Services can be mocked for testing
- Utilities are pure functions

### Scalability
- Easy to add new reactions (just edit `reactions.js`)
- Simple to add new quiz questions (`quizQuestions.js`)
- New features can be added without touching existing code

### Developer Experience
- Clear file organization
- Logical grouping by concern
- Easy to onboard new developers

## 🔧 Usage

### Import the main component:
```jsx
import AnnoyingClippy from './src/index.jsx';
// or
import AnnoyingClippy from './clippy-refactored.jsx';
```

### Add new reactions:
Edit [src/data/reactions.js](src/data/reactions.js):
```js
{
  trigger: /\b(your pattern)\b/i,
  response: "Your snarky response",
  cooldown: 30000
}
```

### Modify AI behavior:
Edit [src/services/aiService.js](src/services/aiService.js) to change the AI prompt or model.

### Add new components:
Create in [src/components/](src/components/) and import into `AnnoyingClippy.jsx`.

## 📦 Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| `AnnoyingClippy.jsx` | Main component, orchestrates everything | ~150 |
| `ClippyCharacter.jsx` | SVG rendering only | ~75 |
| `SpeechBubble.jsx` | Message bubble UI | ~80 |
| `useClippyReactions.js` | Reaction detection logic | ~60 |
| `aiService.js` | AI API calls | ~40 |
| `reactions.js` | Reaction patterns data | ~90 |

**Total**: Went from 1 file (500+ lines) → 17 modular files (~100 lines avg)

## 🚀 How to Run

### Option 1: Simple Method (No Installation) ⚡

Just open the HTML file directly:

```bash
# Navigate to the project folder
cd "/Users/vdhanoa/Desktop/HCAI Teaching/Clippy"

# Start a simple HTTP server
python3 -m http.server 8000
```

Then open your browser to: **http://localhost:8000**

> **Note**: This uses CDN-loaded React and Babel, so it's slower but requires zero setup!

---

### Option 2: Professional Setup with Vite (Recommended) 🔥

```bash
# Navigate to the project folder
cd "/Users/vdhanoa/Desktop/HCAI Teaching/Clippy"

# Install dependencies
npm install

# Start development server
npm run dev
```

Your app will open automatically at **http://localhost:3000**

#### Build for production:
```bash
npm run build
npm run preview
```

---

## 🎯 Quick Start Summary

**Fastest way:**
1. Open Terminal
2. Run: `cd "/Users/vdhanoa/Desktop/HCAI Teaching/Clippy" && python3 -m http.server 8000`
3. Open: http://localhost:8000
4. Start typing and watch Clippy react!

**Professional way:**
1. Run: `npm install`
2. Run: `npm run dev`
3. Browser opens automatically
4. Enjoy hot-reloading during development

---

## 🔑 Adding Your Claude API Key

Once the app is running:
1. Look for the purple **"🤖 AI Mode"** input at the top
2. Paste your [Claude API key](https://console.anthropic.com/)
3. Start typing - Clippy will now use AI for intelligent reactions!

Without an API key, Clippy uses the built-in pattern-based reactions (still very annoying! 😄)

---

## 🚀 Next Steps

Potential enhancements:
- Add TypeScript for type safety
- Write unit tests for utilities and hooks
- Add integration tests for components
- Implement state management (Context/Redux) if needed
- Add accessibility features
- Create Storybook for component documentation
