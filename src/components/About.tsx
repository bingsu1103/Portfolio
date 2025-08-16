import Card from "./Card";
import { toPng, toSvg } from "html-to-image";

const handleDownload = () => {
  const node = document.getElementById("info-card");
  if (node) {
    toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "info-card.png";
      link.href = dataUrl;
      link.click();
    });
  }
};

const handleExport = async () => {
  const node = document.getElementById("info-card");
  if (!node) return;

  try {
    const dataUrl = await toSvg(node, {
      // tuỳ chọn hữu ích:
      cacheBust: true, // tránh cache ảnh
      // skipFonts: false,  // giữ font nhúng (mặc định)
    });

    const link = document.createElement("a");
    link.download = "info-card.svg";
    link.href = dataUrl; // data:image/svg+xml;charset=utf-8,...
    link.click();
  } catch (e) {
    console.error(e);
    alert("Xuất SVG thất bại. Kiểm tra CORS ảnh nền nhé!");
  }
};

const About = () => {
  return (
    <section className="h-screen flex items-center justify-center  text-white snap-start">
      <div id="info-card">
        <Card />
      </div>
      <button
        onClick={handleDownload}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
      >
        Export PNG
      </button>
    </section>
  );
};

export default About;
