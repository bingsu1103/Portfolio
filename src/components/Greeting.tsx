import Typewriter from "typewriter-effect";
import { Button } from "./ui/button";
import { FolderGit2 } from "lucide-react";
const Greeting = () => {
  return (
    <div className="flex flex-col sm:p-20 p-10  bg-[#000]">
      <div>
        <h1 className="font-bold text-3xl md:text-4xl">
          Welcome to my portfolio
        </h1>
        <h2 className="font-bold text-2xl md:text-3xl mt-1">
          I'm <span className="text-[#19F2B3]">GIA AN</span>
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
      <div>
        <Button>
          <FolderGit2 />
        </Button>
      </div>
    </div>
  );
};
export default Greeting;
