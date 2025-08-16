import React, { useMemo } from "react";
import { Github, Lightbulb, Linkedin } from "lucide-react";
import { FaAws } from "react-icons/fa";
import {
  SiReact,
  SiNodedotjs,
  SiTailwindcss,
  SiDocker,
  SiFigma,
  SiNextdotjs,
  SiMongodb,
  SiPostgresql,
  SiJavascript,
  SiTypescript,
} from "react-icons/si";
import hcmus from "/hcmus1.png";
import { Button } from "./ui/button";
import bingsuimg from "/background-banner.webp";

export type InfoCardProps = {
  bgSrc?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  className?: string;
};

const techIcons = [
  { key: "react", Comp: SiReact },
  { key: "node", Comp: SiNodedotjs },
  { key: "tailwind", Comp: SiTailwindcss },
  { key: "docker", Comp: SiDocker },
  { key: "figma", Comp: SiFigma },
  { key: "aws", Comp: FaAws },
  { key: "nextjs", Comp: SiNextdotjs },
  { key: "mongodb", Comp: SiMongodb },
  { key: "postgresql", Comp: SiPostgresql },
  { key: "javascript", Comp: SiJavascript },
  { key: "typescript", Comp: SiTypescript },
];

export default function InfoCard({
  bgSrc = "/bgkk.jpg",
  githubUrl = "https://github.com/",
  linkedinUrl = "https://www.linkedin.com/",
  className = "",
}: InfoCardProps) {
  // Generate more random positions with potential overlaps and reuse of icons
  const positions = useMemo(() => {
    // Predefined positions for even distribution with natural randomness
    const predefinedPositions = [
      { top: 12, left: 15, iconIndex: 0, opacity: 0.6 }, // React - top left
      { top: 8, left: 45, iconIndex: 1, opacity: 0.5 }, // Node - top center
      { top: 15, left: 75, iconIndex: 2, opacity: 0.7 }, // Tailwind - top right
      { top: 25, left: 25, iconIndex: 3, opacity: 0.4 }, // Docker - upper left
      { top: 22, left: 65, iconIndex: 4, opacity: 0.6 }, // Figma - upper right
      { top: 35, left: 10, iconIndex: 5, opacity: 0.5 }, // AWS - left side
      { top: 32, left: 85, iconIndex: 6, opacity: 0.7 }, // Next.js - right side
      { top: 45, left: 30, iconIndex: 7, opacity: 0.6 }, // MongoDB - center left
      { top: 42, left: 70, iconIndex: 8, opacity: 0.5 }, // PostgreSQL - center right
      { top: 55, left: 18, iconIndex: 9, opacity: 0.4 }, // JavaScript - lower left
      { top: 52, left: 55, iconIndex: 10, opacity: 0.6 }, // TypeScript - lower center
      { top: 58, left: 82, iconIndex: 0, opacity: 0.5 }, // React again - lower right
      { top: 68, left: 35, iconIndex: 1, opacity: 0.7 }, // Node again - bottom left
      { top: 65, left: 65, iconIndex: 2, opacity: 0.4 }, // Tailwind again - bottom right
      { top: 28, left: 50, iconIndex: 3, opacity: 0.3 }, // Docker again - center
      { top: 48, left: 45, iconIndex: 4, opacity: 0.5 }, // Figma again - middle center
    ];

    return predefinedPositions;
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-end w-80 shadow-xl overflow-hidden ${className}`}
      style={{
        backgroundImage: `url(${bgSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        aspectRatio: "3/5",
      }}
    >
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

      {/* Tech icons randomly distributed */}
      <div className="absolute inset-0">
        {positions.map((pos, i) => {
          const { Comp } = techIcons[pos.iconIndex];
          return (
            <div
              key={i}
              className="absolute drop-shadow-lg"
              style={{
                top: `${pos.top}%`,
                left: `${pos.left}%`,
                transform: "translate(-50%, -50%)",
                opacity: pos.opacity,
              }}
            >
              <Comp className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/90" />
            </div>
          );
        })}
      </div>

      {/* Content with enhanced readability */}
      <div
        className="relative z-10 w-full py-6 text-left text-white bg-gradient-to-t from-black/40 via-black/20 to-transparent"
        style={{ textShadow: "0 2px 4px rgba(0,0,0,.8)" }}
      >
        <div
          style={{
            backgroundImage: `url(${bingsuimg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            aspectRatio: "3/5",
          }}
          className="w-full h-20 mb-10 shadow-xl flex justify-center items-center"
        >
          <span className="luckiest-guy-regular text-5xl text-center mt-3">
            BINGSU
          </span>
        </div>
        <div className="px-4">
          <h1 className="text-3xl font-extrabold tracking-tight mb-5">
            NGO GIA AN
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium">
            <Button>Software Developer</Button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M7 2v2H5a2 2 0 0 0-2 2v1h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm14 7H3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9Zm-2 4h-6v6h6v-6Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">
                  Date of Birth
                </div>
                <div className="text-sm font-medium">March 11, 2005</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2Zm-1 13.27L4 12v5c0 2.76 4.48 5 8 5s8-2.24 8-5v-3l-9 4.27Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">
                  Education
                </div>
                <div className="text-sm font-medium">
                  VNU - Ho Chi Minh University of Science
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Lightbulb size={16} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">
                  MAJORITY
                </div>
                <div className="text-sm font-medium">
                  Information Technology
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[2fr_3fr] gap-3">
            <div className="flex gap-3 items-center">
              <Button variant="outline">
                <Github className="h-5 w-5" />
              </Button>
              <Button>
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex justify-center">
              <img className="w-[90%] h-auto " src={hcmus} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
