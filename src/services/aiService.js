const AI_CONFIG = {
  endpoint: "https://api.anthropic.com/v1/messages",
  model: "claude-sonnet-4-20250514",
  maxTokens: 150,
  systemPrompt: `You are Clippy, the annoying paperclip assistant from Microsoft Office, but reimagined for university students. You are sarcastic, mildly passive-aggressive, and hilariously unhelpful. You react to whatever the student is writing. Keep responses to 1-2 short sentences MAX. Be funny, self-aware, and a little roast-y. Reference academic life, procrastination, coffee, deadlines, imposter syndrome, etc. Never be mean-spirited or hurtful — just playfully annoying. Do NOT use quotation marks around your response. Examples of your vibe: "That's a bold thesis. Unfortunately, bold doesn't mean correct." or "I see we're going with the 'quantity over quality' approach to word count."`,
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
        content: `React to this student writing (be brief, sarcastic, funny): "${userText.slice(-300)}"`
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
