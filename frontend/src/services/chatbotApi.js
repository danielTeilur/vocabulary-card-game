const CHATBOT_BASE = (import.meta.env.VITE_CHATBOT_BACKEND_URL || "").trim();

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * Fetches the student's active learning loops with their vocabulary
 * from the EnglishCode chatbot backend.
 *
 * @param {string} token  - JWT bearer token for the authenticated student
 * @param {number|null} learningLoopId - optional, filter to a single loop
 * @returns {{ loops: Array }|null} - null on error
 */
/**
 * DEV ONLY — exchanges an email for a JWT access token via the chatbot backend
 * dev endpoint. Requires VITE_DEV_API_KEY to be set.
 *
 * @param {string} email
 * @returns {string|null} access token or null on failure
 */
export async function getTokenByEmail(email) {
  if (!CHATBOT_BASE) return null;
  const apiKey = import.meta.env.VITE_DEV_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${CHATBOT_BASE}/api/dev/get-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return null;
    const data = await safeJson(response);
    return data.access || null;
  } catch {
    return null;
  }
}

export async function getGameVocabulary(token, learningLoopId = null) {
  if (!CHATBOT_BASE) return null;
  if (!token) return null;

  const url = new URL(`${CHATBOT_BASE}/api/game/vocabulary/`);
  if (learningLoopId !== null) {
    url.searchParams.set("learning_loop_id", learningLoopId);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return response.status === 401 ? { error: "unauthorized" } : null;
    }
    const data = await safeJson(response);
    return data;
  } catch {
    return null;
  }
}
