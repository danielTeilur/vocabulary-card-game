import { useState } from "react";
import LoopSelector from "../features/game/LoopSelector";
import GameBoardMock from "../features/game/GameBoardMock";

/**
 * Reads the JWT from the ?token= query param set by the EnglishCode platform
 * when it opens the game in a new tab or iframe.
 */
function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get("token") || "";
}

function App() {
  const token = getTokenFromUrl();
  const [wordBank, setWordBank] = useState(null);

  if (!wordBank) {
    return <LoopSelector token={token} onSelect={setWordBank} />;
  }

  return <GameBoardMock wordBank={wordBank} />;
}

export default App;
