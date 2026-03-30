from django.urls import path

from . import views

urlpatterns = [
    path("activation/bootstrap-word-audio/", views.bootstrap_word_audio, name="bootstrap-word-audio"),
    path("activation/generate-sentence/", views.generate_sentence, name="generate-sentence"),
    path("activation/generate-sentence-audio/", views.generate_sentence_audio, name="generate-sentence-audio"),
    path("activation/evaluate-pronunciation/", views.evaluate_pronunciation, name="evaluate-pronunciation"),
]
