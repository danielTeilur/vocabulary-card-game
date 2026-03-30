import { useEffect, useState } from "react";
import { getGameVocabulary } from "../../services/chatbotApi";

const STAGE_LABELS = { 1: "Load", 2: "Build", 3: "Perform" };

/**
 * Shown before the game board. Fetches the student's active loops from the
 * chatbot backend and lets them pick which vocabulary set to practice with.
 *
 * Props:
 *   token      {string}   JWT bearer token read from the URL
 *   onSelect   {function} called with the normalized wordBank array once the
 *                         student picks a loop
 */
export default function LoopSelector({ token, onSelect }) {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No se encontró un token de acceso. Accede al juego desde la plataforma EnglishCode.");
      setLoading(false);
      return;
    }

    getGameVocabulary(token).then((data) => {
      setLoading(false);
      if (!data || !Array.isArray(data.loops)) {
        setError("No se pudo cargar tu vocabulario. Verifica tu sesión e intenta de nuevo.");
        return;
      }
      const activeLoops = data.loops.filter((l) => Array.isArray(l.vocabulary) && l.vocabulary.length > 0);
      if (activeLoops.length === 0) {
        setError("No tienes learning loops activos con vocabulario disponible.");
        return;
      }
      setLoops(activeLoops);
      if (activeLoops.length === 1) {
        handleSelect(activeLoops[0]);
      }
    });
  }, [token]);

  function handleSelect(loop) {
    const normalized = loop.vocabulary.map((item) => ({
      ...item,
      level: item.level ?? 1,
      definition: item.definition ?? null,
      definition_translation: item.definition_translation ?? null,
    }));
    onSelect(normalized);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Cargando tu vocabulario…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-red-800 rounded-xl p-8 max-w-md w-full text-center">
          <p className="text-red-400 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-white text-2xl font-bold text-center mb-2">
          Vocabulary Card Game
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          ¿Con qué vocabulario quieres practicar hoy?
        </p>

        <div className="flex flex-col gap-3">
          {loops.map((loop) => (
            <button
              key={loop.learning_loop_id}
              onClick={() => handleSelect(loop)}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl p-5 text-left transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                    {loop.topic}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {loop.vocabulary.length} palabras · Stage {loop.stage} — {STAGE_LABELS[loop.stage] ?? ""}
                  </p>
                </div>
                <span className="text-gray-600 group-hover:text-blue-400 transition-colors text-lg mt-0.5">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
