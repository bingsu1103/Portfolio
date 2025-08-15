import { Menu, Moon, Sun, Volume2, VolumeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/context/theme.context";
import { memo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  current: number;
  onNav: (i: number) => void;
}

const NAVS = [
  { label: "Home", index: 0 },
  { label: "About", index: 1 },
  { label: "Project", index: 2 },
  { label: "Resume", index: 3 },
];

const Header = ({ current, onNav }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [mute, setMute] = useState<boolean>(false);

  return (
    <div className="bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
      <div className="flex items-center">
        <span className="p-5 text-2xl font-bold">Portfolio</span>
        <nav className="flex gap-1 max-sm:hidden">
          {NAVS.map((n) => {
            const isActive = current === n.index;
            return (
              <button
                key={n.label}
                onClick={() => onNav(n.index)}
                className={
                  "relative px-5 py-5 text-sm font-medium transition-opacity " +
                  (isActive ? "opacity-100" : "opacity-60 hover:opacity-100")
                }
                aria-current={isActive ? "page" : undefined}
                aria-label={`Go to ${n.label}`}
              >
                <span
                  className={
                    "after:absolute after:left-5 after:right-5 after:-bottom-1 after:h-0.5 " +
                    (isActive ? "after:bg-primary" : "after:bg-transparent")
                  }
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex gap-2 justify-end sm:pr-10 pr-5">
        {theme === "light" ? (
          <Button className="cursor-pointer" onClick={() => setTheme("dark")}>
            <Moon />
          </Button>
        ) : (
          <Button className="cursor-pointer" onClick={() => setTheme("light")}>
            <Sun />
          </Button>
        )}
        <div className="flex gap-2">
          {mute === false ? (
            <Button variant="outline" onClick={() => setMute(true)}>
              <Volume2 className="text-[#F56565]" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setMute(false)}>
              <VolumeOff className="text-[#F56565]" />
            </Button>
          )}
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Portfolio</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NAVS.map((n) => (
                <DropdownMenuItem onClick={() => onNav(n.index)}>
                  <span className="code">{n.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default memo(Header);
