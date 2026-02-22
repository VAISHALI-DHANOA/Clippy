import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

const MODE_RULES = {
  quiet: { cardCount: 1 },
  guided: { cardCount: 2 },
  brainstorm: { cardCount: 3 },
};

function normalizeMode(mode) {
  return MODE_RULES[mode] ? mode : 'guided';
}

function normalizeFrequency(frequency) {
  if (frequency === 'rare' || frequency === 'balanced' || frequency === 'frequent') {
    return frequency;
  }
  return 'balanced';
}

function normalizeHumorEnabled(value) {
  return value !== false;
}

// Proxy endpoint for Claude API
app.post('/api/clippy-reaction', async (req, res) => {
  try {
    const { text, mode, frequency, humorEnabled } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const normalizedMode = normalizeMode(mode);
    const normalizedFrequency = normalizeFrequency(frequency);
    const shouldUseHumor = normalizeHumorEnabled(humorEnabled) && normalizedMode === 'brainstorm';
    const cardCount = MODE_RULES[normalizedMode].cardCount;
    const usefulCount = shouldUseHumor ? cardCount - 1 : cardCount;

    // Call Anthropic API from server-side (no CORS issues)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: `You are Clippy, a writing coach.
Return exactly ${cardCount} suggestion cards.
Output format for every line:
<emoji> <Context Heading>: <one short suggestion sentence>

Heading rules:
- Heading must be auto-generated from the line content.
- Heading must be 2-5 words, title case, no punctuation, max 24 chars.
- Use concrete labels (example style: "Weak Evidence", "Scope Too Broad", "Missing Stakes").
- Never use generic headings like "Suggestion", "Tip", "Idea", "Feedback".

Body rules:
- Keep each suggestion concise, specific, and tied to the user's text.
- Line length should stay compact and scannable.
- No numbering, no bullet markers, no intro/outro text.

Mode context:
- Mode: ${normalizedMode}
- Frequency preference: ${normalizedFrequency}
- Useful cards required: ${usefulCount}
- Humor allowed on last card: ${shouldUseHumor ? 'yes' : 'no'}

If humor is allowed, only the final card may be funny/snarky and intentionally non-actionable, while still context-aware.
All other cards must be genuinely useful.`,
        messages: [{
          role: 'user',
          content: `Student writing sample:\n\n"${text.slice(-900)}"\n\nGive provocative possible directions.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    const reply = data.content?.map((i) => i.text || '').join('') || '';

    res.json({ reply });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Chat endpoint — user talks directly to Clippy
app.post('/api/clippy-chat', async (req, res) => {
  try {
    const { text, message, mode, frequency, humorEnabled } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const normalizedMode = normalizeMode(mode);
    const normalizedFrequency = normalizeFrequency(frequency);
    const shouldUseHumor = normalizeHumorEnabled(humorEnabled) && normalizedMode === 'brainstorm';
    const cardCount = MODE_RULES[normalizedMode].cardCount;
    const usefulCount = shouldUseHumor ? cardCount - 1 : cardCount;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 220,
        system: `You are Clippy, a writing coach.
Return exactly ${cardCount} response cards.
Each line format:
<emoji> <Context Heading>: <one short sentence>

Card requirements:
- At least one useful card must directly answer the user's question.
- Remaining useful cards should challenge assumptions, add tradeoffs, or request evidence.
- If humor is allowed, only the final card may be playful/non-actionable.

Heading rules:
- Auto-generate headings from each line's content.
- 2-5 words, title case, max 24 chars, no punctuation.
- Never use generic labels like "Suggestion", "Tip", "Answer", or "Feedback".

Style rules:
- Keep lines concise and context-specific.
- No numbering, bullets, or extra prose.
- Mode: ${normalizedMode}, Frequency: ${normalizedFrequency}, Useful cards required: ${usefulCount}, Humor on final card: ${shouldUseHumor ? 'yes' : 'no'}.`,
        messages: [
          ...(text ? [{
            role: 'user',
            content: `Here's what I've written so far:\n\n"${text.slice(-600)}"`
          }, {
            role: 'assistant',
            content: "Got it! I can see your document. What do you need?"
          }] : []),
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    const reply = data.content?.map((i) => i.text || '').join('') || '';

    res.json({ reply });
  } catch (error) {
    console.error('Error in clippy-chat:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Text completion/suggestion endpoint
app.post('/api/clippy-suggestion', async (req, res) => {
  try {
    const { text, previousSuggestion, mode, frequency } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const fullText = String(text);
    const paragraphs = fullText.split(/\n\s*\n/).filter(Boolean);
    const currentParagraph = (paragraphs[paragraphs.length - 1] || fullText).slice(-450);
    const recentContext = fullText.slice(-1200);
    const normalizedMode = normalizeMode(mode);
    const normalizedFrequency = normalizeFrequency(frequency);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        system: `You are a provocative writing autocomplete assistant.
Continue with exactly one complete sentence (8-16 words) that nudges deeper thinking.
If the user's text ends mid-sentence, finish that sentence cleanly.
If the user's text already ends a sentence, start the next sentence with a fresh direction.
Prefer one of: sharper claim, caveat, counterargument, or evidence direction.
Anchor your continuation in the current paragraph while staying consistent with recent document context.
Avoid repeating the previous suggestion wording if one is provided.
Your sentence must end with punctuation (. ! or ?).
Output ONLY the continuation text — no explanations, no quotes, no prefix.
Match the user's style and tone.

Mode: ${normalizedMode}
Frequency preference: ${normalizedFrequency}
Mode behavior:
- quiet: choose lower-risk, clarifying continuations.
- guided: choose argument-strengthening continuations.
- brainstorm: choose bolder, exploratory continuations.`,
        messages: [{
          role: 'user',
          content: `Recent context:\n${recentContext}\n\nCurrent paragraph:\n${currentParagraph}\n\nPrevious suggestion (avoid repeating): ${previousSuggestion || '(none)'}\n\nContinue from the final line.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    const suggestion = data.content?.map((i) => i.text || '').join('') || '';

    res.json({ suggestion });
  } catch (error) {
    console.error('Error calling Claude API for suggestion:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Spreadsheet AI reaction endpoint
app.post('/api/clippy-spreadsheet', async (req, res) => {
  try {
    const { tableData, selectedCell } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!tableData) {
      return res.status(400).json({ error: 'Missing tableData' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `You are Clippy, a sassy AI data assistant. Give ONE short suggestion about the user's spreadsheet data — a formula, pattern, or tip. Max 1 sentence. Supported formulas: =SUM, =AVG, =MIN, =MAX, =COUNT, and arithmetic like =A1+B1.`,
        messages: [{
          role: 'user',
          content: `Here's the current spreadsheet data:\n\n${tableData}\n\n${selectedCell ? `Currently selected cell: ${selectedCell}` : ''}\n\nGive one specific helpful suggestion.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    const reply = data.content?.map((i) => i.text || '').join('') || '';

    res.json({ reply });
  } catch (error) {
    console.error('Error in clippy-spreadsheet:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Cell autofill suggestion endpoint
app.post('/api/clippy-cell-suggest', async (req, res) => {
  try {
    const { tableData, cellRef, currentValue } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!tableData || !cellRef) {
      return res.status(400).json({ error: 'Missing tableData or cellRef' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 30,
        system: `You are a spreadsheet autofill assistant. Given a spreadsheet and a target cell, predict the most likely value for that cell based on patterns in surrounding data (column patterns, sequences, formulas, labels, etc.).

Rules:
- Output ONLY the suggested value — no explanations, no quotes, no prefix.
- If the column has numbers increasing by a pattern, continue the pattern.
- If the column has labels/categories, suggest the next likely label.
- If a formula would make sense (like a SUM row at the bottom), suggest the formula (e.g. =SUM(A1:A5)).
- If there's no clear pattern, output exactly: NONE
- Keep it to a single value or short formula.`,
        messages: [{
          role: 'user',
          content: `Spreadsheet data:\n${tableData}\n\nTarget cell: ${cellRef}\n${currentValue ? `Current value being typed: ${currentValue}` : 'Cell is empty.'}\n\nSuggest a value:`
        }]
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }

    const data = await response.json();
    const suggestion = (data.content?.map((i) => i.text || '').join('') || '').trim();

    res.json({ suggestion: suggestion === 'NONE' ? '' : suggestion });
  } catch (error) {
    console.error('Error in clippy-cell-suggest:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Dashboard AI reaction endpoint
app.post('/api/clippy-dashboard', async (req, res) => {
  try {
    const { tableData, dashboardConfig } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!tableData && !dashboardConfig) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: `You are Clippy, a sassy AI visualization assistant. Give ONE short suggestion about the user's dashboard — a chart type, correlation, or insight. Max 1 sentence.`,
        messages: [{
          role: 'user',
          content: `Spreadsheet data:\n${tableData || '(empty)'}\n\nDashboard configuration:\n${dashboardConfig || '(no charts yet)'}\n\nGive one specific suggestion about the dashboard.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    const reply = data.content?.map((i) => i.text || '').join('') || '';

    res.json({ reply });
  } catch (error) {
    console.error('Error in clippy-dashboard:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Text-to-speech endpoint using OpenAI TTS API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured in .env file' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: voice || 'nova',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI TTS error:', errorData);
      return res.status(response.status).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Ephemeral token for OpenAI Realtime API (WebRTC voice conversation)
app.post('/api/realtime-session', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured in .env file' });
    }

    const { instructions, voice } = req.body;

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview',
        voice: voice || 'shimmer',
        instructions: instructions || 'You are Clippy, a sassy AI assistant. Answer in 1 sentence. Be witty and useful. Never ramble.',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Realtime session error:', errorData);
      return res.status(response.status).json({ error: 'Failed to create realtime session' });
    }

    const data = await response.json();
    res.json({
      sessionId: data.id,
      clientSecret: data.client_secret.value,
      expiresAt: data.client_secret.expires_at,
    });
  } catch (error) {
    console.error('Error creating realtime session:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Health check endpoint for Render
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve built frontend from the same server in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Clippy server running on port ${PORT}`);
  console.log(`🔗 API endpoint: /api/clippy-reaction`);
  console.log(`🔑 API Key loaded: ${CLAUDE_API_KEY ? 'Yes' : 'No (check .env file)'}`);
});
