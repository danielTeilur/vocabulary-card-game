import { useState } from "react";
import LoopSelector from "../features/game/LoopSelector";
import GameBoardMock from "../features/game/GameBoardMock";
import { getTokenByEmail } from "../services/chatbotApi";

function getTokenFromUrl() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  if (token) {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("token");
    window.history.replaceState({}, "", clean.toString());
  }
  return token;
}

const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

function DevLogin({ onToken }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = await getTokenByEmail(email.trim());
    setLoading(false);
    if (!token) {
      setError("Usuario no encontrado o error al conectar con el backend.");
      return;
    }
    onToken(token);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-white text-xl font-semibold">Dev Login</h1>
        <p className="text-gray-400 text-sm">Ingresa el correo del usuario para cargar sus datos.</p>
        <input
          type="email"
          required
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2"
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function App() {
  const urlToken = getTokenFromUrl();
  const [token, setToken] = useState(urlToken);
  const [wordBank, setWordBank] = useState(null);

  if (!token && IS_DEV_MODE) {
    return <DevLogin onToken={setToken} />;
  }

  if (!wordBank) {
    return <LoopSelector token={token} onSelect={setWordBank} />;
  }

  return <GameBoardMock wordBank={wordBank} />;
}

export default App;
