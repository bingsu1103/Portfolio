import { useRef, useState } from "react";
import Header from "./components/layout/header";
import Portfolio from "./components/Portfolio";
import "./styles/global.css";

export default function App() {
  const [current, setCurrent] = useState<number>(0);
  const goToRef = useRef<(i: number) => void>(() => {});

  const handleNav = (i: number) => {
    goToRef.current?.(i);
  };

  return (
    <div className="app" style={{ position: "relative" }}>
      <Header current={current} onNav={handleNav} />
      <Portfolio
        onIndexChange={setCurrent}
        registerGoTo={(fn) => {
          goToRef.current = fn;
        }}
      />
    </div>
  );
}
