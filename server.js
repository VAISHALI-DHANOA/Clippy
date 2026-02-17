import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3003;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

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
        max_tokens: 200,
        system: `You are Clippy, an AI writing assistant for students. You analyze their writing in real-time and provide helpful, actionable feedback with a playful edge.

Your job: Give SPECIFIC suggestions about their content, structure, and arguments. Be constructive but sassy.

Focus on:
- Thesis clarity and strength
- Argument structure and logic
- Evidence and citations
- Writing style issues (passive voice, wordiness, repetition)
- Academic tone problems
- Paragraph organization
- Specific word choice improvements
- Missing transitions or connections

Format: 1-2 sentences with SPECIFIC actionable advice about THEIR content. Reference what they actually wrote.

Examples:
✅ "Your thesis in paragraph 2 is vague - try being more specific about HOW social media affects mental health, not just that it does."
✅ "You've used 'important' 4 times already. Try 'crucial', 'significant', or 'pivotal' for variety."
✅ "This paragraph jumps topics. Add a transition sentence connecting your climate change point to the economic argument."
✅ "That's a claim, not an argument. Where's your evidence? Citation needed!"

❌ "Nice writing!" (too generic)
❌ "This is boring." (not helpful)

Stay playful but USEFUL. Students should learn something from every comment.`,
        messages: [{
          role: 'user',
          content: `Analyze this student's writing and give ONE specific, actionable suggestion about their content, structure, or style. Be helpful but playful:\n\n"${text.slice(-500)}"`
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
        max_tokens: 200,
        system: `You are Clippy, a helpful but slightly sassy AI writing assistant. The user is writing a document and is chatting with you directly. You can see their current draft (if any). Be helpful, concise, and keep your personality — witty but genuinely useful. Keep responses under 2-3 sentences.`,
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
        max_tokens: 40,
        system: `You are a writing autocomplete assistant. Continue the user's text naturally with a short phrase (5-15 words). Output ONLY the continuation text — no explanations, no quotes, no prefix. Match the user's style and tone exactly.`,
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
        max_tokens: 200,
        system: `You are Clippy, a helpful but sassy AI data assistant. The user is working in a spreadsheet. You can see their current data. Give ONE specific, actionable suggestion about their data — a formula they could use, a pattern you notice, a chart suggestion, or a data organization tip. Be playful but genuinely useful. Keep it to 1-2 sentences.

Supported formulas the user can type: =SUM(A1:A5), =AVG(A1:A5), =MIN(A1:A5), =MAX(A1:A5), =COUNT(A1:A5), and simple arithmetic like =A1+B1.

Examples of good suggestions:
- "I see numbers in column B! Try =SUM(B1:B5) to total them up."
- "Your data in column A looks like it's trending upward — a line chart would show that nicely!"
- "You've got empty cells in row 3. Fill those in or your AVG formula will be off."
- "Column C looks like percentages. Want to add =AVG(C1:C8) to see the average?"
- "That's a lot of data! Try using =MIN and =MAX to find your range."`,
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
        max_tokens: 200,
        system: `You are Clippy, a helpful but sassy AI visualization assistant. The user is building an interactive dashboard with multiple charts linked to a spreadsheet. You can see their data and current chart configuration.

Give ONE specific, actionable suggestion about their dashboard — a chart type to add, a correlation you spot, a filter to try, a better column mapping, or a data insight. Be playful but genuinely useful. Keep it to 1-2 sentences.

Examples of good suggestions:
- "Your columns A and C look correlated — add a scatter plot with A on X and C on Y to visualize it!"
- "That bar chart would be clearer as a histogram — column B has continuous values, not categories."
- "Try filtering rows 1-20 to zoom in on that spike in column D!"
- "I see 5 categories in column A — a pie chart would show their proportions nicely."
- "Add a heatmap with A as rows and B as columns to spot patterns in your data!"`,
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

app.listen(PORT, () => {
  console.log(`✅ Clippy backend server running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend should call: http://localhost:${PORT}/api/clippy-reaction`);
  console.log(`🔑 API Key loaded: ${CLAUDE_API_KEY ? 'Yes' : 'No (check .env file)'}`);
});
