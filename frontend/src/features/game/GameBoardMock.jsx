import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  bootstrapWordAudio,
  evaluatePronunciation,
  fetchSessionAnalysis,
  generateSentence,
  generateSentenceAudio,
  resolveMediaUrl
} from "../../services/activationApi";

const HAND_SIZE = 7;
const MAX_HANDS = 5;
const CAMPAIGN_LEVELS = 3;
const SCORE_BASE = 120;
const SCORE_GROWTH_RATE = 0.12;
const TOOLTIP_WIDTH = 208;
const TOOLTIP_PAD = 14;
const ACCURACY_GOAL = 70;
const MAX_ATTEMPTS = 2;
const TUTORIAL_IMAGE_BASE = "/tutorial";
const TUTORIAL_SLIDES = [
  {
    text: "Bienvenido a este tutorial para esta nueva experiencia que tenemos para ti. Este juego fue diseñado para incrementar tus habilidades de pronunciación y entendimiento de vocabulario específico para tus objetivos. ¡Empecemos!"
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-01.png`,
    text: "Lo que estás viendo en pantalla es el tablero de juego, su diseño está pensado para ser fácil de entender y que sea amigable con pantallas de todo tamaño, por lo que nos encantaría que lo probaras en computadoras, laptops y hasta dispositivos móviles y nos dieras tus observaciones si sientes que algo debería mejorar. En el transcurso de este tutorial veras rectángulos rojos que resaltan las diferentes funciones y características de este juego. En está primer vista tenemos el mazo de cartas aquí que al tocarlo podrás ver las cartas que quedan por jugar, el puntaje actual y la información de la partida que te dice cuantas manos te quedan por jugar, el puntaje objetivo y el nivel o etapa en la que estás."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-02.png`,
    text: "Aquí tenemos el espacio de juego donde van las diferentes cartas que vas a jugar."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-03.png`,
    text: "Aquí están los botones de acción, El botón azul que dice “Play Cards” sirve para poner cartas de tu mano al tablero, el botón verde que dice “Score Hand” sirve para acabar tu turno y que el juego cuente los puntos que se están jugando en el tablero. El botón amarillo que dice “Enhance” sirve para potenciar las cartas que están en el tablero y hacer que sumen aún más puntos. Hablaré más de ese botón pronto."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-04.png`,
    text: "Estás son las cartas en tu mano que puedes jugar en el turno actual. Si quieres saber más acerca de la carta, mantén oprimido sobre ella para más información."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-05.png`,
    text: "Como puedes ver tienen 3 elementos, Nivel en la parte superior izquierda, la cantidad de puntos que va a darte en su estado actual en la parte superior derecha y la palabra en el centro de la carta."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-06.png`,
    text: "Cuando seleccionas cartas en tu mano, estás se elevan ligeramente para indicar que las has seleccionado y están listas para ir al tablero cuando des click a “Play Cards”"
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-07.png`,
    text: "Como puedes ver cada una va a su fila correspondiente a su nivel."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-08.png`,
    text: "Ahora vamos a jugar 2 cartas más de nivel 1."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-09.png`,
    text: "Estás cartas se juntan con las que ya estaban en ese nivel en el área de juego. Si jugamos todas las cartas que están actualmente en el tablero tal como están dando al botón “Score Hand” nos daría un total de 16 puntos lo cual no es mucho para alcanzar nuestra meta de 120 puntos. Por lo tanto hay que mejorarlas para obtener más puntaje."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-10.png`,
    text: "El proceso de mejora debe hacerse por cada fila, no se pueden mezclar cartas de otras filas en el proceso de mejora. Aquí puedes ver que seleccionamos dentro de la fila las 3 cartas de nivel 1 que teníamos en el tablero y al hacer eso se habilitó el botón amarillo de “Enhance”."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-11.png`,
    text: "Al dar click en el botón de “Enhance” aparece una pequeña opción de querer mejorar las cartas con mejora por palabra con el botón “Word(s)” y mejora por enunciado con el botón “Sentence”. Iniciemos mejorando por palabra dando click en “Word(s)”"
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-12.png`,
    text: "Esta es la pantalla de mejora de palabras, como puedes ver tenemos todas las palabras que seleccionamos del tablero aquí. Cada palabra tiene 2 botónes, el que tiene el símbolo de reproducir o “Play” te da el audio de la palabra para que tengas referencia de su pronunciación. El botón con el micrófono es para que te grabes a ti mismo pronunciando la palabra."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-13.png`,
    text: "Aquí ves que tuve éxito pronunciando la palabra “Monitor” pero no tuve éxito pronunciando “Incident”, al pronunciar una palabra correctamente está queda lista para mejorar, si pronuncias una palabra incorrectamente tienes otro intento para lograrlo, si no lo logras en 2 intentos esta palabra queda bloqueada, pero no te preocupes continua con las otras para seguir obteniendo más puntos."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-14.png`,
    text: "Aquí puedes ver que mejoré las 3 palabras con mejora por palabra porque las 3 tienen un contorno brillante azul, pero ¿por qué parar ahí? Vamos a mejorarlas aún más."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-15.png`,
    text: "Aquí seleccioné las mismas palabras de nuevo y me permite mejorarlas a través de un enunciado."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-16.png`,
    text: "Aquí el juego creará una frase con todas las palabras involucradas en la mejora. Igual que cuando mejoramos por palabras puedes dar clic al botón de reproducción o “Play” para escuchar un audio referencia de la frase y el botón de micrófono para empezar a grabar. Recuerda dar click de nuevo en el botón de micrófono cuando acabes de grabar para registrar la grabación."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-17.png`,
    text: "Habiendo pronunciado la frase con éxito las palabras tienen un contorno dorado por lo que ya están en su mejora máxima y te podrás dar cuenta que ya no valen 2.5 puntos cada una pero 10 puntos cada una."
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/slide-18.png`,
    text: "Al dar click en “Score Hand” vemos que tuvimos un total de 39 puntos, mucho más que los 16 que hubiéramos obtenido sin activar las cartas."
  },
  {
    text: "Eso es todo por ahora, espero disfrutes de esta experiencia. Recuerda si tienes dudas o un comentario de algo que haría este juego más entretenido por favor haznos saber si con gusto evaluamos tu sugerencia. ¡Feliz día! ¡Y mucho éxito!"
  }
];
const INITIAL_SESSION_STATS = {
  wordStats: {},
  sentenceAttempts: [],
  handScores: [],
  totalWordsAttempted: 0,
  totalWordsSucceeded: 0,
  totalSentencesAttempted: 0,
  totalSentencesSucceeded: 0,
};

