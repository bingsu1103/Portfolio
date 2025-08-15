import Typewriter from "typewriter-effect";
import { Button } from "./ui/button";
import { Download, FolderGit2 } from "lucide-react";
import wavinghand from "../assets/icon/wavinghand.svg";
import TerminalSkills from "./TerminalSkills";

type GreetingProps = {
  onGoTo?: (i: number) => void;
};

const Greeting = ({ onGoTo }: GreetingProps) => {
  return (
    <div className="flex flex-col sm:p-20 p-10  bg-[#000]">
      <div>
        <div className="flex gap-2">
          <h1 className="font-bold text-3xl md:text-4xl">
            Welcome to my portfolio
          </h1>
          <img className="greeting" width={35} src={wavinghand} />
        </div>
        <h2 className="font-bold text-2xl md:text-3xl mt-1">
          I'm <span className="text-[#19F2B3]">Gia An</span>
        </h2>
        <div className="mt-1 text-xl">
          <Typewriter
            options={{
              strings: [
                "Software Developer",
                "Freelancer",
                "MERN Stack Developer",
                "Open Source Contributor",
              ],
              autoStart: true,
              loop: true,
              deleteSpeed: 50,
              wrapperClassName: "text-pink-500",
            }}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-10">
        <Button
          style={{
            padding: "25px",
          }}
          onClick={() => onGoTo?.(2)}
        >
          <FolderGit2 size={20} />
          Projects
        </Button>
        <Button
          style={{
            padding: "25px",
          }}
          onClick={() => onGoTo?.(3)}
        >
          <Download size={20} />
          Get resume
        </Button>
      </div>
      <div className="mt-15">
        <TerminalSkills />
      </div>
    </div>
  );
};
export default Greeting;
