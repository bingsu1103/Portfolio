import Keyboard3D from "../components/Keyboard3D";
import Greeting from "./Greeting";

type HomeProps = {
  onGoTo?: (i: number) => void;
};

const Home = ({ onGoTo }: HomeProps) => {
  return (
    <section className="h-screen sm:grid sm:grid-cols-2 grid-cols-1 bg-background text-white snap-start relative">
      <Greeting onGoTo={onGoTo} />
      <Keyboard3D />
    </section>
  );
};

export default Home;
