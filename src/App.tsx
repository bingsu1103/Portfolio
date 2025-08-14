import Footer from "./components/layout/footer";
import Header from "./components/layout/header";
import Portfolio from "./components/Portfolio";
import "./styles/global.css";
export default function App() {
  return (
    <div className="app">
      <Header />
      <Portfolio></Portfolio>
      <Footer />
    </div>
  );
}
