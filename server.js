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

app.listen(PORT, () => {
  console.log(`✅ Clippy backend server running on http://localhost:${PORT}`);
  console.log(`🔗 Frontend should call: http://localhost:${PORT}/api/clippy-reaction`);
  console.log(`🔑 API Key loaded: ${CLAUDE_API_KEY ? 'Yes' : 'No (check .env file)'}`);
});
