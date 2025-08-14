import Keyboard3D from "../components/Keyboard3D";
const Home = () => {
  return (
    <section className="h-screen flex justify-end items-center bg-[#0B0C10] text-white snap-start">
      <div className="w-full">
        <Keyboard3D />
      </div>
    </section>
  );
};

export default Home;
