// Use local backend server to avoid CORS issues
const BACKEND_URL = "http://localhost:3003/api/clippy-reaction";

export async function getAIReaction(userText) {
  if (userText.length < 20) {
    throw new Error("Invalid parameters");
  }

  // Call our backend server instead of Anthropic directly
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: userText
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Backend request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.reply || "";
}
