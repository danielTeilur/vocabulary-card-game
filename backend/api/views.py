import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .services import (
    analyze_session as analyze_session_service,
    bootstrap_word_audio as bootstrap_word_audio_service,
    evaluate_pronunciation as speechace_evaluate_pronunciation,
    generate_fallback_sentence,
    generate_sentence_audio as tts_sentence_audio,
    generate_sentence_from_openai,
)


def _json_body(request):
    try:
        return json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return {}


@csrf_exempt
@require_POST
def bootstrap_word_audio(request):
    payload = _json_body(request)
    words = payload.get("words") or []
    if not isinstance(words, list):
        return JsonResponse({"detail": "words must be a list"}, status=400)

    audio_map = bootstrap_word_audio_service(words)
    return JsonResponse({"word_audio": audio_map})


@csrf_exempt
@require_POST
def generate_sentence(request):
    payload = _json_body(request)
    words = payload.get("words") or []
    if not isinstance(words, list) or not words:
        return JsonResponse({"detail": "words must be a non-empty list"}, status=400)

    normalized_words = [str(w).strip() for w in words if str(w).strip()]
    ok, sentence, error = generate_sentence_from_openai(normalized_words)
    if ok:
        return JsonResponse({"generated_sentence": sentence, "source": "openai"})

    # Graceful fallback keeps gameplay working if OpenAI is down/quota-limited.
    fallback_sentence = generate_fallback_sentence(normalized_words)
    return JsonResponse({"generated_sentence": fallback_sentence, "source": "fallback", "warning": error})


@csrf_exempt
@require_POST
def generate_sentence_audio(request):
    payload = _json_body(request)
    sentence = str(payload.get("sentence", "")).strip()
    if not sentence:
        return JsonResponse({"detail": "sentence is required"}, status=400)

    ok, audio_url, error = tts_sentence_audio(sentence)
    if not ok:
        return JsonResponse({"detail": error}, status=502)
    return JsonResponse({"audio_url": audio_url})


@csrf_exempt
@require_POST
def session_analysis(request):
    payload = _json_body(request)
    word_stats = payload.get("word_stats")
    if not isinstance(word_stats, list):
        return JsonResponse({"detail": "word_stats must be a list"}, status=400)

    ok, text, error = analyze_session_service(payload)
    if not ok:
        return JsonResponse({"detail": error}, status=502)
    return JsonResponse({"analysis": text})


@csrf_exempt
@require_POST
def evaluate_pronunciation(request):
    audio = request.FILES.get("audio")
    expected_text = str(request.POST.get("expected_text", "")).strip()
    mode = str(request.POST.get("mode", "word")).strip()

    if not audio:
        return JsonResponse({"detail": "audio file is required"}, status=400)
    if not expected_text:
        return JsonResponse({"detail": "expected_text is required"}, status=400)

    ok, accuracy, raw = speechace_evaluate_pronunciation(audio, expected_text)
    if not ok:
        return JsonResponse(raw, status=502)

    response = {
        "mode": mode,
        "expected_text": expected_text,
        "accuracy": accuracy if accuracy is not None else 0,
        "text_score": raw.get("text_score", {}),
    }
    return JsonResponse(response)
