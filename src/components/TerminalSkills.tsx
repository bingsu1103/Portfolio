import { useMemo } from "react";
import Typewriter from "typewriter-effect";

// highlight.js (load gọn chỉ ngôn ngữ cần)
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
// chọn 1 theme có sẵn:
import "highlight.js/styles/github-dark-dimmed.css";
// import "highlight.js/styles/atom-one-dark.css";

hljs.registerLanguage("javascript", javascript);

const code = `export const fetchAllSkills = async () => {
  try {
    const { data } = await axios.get(
      \`\${process.env.REACT_APP_BACKEND_URL}/skills\`
    );
    return data;
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
};`;

const TerminalSkills = () => {
  // Tạo HTML đã tô màu một lần
  const highlighted = useMemo(
    () => hljs.highlight(code, { language: "javascript" }).value,
    []
  );

  return (
    <div className="w-full p-0">
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Title bar */}
        <div className="bg-background px-4 py-2 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 rounded-full bg-red-500" />
            <span aria-hidden className="h-3 w-3 rounded-full bg-yellow-500" />
            <span aria-hidden className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="mx-auto text-xs text-foreground font-medium select-none">
            Terminal — bash — 80x24
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#0D1116] p-4">
          <pre className="text-sm leading-6 font-mono overflow-x-auto overflow-y-hidden">
            {/* wrapperClassName thêm lớp hljs để theme áp dụng */}
            <Typewriter
              options={{
                delay: 22,
                deleteSpeed: 40,
                loop: true,
                cursor: "▋",
                wrapperClassName: "hljs language-javascript whitespace-pre",
              }}
              onInit={(tw) => {
                // Gõ HTML đã highlight (token cùng loại sẽ cùng màu)
                tw.typeString(highlighted).pauseFor(1200).deleteAll(10).start();
              }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TerminalSkills;
