const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").trim();
const API_ENABLED = Boolean(API_BASE);

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function bootstrapWordAudio(words) {
  if (!API_ENABLED) return {};
  try {
    const response = await fetch(`${API_BASE}/api/activation/bootstrap-word-audio/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words })
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data?.detail || "Failed to bootstrap word audio.");
    return data.word_audio || {};
  } catch {
    return {};
  }
}

export async function generateSentence(words) {
  if (!API_ENABLED) return `Please use these words in a sentence: ${words.join(", ")}.`;
  try {
    const response = await fetch(`${API_BASE}/api/activation/generate-sentence/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words })
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data?.detail || "Failed to generate sentence.");
    return data.generated_sentence;
  } catch {
    return `Please use these words in a sentence: ${words.join(", ")}.`;
  }
}

export async function generateSentenceAudio(sentence) {
  if (!API_ENABLED) return null;
  try {
    const response = await fetch(`${API_BASE}/api/activation/generate-sentence-audio/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence })
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data?.detail || "Failed to generate sentence audio.");
    return data.audio_url || null;
  } catch {
    return null;
  }
}

export async function evaluatePronunciation(audioBlob, expectedText, mode) {
  if (!API_ENABLED) {
    return {
      ok: false,
      error: "Pronunciation API is not configured. Set VITE_BACKEND_URL."
    };
  }
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("expected_text", expectedText);
    formData.append("mode", mode);

    const response = await fetch(`${API_BASE}/api/activation/evaluate-pronunciation/`, {
      method: "POST",
      body: formData
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data?.detail || "Failed to evaluate pronunciation.");
    const accuracyFromProxy = Number(data?.accuracy);
    const accuracyFromSpeechace = Number(data?.text_score?.speechace_score?.pronunciation);
    const accuracy = Number.isFinite(accuracyFromProxy)
      ? accuracyFromProxy
      : Number.isFinite(accuracyFromSpeechace)
        ? accuracyFromSpeechace
        : NaN;

    if (!Number.isFinite(accuracy)) {
      throw new Error("Pronunciation score missing in API response.");
    }

    return { ok: true, accuracy };
  } catch {
    return {
      ok: false,
      error: "Pronunciation service unavailable. Check backend and SpeechAce credentials."
    };
  }
}

export async function fetchSessionAnalysis(statsPayload) {
  if (!API_ENABLED) return "";
  try {
    const response = await fetch(`${API_BASE}/api/activation/session-analysis/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsPayload)
    });
    const data = await safeJson(response);
    if (!response.ok) return "";
    return data.analysis || "";
  } catch {
    return "";
  }
}

export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  if (!API_BASE) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}
