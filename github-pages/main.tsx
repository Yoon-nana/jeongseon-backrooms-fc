import { createRoot } from "react-dom/client";
import Game from "../app/Game";
import "../app/globals.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("게임 화면을 표시할 루트 요소를 찾지 못했습니다.");
}

createRoot(container).render(<Game />);