let deckInstance = 0;

const shuffle = (cards) => {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDeck = (wordBank) => {
  deckInstance += 1;
  return shuffle(
    wordBank.map((entry, idx) => ({
      ...entry,
      id: `${deckInstance}-${entry.word}-${idx}`
    }))
  );
};

const points = (level) => (level === 1 ? 5 : level === 2 ? 7 : 10);
const cardScoreFromActivation = (card) => {
  const base = points(card.level);
  const a = card.activation || {};
  if (a.wordCommitted && a.sentenceCommitted) return base * 2;
  if (a.sentenceCommitted) return base * 1.5;
  if (a.wordCommitted) return base;
  return base * 0.5;
};
const formatCardPoints = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const requiredScore = (stage) => Math.round(SCORE_BASE * (1 + SCORE_GROWTH_RATE) ** (stage - 1));
const clampX = (x) => Math.min(window.innerWidth - TOOLTIP_WIDTH / 2 - TOOLTIP_PAD, Math.max(TOOLTIP_WIDTH / 2 + TOOLTIP_PAD, x));

const newActivation = () => ({
  wordAttempts: 0,
  sentenceAttempts: 0,
  wordBlocked: false,
  sentenceBlocked: false,
  wordPending: false,
  sentencePending: false,
  wordCommitted: false,
  sentenceCommitted: false,
  lastWordAccuracy: null,
  lastSentenceAccuracy: null
});

const toBoardCard = (card) => ({ ...card, activation: card.activation ? { ...card.activation } : newActivation() });
const boardCards = (rows) => [...rows[1], ...rows[2], ...rows[3]];

const boardClass = (card) => {
  const a = card.activation;
  if (a.wordCommitted && a.sentenceCommitted) return "enhanced-double";
  if (a.sentenceCommitted) return "enhanced-sentence";
  if (a.wordCommitted) return "enhanced-word";
  if (a.wordBlocked || a.sentenceBlocked) return "enhanced-blocked";
  return "";
};

function GameBoardMock({ wordBank }) {
  const firstDeck = buildDeck(wordBank);
  const [handCards, setHandCards] = useState(firstDeck.slice(0, HAND_SIZE));
  const [deckCards, setDeckCards] = useState(firstDeck.slice(HAND_SIZE));
  const [boardRows, setBoardRows] = useState({ 1: [], 2: [], 3: [] });
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedBoardIds, setSelectedBoardIds] = useState([]);
  const [enhanceSelectionIds, setEnhanceSelectionIds] = useState([]);

  const [deckOverlayOpen, setDeckOverlayOpen] = useState(false);
  const [enhanceMenuOpen, setEnhanceMenuOpen] = useState(false);
  const [enhanceOverlay, setEnhanceOverlay] = useState(null);
  const [wordAudioMap, setWordAudioMap] = useState({});
  const [sentenceData, setSentenceData] = useState({ text: "", audioUrl: "", loading: false, error: "" });
  const [sentenceFeedback, setSentenceFeedback] = useState("");
  const [enhanceError, setEnhanceError] = useState("");
  const [recordingState, setRecordingState] = useState({ type: null, cardId: null });

  const [stageNumber, setStageNumber] = useState(1);
  const [isEndless, setIsEndless] = useState(false);
  const [levelsCleared, setLevelsCleared] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [handsLeft, setHandsLeft] = useState(MAX_HANDS);
  const [resultState, setResultState] = useState(null);

  const [tooltipCardId, setTooltipCardId] = useState(null);
  const [tooltipSlide, setTooltipSlide] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [startupOverlayMode, setStartupOverlayMode] = useState("start");
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [tutorialImageErrors, setTutorialImageErrors] = useState({});

  const [sessionStats, setSessionStats] = useState(INITIAL_SESSION_STATS);
  const [sessionAnalysis, setSessionAnalysis] = useState({ text: "", loading: false });
  const sessionStatsRef = useRef(INITIAL_SESSION_STATS);
  const levelsRef = useRef(0);

  const [displayScore, setDisplayScore] = useState(0);
  const scoreAnimRef = useRef(null);
  const prevScoreRef = useRef(0);

  const holdTimerRef = useRef(null);
  const holdTriggeredRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const mediaContextRef = useRef(null);
  const handTrackRef = useRef(null);
  const sentenceCacheRef = useRef({});
  const [handScrollHint, setHandScrollHint] = useState("none");

  const sessionSummary = useMemo(() => {
    const entries = Object.entries(sessionStats.wordStats);
    const dominatedWords = entries.filter(([, d]) => d.dominated).map(([w]) => w);
    const difficultWords = entries.filter(([, d]) => !d.dominated).map(([w]) => w);
    const bestHand = sessionStats.handScores.length > 0 ? Math.max(...sessionStats.handScores) : 0;
    return { dominatedWords, difficultWords, bestHand, totalAttempted: entries.length };
  }, [sessionStats]);

  const deckTotal = wordBank ? wordBank.length : 0;
  const targetScore = requiredScore(stageNumber);
  const flatBoardCards = useMemo(() => boardCards(boardRows), [boardRows]);
  const selectedBoardCards = useMemo(() => flatBoardCards.filter((card) => selectedBoardIds.includes(card.id)), [flatBoardCards, selectedBoardIds]);
  const selectedRows = [...new Set(selectedBoardCards.map((card) => card.level))];
  const sameRow = selectedRows.length <= 1;
  const hasBlockedSelection = selectedBoardCards.some((card) => {
    const a = card.activation || {};
    return Boolean(a.wordBlocked || a.sentenceBlocked);
  });
  const canEnhance = selectedBoardCards.length > 0 && sameRow && !hasBlockedSelection;
  const canWordEnhanceSelection =
    canEnhance &&
    selectedBoardCards.every((card) => {
      const a = card.activation || {};
      return !a.wordCommitted && !a.wordPending && !a.wordBlocked;
    });
  const canSentenceEnhanceSelection =
    canEnhance &&
    selectedBoardCards.length >= 3 &&
    selectedBoardCards.every((card) => {
      const a = card.activation || {};
      return !a.sentenceCommitted && !a.sentencePending && !a.sentenceBlocked;
    });
  const disabledReason = selectedBoardCards.length === 0
    ? "Select board cards first."
    : !sameRow
      ? "Only words from the same row can be enhanced together."
      : hasBlockedSelection
        ? "Blocked cards cannot be enhanced."
        : "";
  const wordDisabledReason = !canEnhance
    ? disabledReason
    : canWordEnhanceSelection
      ? ""
      : "One or more selected cards already used or blocked Word enhancement.";
  const sentenceDisabledReason = !canEnhance
    ? disabledReason
    : selectedBoardCards.length < 3
      ? "Need at least 3 selected words in the same row."
      : canSentenceEnhanceSelection
        ? ""
        : "One or more selected cards already used or blocked Sentence enhancement.";
  const enhancementCards = useMemo(() => flatBoardCards.filter((card) => enhanceSelectionIds.includes(card.id)), [flatBoardCards, enhanceSelectionIds]);
  const sentenceOverlayBlocked = enhancementCards.some((card) => card.activation?.sentenceBlocked);
  const sentenceOverlayResolved = enhancementCards.some((card) => card.activation?.sentencePending || card.activation?.sentenceCommitted);
  const tooltipCard = useMemo(
    () => [...handCards, ...flatBoardCards].find((card) => card.id === tooltipCardId),
    [handCards, flatBoardCards, tooltipCardId]
  );
  const interactionLocked = Boolean(resultState || enhanceOverlay);

  useEffect(() => { sessionStatsRef.current = sessionStats; }, [sessionStats]);
  useEffect(() => { levelsRef.current = levelsCleared; }, [levelsCleared]);

  useEffect(() => {
    const start = prevScoreRef.current;
    const end = currentScore;
    prevScoreRef.current = end;
    if (start === end) return;
    if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    const duration = 520;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (progress < 1) scoreAnimRef.current = requestAnimationFrame(tick);
    };
    scoreAnimRef.current = requestAnimationFrame(tick);
    return () => { if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current); };
  }, [currentScore]);

  useEffect(() => {
    if (!resultState) return;
    const isTerminal = resultState === "game_over" || resultState === "endless_game_over" || resultState === "campaign_complete";
    if (!isTerminal) return;
    const stats = sessionStatsRef.current;
    if (Object.keys(stats.wordStats).length === 0) return;
    const levels = levelsRef.current;
    setSessionAnalysis({ text: "", loading: true });
    fetchSessionAnalysis({
      word_stats: Object.entries(stats.wordStats).map(([word, data]) => ({
        word,
        dominated: data.dominated,
        attempts_count: data.attempts.length,
        best_accuracy: data.bestAccuracy,
      })),
      levels_cleared: levels,
      result: resultState === "campaign_complete" ? "win" : "lose",
      total_sentences_succeeded: stats.totalSentencesSucceeded,
    })
      .then((text) => setSessionAnalysis({ text, loading: false }))
      .catch(() => setSessionAnalysis({ text: "", loading: false }));
  }, [resultState]);

  useEffect(() => {
    const words = [...new Set((wordBank || []).map((entry) => entry.word))];
    bootstrapWordAudio(words).then((map) => setWordAudioMap(map || {}));
  }, []);

  useEffect(() => {
    if (!canEnhance || interactionLocked) {
      setEnhanceMenuOpen(false);
    }
  }, [canEnhance, interactionLocked]);

  const updateHandScrollHint = () => {
    const track = handTrackRef.current;
    if (!track) {
      setHandScrollHint("none");
      return;
    }
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 2) {
      setHandScrollHint("none");
      return;
    }
    if (track.scrollLeft <= 2) {
      setHandScrollHint("right");
      return;
    }
    if (track.scrollLeft >= maxScroll - 2) {
      setHandScrollHint("left");
      return;
    }
    setHandScrollHint("none");
  };

  useEffect(() => {
    updateHandScrollHint();
    const onResize = () => updateHandScrollHint();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [handCards.length]);

  const speakFallback = (text) => {
    if (!window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playAudioUrl = async (pathOrUrl) => {
    if (!pathOrUrl) return;
    try {
      const audio = new Audio(resolveMediaUrl(pathOrUrl));
      await audio.play();
    } catch {
      // no-op
    }
  };

  const toggleHandSelection = (id) => setSelectedHandIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleBoardSelection = (id) => !interactionLocked && setSelectedBoardIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const updateBoardByIds = (ids, updater) => {
    const idSet = new Set(ids);
    setBoardRows((prev) => {
      const next = { 1: [], 2: [], 3: [] };
      [1, 2, 3].forEach((level) => {
        next[level] = prev[level].map((card) => (idSet.has(card.id) ? updater(card) : card));
      });
      return next;
    });
  };

  const clearPending = () => {
    setBoardRows((prev) => {
      const next = { 1: [], 2: [], 3: [] };
      [1, 2, 3].forEach((level) => {
        next[level] = prev[level].map((card) => ({ ...card, activation: { ...card.activation, wordPending: false, sentencePending: false } }));
      });
      return next;
    });
  };

  const commitPending = () => {
    setBoardRows((prev) => {
      const next = { 1: [], 2: [], 3: [] };
      [1, 2, 3].forEach((level) => {
        next[level] = prev[level].map((card) => ({
          ...card,
          activation: {
            ...card.activation,
            wordCommitted: card.activation.wordCommitted || card.activation.wordPending,
            sentenceCommitted: card.activation.sentenceCommitted || card.activation.sentencePending,
            wordPending: false,
            sentencePending: false
          }
        }));
      });
      return next;
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  const resetEnhanceUi = () => {
    setSelectedBoardIds([]);
    setEnhanceSelectionIds([]);
    setEnhanceMenuOpen(false);
    setEnhanceOverlay(null);
    setSentenceData({ text: "", audioUrl: "", loading: false, error: "" });
    setSentenceFeedback("");
    setEnhanceError("");
    setRecordingState({ type: null, cardId: null });
  };

  const prepareStage = (nextStage, endlessMode) => {
    const nextDeck = buildDeck(wordBank);
    setStageNumber(nextStage);
    setIsEndless(endlessMode);
    setCurrentScore(0);
    setHandsLeft(MAX_HANDS);
    setBoardRows({ 1: [], 2: [], 3: [] });
    setHandCards(nextDeck.slice(0, HAND_SIZE));
    setDeckCards(nextDeck.slice(HAND_SIZE));
    setSelectedHandIds([]);
    setDeckOverlayOpen(false);
    setResultState(null);
    resetEnhanceUi();
  };

  const handlePlayCards = () => {
    if (interactionLocked || selectedHandIds.length === 0) return;
    const ids = new Set(selectedHandIds);
    const toPlay = handCards.filter((card) => ids.has(card.id));
    if (toPlay.length === 0) return;
    setBoardRows((prev) => {
      const next = { 1: [...prev[1]], 2: [...prev[2]], 3: [...prev[3]] };
      toPlay.forEach((card) => next[card.level].push(toBoardCard(card)));
      return next;
    });
    setHandCards((prev) => prev.filter((card) => !ids.has(card.id)));
    setSelectedHandIds([]);
    setTooltipCardId(null);
  };

  const handleScoreHand = () => {
    if (interactionLocked) return;
    const cards = boardCards(boardRows);
    if (cards.length === 0) return;
    const handScore = Math.round(cards.reduce((total, card) => total + cardScoreFromActivation(card), 0));
    const nextScore = currentScore + handScore;
    const nextHands = Math.max(handsLeft - 1, 0);
    const needed = Math.max(0, HAND_SIZE - handCards.length);
    const drawCount = Math.min(needed, deckCards.length);
    const drawn = deckCards.slice(0, drawCount);

    setCurrentScore(nextScore);
    setHandsLeft(nextHands);
    setBoardRows({ 1: [], 2: [], 3: [] });
    setHandCards((prev) => [...prev, ...drawn]);
    setDeckCards((prev) => prev.slice(drawCount));
    setSelectedHandIds([]);
    setDeckOverlayOpen(false);
    resetEnhanceUi();
    setSessionStats((prev) => ({ ...prev, handScores: [...prev.handScores, handScore] }));

    if (nextScore >= targetScore) {
      setLevelsCleared((prev) => prev + 1);
      setResultState(!isEndless && stageNumber >= CAMPAIGN_LEVELS ? "campaign_complete" : "success");
      return;
    }
    if (nextHands === 0) setResultState(isEndless ? "endless_game_over" : "game_over");
  };

  const startRecording = async (context) => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaChunksRef.current = [];
      mediaContextRef.current = context;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        setRecordingState({ type: null, cardId: null });
        const ctx = mediaContextRef.current;
        mediaContextRef.current = null;
        if (!ctx) return;

        const result = await evaluatePronunciation(blob, ctx.expectedText, ctx.type);
        if (!result.ok) {
          const message = result.error || "Pronunciation service unavailable.";
          setEnhanceError(message);
          if (ctx.type === "sentence") {
            setSentenceFeedback(message);
          }
          return;
        }
        const accuracy = Number(result.accuracy || 0);
        setEnhanceError("");

        if (ctx.type === "word") {
          const succeeded = accuracy >= ACCURACY_GOAL;
          const word = ctx.expectedText;
          setSessionStats((prev) => {
            const existing = prev.wordStats[word] || { attempts: [], bestAccuracy: 0, dominated: false };
            return {
              ...prev,
              wordStats: {
                ...prev.wordStats,
                [word]: {
                  attempts: [...existing.attempts, accuracy],
                  bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
                  dominated: existing.dominated || succeeded,
                },
              },
              totalWordsAttempted: prev.totalWordsAttempted + 1,
              totalWordsSucceeded: prev.totalWordsSucceeded + (succeeded ? 1 : 0),
            };
          });
          updateBoardByIds([ctx.cardId], (card) => {
            const a = { ...card.activation };
            if (a.wordBlocked || a.wordCommitted || a.wordPending) return card;
            if (accuracy >= ACCURACY_GOAL) {
              a.wordPending = true;
              a.lastWordAccuracy = accuracy;
            } else {
              a.wordAttempts += 1;
              a.lastWordAccuracy = accuracy;
              if (a.wordAttempts >= MAX_ATTEMPTS) a.wordBlocked = true;
            }
            return { ...card, activation: a };
          });
        }
        if (ctx.type === "sentence") {
          const sentenceSucceeded = accuracy >= ACCURACY_GOAL;
          setSessionStats((prev) => ({
            ...prev,
            sentenceAttempts: [...prev.sentenceAttempts, { accuracy, success: sentenceSucceeded }],
            totalSentencesAttempted: prev.totalSentencesAttempted + 1,
            totalSentencesSucceeded: prev.totalSentencesSucceeded + (sentenceSucceeded ? 1 : 0),
          }));
          const willBlockNow =
            accuracy < ACCURACY_GOAL &&
            enhancementCards.some((card) => {
              const a = card.activation || {};
              if (a.sentenceBlocked || a.sentenceCommitted || a.sentencePending) return false;
              return a.sentenceAttempts + 1 >= MAX_ATTEMPTS;
            });

          updateBoardByIds(ctx.cardIds, (card) => {
            const a = { ...card.activation };
            if (a.sentenceBlocked || a.sentenceCommitted || a.sentencePending) return card;
            if (accuracy >= ACCURACY_GOAL) {
              a.sentencePending = true;
              a.lastSentenceAccuracy = accuracy;
            } else {
              a.sentenceAttempts += 1;
              a.lastSentenceAccuracy = accuracy;
              if (a.sentenceAttempts >= MAX_ATTEMPTS) a.sentenceBlocked = true;
            }
            return { ...card, activation: a };
          });
          if (willBlockNow) {
            setSentenceFeedback("Sentence Blocked, Unable to enhance");
          } else {
            setSentenceFeedback(
              accuracy >= ACCURACY_GOAL
                ? `Great! You reached ${accuracy}% accuracy.`
                : `You reached ${accuracy}% accuracy! Try again! You need at least ${ACCURACY_GOAL}%.`
            );
          }
        }
      };
      recorder.start();
      setRecordingState({ type: context.type, cardId: context.cardId || null });
    } catch {
      // no-op
    }
  };

  const openWordsEnhance = () => {
    if (!canWordEnhanceSelection) return;
    setEnhanceSelectionIds(selectedBoardIds);
    setEnhanceMenuOpen(false);
    setEnhanceOverlay("words");
    setEnhanceError("");
  };

  const openSentenceEnhance = async () => {
    if (!canSentenceEnhanceSelection) return;
    const words = selectedBoardCards.map((card) => card.word);
    const cacheKey = [...words].sort().join("|");
    setEnhanceSelectionIds(selectedBoardIds);
    setEnhanceMenuOpen(false);
    setEnhanceOverlay("sentence");
    setSentenceFeedback("");
    setEnhanceError("");

    const cached = sentenceCacheRef.current[cacheKey];
    if (cached) {
      setSentenceData({ text: cached.text, audioUrl: cached.audioUrl, loading: false, error: "" });
      return;
    }

    setSentenceData({ text: "", audioUrl: "", loading: true, error: "" });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );
    try {
      const text = await Promise.race([generateSentence(words), timeout]);
      let audioUrl = "";
      let audioUnavailable = false;
      try {
        audioUrl = (await generateSentenceAudio(text)) || "";
        if (!audioUrl) audioUnavailable = true;
      } catch {
        audioUnavailable = true;
      }
      sentenceCacheRef.current[cacheKey] = { text, audioUrl };
      setSentenceData({ text, audioUrl, loading: false, error: "", audioUnavailable });
    } catch (err) {
      const msg = err?.message === "timeout"
        ? "La generación tardó demasiado. Presiona Go Back e inténtalo de nuevo."
        : "Could not generate sentence. Please try again.";
      setSentenceData({ text: "", audioUrl: "", loading: false, error: msg });
    }
  };

  const closeEnhanceOverlay = (finish) => {
    stopRecording();
    if (finish) commitPending();
    else clearPending();
    setEnhanceOverlay(null);
    setEnhanceMenuOpen(false);
    setEnhanceSelectionIds([]);
    setSentenceData({ text: "", audioUrl: "", loading: false, error: "" });
    setSentenceFeedback("");
    setEnhanceError("");
  };

  const clearHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdTriggeredRef.current = false;
  };

  const holdStart = (cardId, element) => {
    if (interactionLocked) return;
    clearHold();
    holdTimerRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      holdTriggeredRef.current = true;
      setTooltipCardId(cardId);
      setTooltipSlide(0);
      setTooltipPos({ x: clampX(rect.left + rect.width / 2), y: rect.top - 8 });
    }, 420);
  };

  const holdEndHand = (cardId) => {
    if (interactionLocked) return;
    if (!holdTriggeredRef.current) {
      toggleHandSelection(cardId);
      setTooltipCardId(null);
    }
    clearHold();
  };

  const holdEndBoard = (cardId) => {
    if (interactionLocked) return;
    if (!holdTriggeredRef.current) {
      toggleBoardSelection(cardId);
      setTooltipCardId(null);
    }
    clearHold();
  };

  const overlayTitle = resultState === "game_over" ? "Game Over" : resultState === "endless_game_over" ? "Endless Mode Over" : "Success!";
  const overlaySubtitle =
    resultState === "game_over"
      ? "You ran out of hands before reaching the target score."
      : resultState === "endless_game_over"
        ? `You beat ${levelsCleared} level${levelsCleared === 1 ? "" : "s"} in this run.`
        : `You reached the target score for level ${stageNumber}.`;

  const deckIntensity = Math.max(0, Math.min(1, deckCards.length / Math.max(1, deckTotal)));

  const goToTutorial = () => {
    setTutorialIndex(0);
    setStartupOverlayMode("tutorial");
  };

  const nextTutorialSlide = () => {
    if (tutorialIndex >= TUTORIAL_SLIDES.length - 1) {
      setStartupOverlayMode("closed");
      return;
    }
    setTutorialIndex((prev) => prev + 1);
  };

  const previousTutorialSlide = () => {
    setTutorialIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  if (!wordBank || wordBank.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-red-800 rounded-xl p-8 max-w-md w-full text-center">
          <p className="text-red-400 text-sm leading-relaxed">No hay vocabulario disponible para este loop. Contacta a tu instructor.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      <section className="portrait-lock">
        <div className="lock-card"><h1>Landscape Only</h1><p>Rotate your device to landscape mode to play.</p></div>
      </section>

      <section className="game-root px-3 py-3 sm:px-6 sm:py-5">
        <div className="mx-auto w-full max-w-[1280px] animate-rise game-layout">
          <div className="table-frame">
            <aside className="left-rail">
              <div className="deck-score-row">
                <button type="button" className={`deck-stack face-down ${deckCards.length === 0 ? "is-empty" : ""}`} onClick={() => setDeckOverlayOpen(true)} disabled={interactionLocked}>
                  <div style={{ opacity: deckIntensity > 0.75 ? 0.7 : 0.18 }} /><div style={{ opacity: deckIntensity > 0.5 ? 0.8 : 0.2 }} /><div style={{ opacity: deckIntensity > 0.25 ? 0.9 : 0.3 }} /><div style={{ opacity: deckIntensity > 0 ? 1 : 0.35 }} /><em className="deck-count">{deckCards.length}</em><span>Deck</span>
                </button>
                <div className="left-score-panel"><h3>Score</h3><p>{displayScore}</p></div>
              </div>
              <section className="match-panel"><h2>Match</h2><dl><div><dt>Hands Left</dt><dd>{handsLeft} / {MAX_HANDS}</dd></div><div><dt>Target Score</dt><dd>{targetScore}</dd></div><div><dt>Stage</dt><dd>{stageNumber}</dd></div></dl></section>
            </aside>

            <section className="board-core" aria-label="Main board">
              {[3, 2, 1].map((level) => (
                <div key={level} className={`board-row level-${level}`}>
                  <span>LEVEL {level}</span>
                  <div className="row-cards">
                    <AnimatePresence mode="popLayout">
                      {boardRows[level].map((card) => (
                        <motion.article
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.7, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.75, y: -14 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`board-card clickable ${boardClass(card)} ${selectedBoardIds.includes(card.id) ? "selected" : ""}`}
                          onPointerDown={(e) => holdStart(card.id, e.currentTarget)}
                          onPointerUp={() => holdEndBoard(card.id)}
                          onPointerCancel={clearHold}
                          onPointerLeave={clearHold}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <strong>{card.level}</strong><h4>{card.word}</h4><small className="card-points">{formatCardPoints(cardScoreFromActivation(card))} pts</small>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </section>

            <aside className="right-rail">
              <div className="right-actions">
                <button type="button" className="score-hand-btn" onClick={handleScoreHand} disabled={interactionLocked}>Score Hand</button>
                <button type="button" className="play-cards-btn" onClick={handlePlayCards} disabled={interactionLocked}>Play Cards</button>
                <div className="enhance-slot">
                  <button type="button" className="enhance-button" onClick={() => canEnhance && setEnhanceMenuOpen((p) => !p)} disabled={!canEnhance || interactionLocked} title={disabledReason}>Enhance</button>
                  {enhanceMenuOpen && (
                    <div className="enhance-tooltip" role="dialog" aria-label="Enhance menu">
                      <button type="button" onClick={openWordsEnhance} disabled={!canWordEnhanceSelection} title={wordDisabledReason}>Word(s)</button>
                      <button type="button" onClick={openSentenceEnhance} disabled={!canSentenceEnhanceSelection} title={sentenceDisabledReason}>Sentence</button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <section className="hand-zone" aria-label="Cards in hand">
            <div ref={handTrackRef} className="hand-track" onScroll={updateHandScrollHint}>
              {handCards.map((card) => (
                <article key={card.id} className={`hand-card ${selectedHandIds.includes(card.id) ? "selected" : ""}`} onPointerDown={(e) => holdStart(card.id, e.currentTarget)} onPointerUp={() => holdEndHand(card.id)} onPointerCancel={clearHold} onPointerLeave={clearHold} onContextMenu={(e) => e.preventDefault()}>
                  <span className="card-level">{card.level}</span><h3>{card.word}</h3><p className="card-points">{formatCardPoints(cardScoreFromActivation(card))} pts</p>
                </article>
              ))}
            </div>
            {handScrollHint !== "none" && (
              <div className={`hand-scroll-hint ${handScrollHint === "right" ? "show-right" : "show-left"}`} aria-hidden>
                {handScrollHint === "right" ? ">" : "<"}
              </div>
            )}
          </section>
        </div>
      </section>

      {enhanceOverlay === "words" && (
        <section className="enhancement-overlay" role="dialog" aria-modal="true" aria-label="Word enhancement">
          <div className="enhancement-card"><header><h2>Word Enhancement</h2><p>Only selected words from the same row can be enhanced together.</p></header>
            {enhanceError && <p className="accuracy-error">{enhanceError}</p>}
            <div className="word-grid">
              {enhancementCards.map((card) => {
                const a = card.activation;
                const ready = a.wordPending || a.wordCommitted;
                const blocked = a.wordBlocked;
                const locked = ready || blocked;
                const recording = recordingState.type === "word" && recordingState.cardId === card.id;
                const audioPath = wordAudioMap[card.word];
                const animKey = `${card.id}-${a.wordAttempts}-${ready ? "r" : ""}-${blocked ? "b" : ""}`;
                const wordAnimate = blocked
                  ? { x: [0, -9, 9, -6, 6, 0], opacity: 0.52 }
                  : ready
                    ? { scale: [1, 1.07, 1], opacity: 1 }
                    : a.wordAttempts > 0
                      ? { x: [0, -9, 9, -6, 6, 0], opacity: 1 }
                      : { x: 0, opacity: 1, scale: 1 };
                return (
                  <motion.article
                    key={animKey}
                    initial={{ x: 0, opacity: 1, scale: 1 }}
                    animate={wordAnimate}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className={`word-cell ${ready ? "ready" : ""} ${blocked ? "blocked" : ""}`}
                  >
                    <h3>{card.word}</h3>
                    <div className="word-cell-actions">
                      <button type="button" onClick={() => (audioPath ? playAudioUrl(audioPath) : speakFallback(card.word))} disabled={locked}>▶</button>
                      <button type="button" onClick={() => {
                        if (locked) return;
                        if (recordingState.type === "word" && recordingState.cardId === card.id) { stopRecording(); return; }
                        if (recordingState.type) { stopRecording(); return; }
                        startRecording({ type: "word", cardId: card.id, expectedText: card.word });
                      }} disabled={locked}>{recording ? "■" : "🎤"}</button>
                    </div>
                    {!ready && !blocked && a.lastWordAccuracy !== null && a.lastWordAccuracy < ACCURACY_GOAL && <p className="accuracy-error">You reached {a.lastWordAccuracy}% accuracy! Try again! You need at least {ACCURACY_GOAL}%.</p>}
                    {blocked && <p className="accuracy-blocked">Blocked after 2 failed attempts.</p>}
                    {ready && <p className="accuracy-ready">Ready to enhance.</p>}
                  </motion.article>
                );
              })}
            </div>
            <footer><button type="button" onClick={() => closeEnhanceOverlay(false)}>Go Back</button><button type="button" onClick={() => closeEnhanceOverlay(true)}>Finish Enhancement</button></footer>
          </div>
        </section>
      )}

      {enhanceOverlay === "sentence" && (
        <section className="enhancement-overlay" role="dialog" aria-modal="true" aria-label="Sentence enhancement">
          <div className="enhancement-card sentence-card"><header><h2>Sentence Enhancement</h2><p>Selected words must be from the same row.</p></header>
            {enhanceError && <p className="accuracy-error">{enhanceError}</p>}
            <div className="sentence-box">{sentenceData.loading ? <p>Generating sentence...</p> : sentenceData.error ? <p className="accuracy-error">{sentenceData.error}</p> : <p>{sentenceData.text}</p>}</div>
            {sentenceData.audioUnavailable && !sentenceData.loading && !sentenceData.error && <p className="accuracy-error" style={{ fontSize: "0.75rem" }}>Audio de referencia no disponible. Puedes leer la oración y grabarte igual.</p>}
            <div className="sentence-actions">
              <button type="button" onClick={() => (sentenceData.audioUrl ? playAudioUrl(sentenceData.audioUrl) : sentenceData.text ? speakFallback(sentenceData.text) : null)} disabled={!sentenceData.text || sentenceData.loading || sentenceOverlayBlocked || sentenceOverlayResolved}>▶</button>
              <button type="button" onClick={() => {
                if (!sentenceData.text || sentenceData.loading || sentenceOverlayBlocked || sentenceOverlayResolved) return;
                if (recordingState.type === "sentence") { stopRecording(); return; }
                if (recordingState.type) { stopRecording(); return; }
                startRecording({ type: "sentence", cardIds: enhanceSelectionIds, expectedText: sentenceData.text });
              }} disabled={!sentenceData.text || sentenceData.loading || sentenceOverlayBlocked || sentenceOverlayResolved}>{recordingState.type === "sentence" ? "■" : "🎤"}</button>
            </div>
            {sentenceFeedback && <p className={sentenceFeedback.includes("Great") ? "accuracy-ready" : "accuracy-error"}>{sentenceFeedback}</p>}
            {sentenceOverlayBlocked && <p className="accuracy-blocked">Sentence Blocked, Unable to enhance</p>}
            <footer><button type="button" onClick={() => closeEnhanceOverlay(false)}>Go Back</button><button type="button" onClick={() => closeEnhanceOverlay(true)}>Finish Enhancement</button></footer>
          </div>
        </section>
      )}

      {tooltipCard && !interactionLocked && (
        <div className="card-tooltip floating-tooltip" role="dialog" aria-label={`Card details for ${tooltipCard.word}`} style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}>
          {tooltipSlide === 0 ? <div className="tooltip-slide"><h4>{tooltipCard.translation}</h4><p>{tooltipCard.definition}</p></div> : <div className="tooltip-slide"><h4>Spanish Definition</h4><p>{tooltipCard.definition_translation}</p></div>}
          <button type="button" className="tooltip-next" onClick={(e) => { e.stopPropagation(); setTooltipSlide((prev) => (prev === 0 ? 1 : 0)); }}>&gt;</button>
        </div>
      )}

      {resultState && (
        <section className={`result-overlay ${resultState}`}>
          <div className="result-card">
            <h2>{overlayTitle}</h2>
            <p>{overlaySubtitle}</p>

            {sessionSummary.totalAttempted > 0 && (
              <div className="result-stats">
                <div className="result-stats-grid">
                  <div className="result-stat-item">
                    <span className="stat-label">Mejor mano</span>
                    <strong className="stat-value">{sessionSummary.bestHand} pts</strong>
                  </div>
                  <div className="result-stat-item">
                    <span className="stat-label">Palabras dominadas</span>
                    <strong className="stat-value">{sessionSummary.dominatedWords.length} / {sessionSummary.totalAttempted}</strong>
                  </div>
                  {sessionStats.totalSentencesSucceeded > 0 && (
                    <div className="result-stat-item">
                      <span className="stat-label">Frases activadas</span>
                      <strong className="stat-value">{sessionStats.totalSentencesSucceeded}</strong>
                    </div>
                  )}
                </div>
                {sessionSummary.dominatedWords.length > 0 && (
                  <div className="result-words-row">
                    <span className="words-row-label dominated-label">Dominadas</span>
                    <div className="words-chips">
                      {sessionSummary.dominatedWords.map((w) => <span key={w} className="word-chip dominated-chip">{w}</span>)}
                    </div>
                  </div>
                )}
                {sessionSummary.difficultWords.length > 0 && (
                  <div className="result-words-row">
                    <span className="words-row-label difficult-label">Practicar</span>
                    <div className="words-chips">
                      {sessionSummary.difficultWords.map((w) => <span key={w} className="word-chip difficult-chip">{w}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(resultState === "game_over" || resultState === "endless_game_over" || resultState === "campaign_complete") && sessionSummary.totalAttempted > 0 && (
              <div className="result-analysis">
                {sessionAnalysis.loading && <p className="analysis-loading">Analizando tu sesión...</p>}
                {!sessionAnalysis.loading && sessionAnalysis.text && <p className="analysis-text">{sessionAnalysis.text}</p>}
              </div>
            )}

            <div className="result-actions">
              {resultState === "success" && <button type="button" onClick={() => prepareStage(stageNumber + 1, isEndless)}>Continue to next level!</button>}
              {resultState === "campaign_complete" && <button type="button" onClick={() => prepareStage(stageNumber + 1, true)}>Challenge the Endless mode</button>}
              {(resultState === "game_over" || resultState === "endless_game_over") && (
                <button type="button" onClick={() => {
                  setLevelsCleared(0);
                  setSessionStats(INITIAL_SESSION_STATS);
                  setSessionAnalysis({ text: "", loading: false });
                  prepareStage(1, false);
                }}>Play Again</button>
              )}
              <button type="button" onClick={() => window.alert("Back to EnglishCode placeholder")}>Back to EnglishCode</button>
            </div>
          </div>
        </section>
      )}

      {deckOverlayOpen && !interactionLocked && (
        <section className="deck-overlay" role="dialog" aria-modal="true" aria-label="Remaining deck cards"><div className="deck-overlay-card"><header><h2>Remaining Deck ({deckCards.length})</h2><button type="button" onClick={() => setDeckOverlayOpen(false)}>Back to game</button></header>
          <div className="deck-grid">{deckCards.map((card) => <article key={card.id} className="deck-grid-card"><strong>{card.level}</strong><h3>{card.word}</h3><p>{card.translation}</p></article>)}{deckCards.length === 0 && <p className="deck-empty">No remaining cards in deck.</p>}</div>
        </div></section>
      )}

      {startupOverlayMode === "start" && (
        <section className="startup-overlay" role="dialog" aria-modal="true" aria-label="Game start options">
          <div className="startup-card">
            <h2>EnglishCode</h2>
            <p>Elige una opción para comenzar.</p>
            <div className="startup-actions">
              <button type="button" onClick={() => setStartupOverlayMode("closed")}>Play Game</button>
              <button type="button" onClick={goToTutorial}>Go to Tutorial</button>
              <button type="button" onClick={() => window.open("https://www.loom.com/share/3782316eb88f4f44b238f4edad361570", "_blank", "noopener,noreferrer")}>Watch Video Tutorial</button>
            </div>
          </div>
        </section>
      )}

      {startupOverlayMode === "tutorial" && (
        <section className="startup-overlay" role="dialog" aria-modal="true" aria-label="Tutorial carousel">
          <div className="tutorial-card">
            <div className="tutorial-track-wrap">
              <div className="tutorial-track" style={{ transform: `translateX(-${tutorialIndex * 100}%)` }}>
                {TUTORIAL_SLIDES.map((slide, idx) => (
                  <article key={`tutorial-${idx}`} className="tutorial-slide">
                    {slide.image && !tutorialImageErrors[idx] && (
                      <img
                        src={slide.image}
                        alt={`Tutorial slide ${idx + 1}`}
                        className="tutorial-slide-image"
                        onError={() => setTutorialImageErrors((prev) => ({ ...prev, [idx]: true }))}
                      />
                    )}
                    {slide.image && tutorialImageErrors[idx] && (
                      <div className="tutorial-slide-fallback">Imagen no encontrada: {slide.image}</div>
                    )}
                    <p>{slide.text}</p>
                  </article>
                ))}
              </div>
            </div>
            <footer className="tutorial-controls">
              <button type="button" onClick={previousTutorialSlide} disabled={tutorialIndex === 0}>Previous</button>
              <span>{tutorialIndex + 1} / {TUTORIAL_SLIDES.length}</span>
              <button type="button" onClick={nextTutorialSlide}>Next</button>
            </footer>
          </div>
        </section>
      )}
    </main>
  );
}

export default GameBoardMock;
