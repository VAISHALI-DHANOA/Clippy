const AI_CONFIG = {
  endpoint: "https://api.anthropic.com/v1/messages",
  model: "claude-sonnet-4-20250514",
  maxTokens: 200,
  systemPrompt: `You are Clippy, an AI writing assistant for students. You analyze their writing in real-time and provide helpful, actionable feedback with a playful edge.

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
};

export async function getAIReaction(userText, apiKey) {
  if (!apiKey || userText.length < 30) {
    throw new Error("Invalid parameters");
  }

  const response = await fetch(AI_CONFIG.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: AI_CONFIG.systemPrompt,
      messages: [{
        role: "user",
        content: `Analyze this student's writing and give ONE specific, actionable suggestion about their content, structure, or style. Be helpful but playful:\n\n"${userText.slice(-500)}"`
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const reply = data.content?.map((i) => i.text || "").join("") || "";

  return reply;
}
