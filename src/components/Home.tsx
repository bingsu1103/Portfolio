import Keyboard3D from "../components/Keyboard3D";
import Greeting from "./Greeting";

const Home = () => {
  return (
    <section className="h-screen sm:grid sm:grid-cols-2 grid-cols-1 bg-background text-white snap-start relative">
      <Greeting />
      <Keyboard3D />
    </section>
  );
};

export default Home;
