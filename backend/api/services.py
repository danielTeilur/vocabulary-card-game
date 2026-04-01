import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from django.conf import settings


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
SPEECHACE_API_KEY = os.getenv("SPEECHACE_API_KEY", "")
SPEECHACE_USER_ID = os.getenv("SPEECHACE_USER_ID", "")
SPEECHACE_DIALECT = os.getenv("SPEECHACE_DIALECT", "en-us")


def _slug(text):
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "item"


def _media_dir(*parts):
    target = Path(settings.MEDIA_ROOT).joinpath(*parts)
    target.mkdir(parents=True, exist_ok=True)
    return target


def _public_media_path(path: Path):
    rel = path.relative_to(settings.MEDIA_ROOT).as_posix()
    return f"{settings.MEDIA_URL}{rel}"


def elevenlabs_tts_to_file(text, out_path: Path):
    if not ELEVENLABS_API_KEY:
        return False, "ELEVENLABS_API_KEY missing"

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.35, "similarity_boost": 0.75},
    }
    response = requests.post(url, headers=headers, json=payload, timeout=45)
    if response.status_code >= 400:
        return False, f"ElevenLabs error {response.status_code}: {response.text[:180]}"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(response.content)
    return True, ""


def _generate_word_audio(token, word_audio_dir):
    """Generate audio for a single word and return (token, path_or_none)."""
    file_path = word_audio_dir / f"{_slug(token)}.mp3"
    if not file_path.exists() and ELEVENLABS_API_KEY:
        elevenlabs_tts_to_file(token, file_path)
    return token, file_path if file_path.exists() else None


def bootstrap_word_audio(words, max_workers=8):
    word_audio_dir = _media_dir("audio", "words")
    tokens = [str(w).strip() for w in words if str(w).strip()]

    output = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(_generate_word_audio, token, word_audio_dir): token for token in tokens}
        for future in as_completed(futures):
            token, file_path = future.result()
            if file_path:
                output[token] = _public_media_path(file_path)

    return output


def generate_sentence_from_openai(words):
    if not OPENAI_API_KEY:
        return False, "", "OPENAI_API_KEY missing"

    prompt = (
        'Provide a JSON object with one key named "generated_sentence". '
        "That sentence must include all of these words exactly as written: "
        f"{', '.join(words)}. Return only JSON."
    )
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENAI_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=45)
    if response.status_code >= 400:
        return False, "", f"OpenAI error {response.status_code}: {response.text[:180]}"

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    try:
        parsed = json.loads(content)
        sentence = str(parsed.get("generated_sentence", "")).strip()
    except json.JSONDecodeError:
        sentence = ""
    if not sentence:
        return False, "", "OpenAI response missing generated_sentence"
    return True, sentence, ""


def generate_fallback_sentence(words):
    clean_words = [str(w).strip() for w in words if str(w).strip()]
    if not clean_words:
        return "The security team reviewed the latest incident."
    if len(clean_words) == 1:
        return f"The security team investigated {clean_words[0]} during the incident response."
    if len(clean_words) == 2:
        return f"During the incident response, the team analyzed {clean_words[0]} and {clean_words[1]} to prevent future attacks."

    head = ", ".join(clean_words[:-1])
    tail = clean_words[-1]
    return f"During the incident response, the team analyzed {head}, and {tail} to strengthen security."


def generate_sentence_audio(sentence):
    sentence_dir = _media_dir("audio", "sentences")
    file_path = sentence_dir / f"{_slug(sentence)[:80]}.mp3"
    if not file_path.exists():
        ok, error = elevenlabs_tts_to_file(sentence, file_path)
        if not ok:
            return False, "", error
    return True, _public_media_path(file_path), ""


def analyze_session(stats: dict) -> tuple:
    if not OPENAI_API_KEY:
        return False, "", "OPENAI_API_KEY missing"

    word_stats = stats.get("word_stats", [])
    dominated = [w["word"] for w in word_stats if w.get("dominated")]
    difficult = [w["word"] for w in word_stats if not w.get("dominated") and w.get("attempts_count", 0) > 0]
    levels_cleared = stats.get("levels_cleared", 0)
    result = stats.get("result", "lose")
    sentences_succeeded = stats.get("total_sentences_succeeded", 0)

    if not word_stats:
        return True, "¡Completa pronunciaciones para obtener tu análisis personalizado!", ""

    parts = [
        "You are an English language coach for Spanish speakers.",
        f"A student just finished a vocabulary pronunciation game and {'won' if result == 'win' else 'lost'}.",
        f"Levels cleared: {levels_cleared}.",
    ]
    if dominated:
        parts.append(f"Words pronounced successfully: {', '.join(dominated)}.")
    if difficult:
        parts.append(f"Words that need more practice: {', '.join(difficult)}.")
    if sentences_succeeded:
        parts.append(f"Successfully activated {sentences_succeeded} sentence enhancement(s).")
    parts.append(
        "Write 2-3 sentences of encouraging, personalized feedback in Spanish. "
        "Mention specific words they mastered and specific words to keep practicing. "
        "Be brief and motivating. Return only the feedback text, no JSON."
    )

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": "You are a language learning coach. Return only the feedback text in Spanish."},
            {"role": "user", "content": " ".join(parts)},
        ],
        "temperature": 0.7,
        "max_tokens": 200,
    }
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30,
    )
    if response.status_code >= 400:
        return False, "", f"OpenAI error {response.status_code}: {response.text[:180]}"

    data = response.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not text:
        return False, "", "OpenAI response empty"
    return True, text, ""


def evaluate_pronunciation(audio_file, expected_text):
    if not SPEECHACE_API_KEY:
        return False, None, {"detail": "SPEECHACE_API_KEY missing"}

    params = {
        "key": SPEECHACE_API_KEY,
        "dialect": SPEECHACE_DIALECT,
        "user_id": SPEECHACE_USER_ID,
    }
    files = {"user_audio_file": ("recording.webm", audio_file, "audio/webm")}
    data = {"text": expected_text}

    response = requests.post(
        "https://api.speechace.co/api/scoring/text/v9/json",
        params=params,
        files=files,
        data=data,
        timeout=60,
    )
    if response.status_code >= 400:
        return False, None, {"detail": f"SpeechAce error {response.status_code}", "raw": response.text[:400]}

    payload = response.json()
    accuracy = None

    score = payload.get("text_score", {}).get("speechace_score", {}).get("pronunciation")
    if isinstance(score, (int, float)):
        accuracy = float(score)
    else:
        words = payload.get("text_score", {}).get("word_score_list", [])
        values = [w.get("quality_score", 0) for w in words if isinstance(w.get("quality_score"), (int, float))]
        if values:
            accuracy = float(sum(values) / len(values))

    return True, accuracy, payload
