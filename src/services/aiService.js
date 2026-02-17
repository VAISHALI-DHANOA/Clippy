// Use local backend server to avoid CORS issues
const BACKEND_URL = "http://localhost:3003/api/clippy-reaction";
const SUGGESTION_URL = "http://localhost:3003/api/clippy-suggestion";
const SPREADSHEET_URL = "http://localhost:3003/api/clippy-spreadsheet";
const CELL_SUGGEST_URL = "http://localhost:3003/api/clippy-cell-suggest";
const DASHBOARD_URL = "http://localhost:3003/api/clippy-dashboard";

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

export async function getAIChat(documentText, userMessage) {
  try {
    const response = await fetch("http://localhost:3003/api/clippy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: documentText, message: userMessage }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.reply || null;
  } catch (error) {
    console.error("Chat request failed:", error);
    return null;
  }
}

export async function getSpreadsheetReaction(tableData, selectedCell) {
  if (!tableData || tableData.trim().length < 5) {
    throw new Error("Invalid parameters");
  }

  const response = await fetch(SPREADSHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableData, selectedCell }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Backend request failed: ${response.status} - ${errorData.error || "Unknown error"}`);
  }

  const data = await response.json();
  return data.reply || "";
}

export async function getCellSuggestion(tableData, cellRef, currentValue) {
  try {
    const response = await fetch(CELL_SUGGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableData, cellRef, currentValue }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.suggestion || null;
  } catch (error) {
    console.error("Cell suggestion request failed:", error);
    return null;
  }
}

export async function getTextSuggestion(userText) {
  if (userText.length < 10) {
    return null;
  }

  try {
    const response = await fetch(SUGGESTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: userText
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.suggestion || null;
  } catch (error) {
    console.error("Suggestion request failed:", error);
    return null;
  }
}

export async function getDashboardReaction(tableData, dashboardConfig) {
  if (!tableData && !dashboardConfig) {
    throw new Error("Invalid parameters");
  }

  const response = await fetch(DASHBOARD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableData, dashboardConfig }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Backend request failed: ${response.status} - ${errorData.error || "Unknown error"}`);
  }

  const data = await response.json();
  return data.reply || "";
}
