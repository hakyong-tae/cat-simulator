import { useState } from "react";
import OpeningCinematic from "./OpeningCinematic";
import Assets from "./assets.json";

function App() {
  const [showOpening, setShowOpening] = useState(true);

  if (showOpening) {
    return (
      <OpeningCinematic
        videoUrl={Assets.cinematics.opening.url}
        onComplete={() => setShowOpening(false)}
      />
    );
  }

  // 시네마틱 종료 후 아무것도 렌더링하지 않음 — Unity 게임이 보임
  return null;
}

export default App;
