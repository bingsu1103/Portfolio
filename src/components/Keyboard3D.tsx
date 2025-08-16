// Keyboard3D.tsx (đã sửa đầy đủ)
import { useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import react from "../assets/react.svg";
import nodejs from "../assets/nodejs.png";
import html5 from "../assets/html5.svg";
import css3 from "../assets/css3.svg";
import docker from "../assets/docker.svg";
import tailwind from "../assets/tailwind.svg";
import javascript from "../assets/javascript.png";
import mongodb from "../assets/mongodb.svg";
import typescript from "../assets/typescript.png";
import cloudinary from "../assets/cloudinary.svg";
import github from "../assets/github.png";
import antd from "../assets/antd.svg";
import shadcnui from "../assets/shadcnui.png";
import postgresql from "../assets/postgresql.png";
import threejs from "../assets/threejs.png";
import express from "../assets/express.png";
import vercel from "../assets/vercel.svg";
import redux from "../assets/redux.svg";
import zustand from "../assets/zustand.png";
import figma from "../assets/figma.svg";
import nestjs from "../assets/nestjs.svg";
import nextjs from "../assets/nextjs.svg";
import aws from "../assets/aws.png";
import spring from "../assets/spring.png";
// import GalaxyBackground from "./GalaxyBackground";
import OrbitingModel from "./OrbitingModel";

/** Kiểu props cho một keycap */
type KeycapProps = {
  color: string;
  img?: string;
  position: [number, number, number];
  size?: [number, number, number];
  topScale?: number;
};

/**
 * KEYCAP với cơ chế NHẤN VUÔNG GÓC MẶT BÀN PHÍM
 * (ĐÃ BỎ set cursor để không phá custom cursor overlay)
 */
function Keycap({ color, img, position, size = [1.05, 1, 1.05] }: KeycapProps) {
  const pressRef = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const target = useRef(0);
  const current = useRef(0);

  useFrame((_, dt) => {
    target.current = hovered ? -0.3 : 0; // độ lún khi hover
    const k = 12;
    current.current += (target.current - current.current) * Math.min(1, k * dt);

    const n = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(innerRef.current.quaternion)
      .normalize();

    pressRef.current.position.set(
      position[0] + n.x * current.current,
      position[1] + n.y * current.current,
      position[2] + n.z * current.current
    );
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
  };
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    current.current = -0.16;
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    current.current = -0.12;
  };

  const topY = size[1] / 2 + 0.001;

  // texture cho ảnh (dùng ảnh prop nếu có, mặc định dùng reactpng)
  const tex = useTexture(img ?? (react as unknown as string));
  useMemo(() => {
    if (!tex) return;
    tex.anisotropy = 8;
    tex.magFilter = THREE.LinearFilter;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tex as any).encoding = (THREE as any).sRGBEncoding;
  }, [tex]);

  return (
    <group ref={pressRef} position={position}>
      {/* QUAY -90° quanh X để mặt TRÊN (local +Y) song song mặt phẳng bàn phím */}
      <group ref={innerRef} rotation={[-Math.PI / 2, 0, Math.PI]}>
        {/* Đế phím */}
        <mesh position={[0, -0.6, -0.08]}>
          <boxGeometry args={[size[0] * 1.05, size[1] * 0.2, size[2] * 1.05]} />
          <meshStandardMaterial color="#DF2125" />
        </mesh>

        {/* Thân phím (bo góc) */}
        <RoundedBox
          args={size}
          radius={0.2}
          smoothness={8}
          onPointerOver={onOver}
          onPointerOut={onOut}
          onPointerDown={onDown}
          onPointerUp={onUp}
        >
          <meshStandardMaterial color={color} roughness={0.45} />
        </RoundedBox>

        {/* Ảnh dán trên mặt phím */}
        <mesh
          position={[0, topY + 0.0015, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          // tránh chặn hover/click lên keycap
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raycast={() => null as any}
          renderOrder={2}
        >
          <planeGeometry args={[0.78, 0.78]} />
          <meshBasicMaterial
            map={tex}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function KeyboardRig({
  children,
  dragDelta,
}: {
  children: React.ReactNode;
  dragDelta: React.MutableRefObject<{ dx: number; dy: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  const target = useRef({ x: -Math.PI / 4, y: 0, z: -Math.PI / 16 });
  const current = useRef({ ...target.current });

  useFrame((_, dt) => {
    // áp dụng delta từ drag
    if (dragDelta.current.dx !== 0 || dragDelta.current.dy !== 0) {
      target.current.y += dragDelta.current.dx * 0.003; // xoay ngang
      target.current.x += dragDelta.current.dy * 0.003; // ngửa/gập
      dragDelta.current.dx = 0;
      dragDelta.current.dy = 0;
    }

    const k = 10;
    current.current.x +=
      (target.current.x - current.current.x) * Math.min(1, k * dt);
    current.current.y +=
      (target.current.y - current.current.y) * Math.min(1, k * dt);
    current.current.z +=
      (target.current.z - current.current.z) * Math.min(1, k * dt);

    groupRef.current.rotation.set(
      current.current.x,
      current.current.y,
      current.current.z
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

/** Định nghĩa màu + ảnh mỗi phím */
type KeyDef = { color: string; img?: string };

const palette = {
  js: "#DB5E10",
  ts: "#0C88CA",
  react: "#1DC3BB",
  tailwind: "#44A8B3",
  three: "#6e6ef7",
  git: "#24292e",
  node: "#005416",
  red: "#ee4b4b",
  orange: "#f59e0b",
  cyan: "#22d3ee",
  green: "#22c55e",
  blue: "#3b82f6",
  gray: "#64748b",
  typescript: "#007ACC",
  express: "#000",
  figma: "#000",
  nextjs: "#fff",
  nestjs: "#000",
  spring: "#fff",
  html5: "#DC1D10",
  css3: "#2D53E5",
  shadcnui: "#000",
  postgresql: "#fff",
  aws: "#000",
  docker: "#10ADDA",
};

const layout: KeyDef[][] = [
  [
    { color: palette.react, img: react },
    { color: palette.html5, img: html5 },
    { color: palette.css3, img: css3 },
    { color: palette.node, img: nodejs },
    { color: palette.express, img: express },
    { color: palette.docker, img: docker },
  ],
  [
    { color: palette.tailwind, img: tailwind },
    { color: palette.js, img: javascript },
    { color: palette.ts, img: typescript },
    { color: palette.green, img: mongodb },
    { color: palette.orange, img: cloudinary },
    { color: palette.git, img: redux },
  ],
  [
    { color: palette.gray, img: github },
    { color: palette.react, img: antd },
    { color: palette.shadcnui, img: shadcnui },
    { color: palette.postgresql, img: postgresql },
    { color: palette.gray, img: threejs },
    { color: palette.git, img: zustand },
  ],
  [
    { color: palette.js, img: vercel },
    { color: palette.spring, img: spring },
    { color: palette.figma, img: figma },
    { color: palette.aws, img: aws },
    { color: palette.nestjs, img: nestjs },
    { color: palette.nextjs, img: nextjs },
  ],
];

function Keyboard() {
  const keys = useMemo(() => {
    const items: { pos: [number, number, number]; def: KeyDef }[] = [];
    const spacing = 1.2;
    const rows = layout.length;
    for (let r = 0; r < rows; r++) {
      const cols = layout[r].length;
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacing;
        const y = ((rows - 1) / 2 - r) * spacing;
        items.push({ pos: [x, y, 0], def: layout[r][c] });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {keys.map((k, i) => (
        <Keycap key={i} color={k.def.color} img={k.def.img} position={k.pos} />
      ))}
    </group>
  );
}

/**
 * SCENE CHÍNH
 * (ĐÃ bỏ onWheel; ĐÃ tắt rotate của OrbitControls)
 */
export default function Keyboard3D() {
  const dragDeltaRef = useRef({ dx: 0, dy: 0 });
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div className="w-full bg-background">
      <div className="relative w-full h-[50vh] md:h-full">
        <Canvas
          camera={{ position: [-2, 5, 7], fov: 70 }}
          onPointerDown={(e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e.pointerType as any) !== "mouse") return;
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!dragging.current || !last.current) return;
            const dx = e.clientX - last.current.x;
            const dy = e.clientY - last.current.y;
            dragDeltaRef.current.dx += dx;
            dragDeltaRef.current.dy += dy;
            last.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => {
            dragging.current = false;
            last.current = null;
          }}
          onPointerLeave={() => {
            dragging.current = false;
            last.current = null;
          }}
        >
          {/* NỀN & ÁNH SÁNG */}
          <color attach="background" args={["#000000"]} />
          {/* <GalaxyBackground
            count={3500} // số lượng sao cố định
            radius={58} // bán kính "vũ trụ"
            twist={0.55} // độ xoáy dải ngân hà
            rotSpeed={-0.04} // tốc độ quay rất nhẹ
            jitter={0.001} // lấp lánh nhỏ
          /> */}

          <spotLight
            position={[20, 20, 20]}
            intensity={1.2}
            angle={0.35}
            penumbra={0.7}
          />
          <ambientLight intensity={0.3} />
          <OrbitingModel
            url="/models/cosmonaut.glb"
            radius={30} // 👈 nhỏ+   speed={0.25}
            direction={1}
            speed={0.5}
            scale={0.02}
            phase={0.2}
            center={[-3, -2, -15]} // 👈 tâm lệch về giữa khung phải
          />

          {/* BÀN PHÍM */}
          <KeyboardRig dragDelta={dragDeltaRef}>
            <mesh position={[0, 0, -0.5]}>
              <boxGeometry args={[7.5, 5, 0.5]} />
              <meshStandardMaterial color="#0f1115" roughness={0.9} />
            </mesh>
            <Keyboard />
          </KeyboardRig>

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
          />
        </Canvas>
      </div>
    </div>
  );
}
