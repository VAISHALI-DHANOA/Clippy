const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || (isLocalHost ? "http://localhost:3003" : "")).replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function getAIReaction(userText, options = {}) {
  if (userText.length < 20) {
    throw new Error("Invalid parameters");
  }

  // Call our backend server instead of Anthropic directly
  const response = await fetch(apiUrl("/api/clippy-reaction"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: userText,
      ...options,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Backend request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.reply || "";
}

export async function getAIChat(documentText, userMessage, options = {}) {
  try {
    const response = await fetch(apiUrl("/api/clippy-chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: documentText, message: userMessage, ...options }),
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

  const response = await fetch(apiUrl("/api/clippy-spreadsheet"), {
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
    const response = await fetch(apiUrl("/api/clippy-cell-suggest"), {
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

export async function getTextSuggestion(userText, previousSuggestion = "", options = {}) {
  if (userText.length < 10) {
    return null;
  }

  try {
    const response = await fetch(apiUrl("/api/clippy-suggestion"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: userText,
        previousSuggestion,
        ...options,
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

  const response = await fetch(apiUrl("/api/clippy-dashboard"), {
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
