import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3003;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for Claude API
app.post('/api/clippy-reaction', async (req, res) => {
  try {
    const { text } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

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
        max_tokens: 180,
        system: `You are Clippy, a provocative writing coach.
Return exactly 3 short "possible directions" that push the student to think harder.
Each direction must do at least one of:
- challenge an assumption
- introduce a counterargument
- suggest a sharper lens or stake
- request missing evidence

Output format (exactly):
1) ...
2) ...
3) ...

Rules:
- Keep each line under 10 words.
- Make each line specific to the user's topic.
- No praise, no filler, no intro sentence.`,
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
    const { text, message } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
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
        max_tokens: 180,
        system: `You are Clippy, a provocative AI study buddy.
Give a direct answer, then push deeper thinking with multiple angles.

Output format (exactly):
Answer: <one short sentence>
1) <possible direction>
2) <possible direction>
3) <possible direction>

Rules:
- Keep each direction under 10 words.
- Base directions on the user's question and document context if provided.
- Prioritize challenge, tradeoffs, and stronger framing over generic tips.`,
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
    const { text } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'API key not configured in .env file' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
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
        max_tokens: 60,
        system: `You are a provocative writing autocomplete assistant.
Continue the user's text naturally with a short phrase (6-10 words) that nudges deeper thinking.
Prefer one of: sharper claim, caveat, counterargument, or evidence direction.
Output ONLY the continuation text — no explanations, no quotes, no prefix.
Match the user's style and tone.`,
        messages: [{
          role: 'user',
          content: text.slice(-300)
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

app.listen(PORT, () => {
  console.log(`✅ Clippy backend server running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend should call: http://localhost:${PORT}/api/clippy-reaction`);
  console.log(`🔑 API Key loaded: ${CLAUDE_API_KEY ? 'Yes' : 'No (check .env file)'}`);
});
