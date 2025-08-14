import { useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  RoundedBox,
  useTexture, // ← thêm
} from "@react-three/drei";
import * as THREE from "three";
import reactpng from "../assets/react.png";
import nodejs from "../assets/nodejs.png";
import html5 from "../assets/html5.png";
import css3 from "../assets/css3.png";
import docker from "../assets/docker.png";
import tailwind from "../assets/tailwind.png";
import javascript from "../assets/javascript.png";
import mongodb from "../assets/mongodb.png";
import typescript from "../assets/typescript.png";
import cloudinary from "../assets/cloudinary.png";
import github from "../assets/github.png";
import antd from "../assets/antd.svg";
import shadcnui from "../assets/shadcnui.png";
import postgresql from "../assets/postgresql.png";
import threejs from "../assets/threejs.png";
import express from "../assets/express.png";
import vercel from "../assets/vercel.svg";
import redux from "../assets/redux.svg";
import zustand from "../assets/zustand.png";
import figma from "../assets/figma.png";
import nestjs from "../assets/nestjs.svg";
import nextjs from "../assets/nextjs.svg";
import aws from "../assets/aws.png";
import spring from "../assets/spring.png";

/**
 * TẠO HÌNH HỌC KEYCAP CÓ TAPER (MẶT TRÊN NHỎ HƠN)
 */
// function useTaperedBoxGeom(size: [number, number, number], topScale = 0.86) {
//   return useMemo(() => {
//     const [w, h, d] = size;
//     const geo = new THREE.BoxGeometry(w, h, d, 12, 8, 12);
//     const pos = geo.attributes.position as THREE.BufferAttribute;
//     const halfH = h / 2;
//     for (let i = 0; i < pos.count; i++) {
//       const y = pos.getY(i);
//       const t = (y + halfH) / h;
//       const s = 1 + (topScale - 1) * t;
//       pos.setX(i, pos.getX(i) * s);
//       pos.setZ(i, pos.getZ(i) * s);
//     }
//     pos.needsUpdate = true;
//     geo.computeVertexNormals();
//     return geo;
//   }, [size, topScale]);
// }

/** Kiểu props cho một keycap */
type KeycapProps = {
  color: string;
  img?: string; // ← dùng ảnh thay vì label
  position: [number, number, number];
  size?: [number, number, number];
  topScale?: number;
};

/**
 * KEYCAP với cơ chế NHẤN VUÔNG GÓC MẶT BÀN PHÍM
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
    document.body.style.cursor = "pointer";
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
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
  const tex = useTexture(img ?? (reactpng as unknown as string));
  useMemo(() => {
    if (!tex) return;
    tex.anisotropy = 8;
    tex.magFilter = THREE.LinearFilter; // đổi sang NearestFilter nếu icon pixel-art
    // @ts-expect-error: sRGBEncoding may not be typed on THREE but exists at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tex.encoding = (THREE as any).sRGBEncoding;
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
          <meshStandardMaterial
            color={color}
            roughness={0.45}
            metalness={0.08}
          />
        </RoundedBox>

        {/* Ảnh dán trên mặt phím */}
        <mesh
          position={[0, topY + 0.0015, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raycast={() => null as any} // để không chặn hover/click lên keycap
          renderOrder={2}
        >
          {/* Chỉnh kích thước icon tại đây (0.7–0.85 là đẹp) */}
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
  onWheelDelta,
}: {
  children: React.ReactNode;
  onWheelDelta: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  // góc mục tiêu (khởi tạo giống bạn đang set cố định)
  const target = useRef({
    x: -Math.PI / 4,
    y: 0,
    z: -Math.PI / 16,
  });
  // góc hiện tại (để nội suy mượt)
  const current = useRef({ ...target.current });

  useFrame((_, dt) => {
    // cộng dồn delta từ wheel vào trục Y (xoay quanh trục đứng)
    if (onWheelDelta.current !== 0) {
      target.current.y += onWheelDelta.current * 0.003; // hệ số nhạy
      onWheelDelta.current = 0; // reset sau khi áp dụng
    }

    // nội suy mượt về target
    const k = 10; // tốc độ mượt
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
  js: "#F1A93A",
  ts: "#2F91F3",
  react: "#61dafb",
  tailwind: "#38bdf8",
  three: "#6e6ef7",
  git: "#24292e",
  node: "#000",
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
  spring: "#fff",
};

// Tạm thời gán cùng một ảnh reactpng cho tất cả phím (bạn có thể thay riêng từng cái sau)
const layout: KeyDef[][] = [
  [
    { color: palette.js, img: reactpng },
    { color: palette.ts, img: html5 },
    { color: palette.tailwind, img: css3 },
    { color: palette.node, img: nodejs },
    { color: palette.express, img: express },
    { color: palette.git, img: docker },
  ],
  [
    { color: palette.red, img: tailwind },
    { color: palette.cyan, img: javascript },
    { color: palette.three, img: typescript },
    { color: palette.green, img: mongodb },
    { color: palette.orange, img: cloudinary },
    { color: palette.git, img: redux },
  ],
  [
    { color: palette.gray, img: github },
    { color: palette.react, img: antd },
    { color: palette.blue, img: shadcnui },
    { color: palette.green, img: postgresql },
    { color: palette.gray, img: threejs },
    { color: palette.git, img: zustand },
  ],
  [
    { color: palette.js, img: vercel },
    { color: palette.spring, img: spring },
    { color: palette.figma, img: figma },
    { color: palette.tailwind, img: aws },
    { color: palette.node, img: nestjs },
    { color: palette.nextjs, img: nextjs },
  ],
];

/**
 * TÍNH TOẠ ĐỘ LƯỚI CĂN GIỮA TRONG HỆ CỦA NHÓM BÀN PHÍM
 */
function Keyboard() {
  const keys = useMemo(() => {
    const items: { pos: [number, number, number]; def: KeyDef }[] = [];
    const spacing = 1.2;
    const rows = layout.length;
    for (let r = 0; r < rows; r++) {
      const cols = layout[r].length;
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacing;
        const y = (rows / 2 - r) * spacing;
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
 */
export default function Keyboard3D() {
  const wheelDeltaRef = useRef(0);
  return (
    <div className="h-screen w-full bg-black text-white ml-[330px]">
      <Canvas
        camera={{ position: [-5, 1, 7], fov: 70 }}
        onWheel={(e) => {
          // cộng dồn deltaY; giá trị dương/âm tùy hướng cuộn
          wheelDeltaRef.current += e.deltaY;
          // NGĂN OrbitControls zoom nếu bạn để enableZoom=true
          e.stopPropagation();
        }}
      >
        {/* NỀN & ÁNH SÁNG */}
        <color attach="background" args={["#0b0c10"]} />
        <spotLight
          position={[20, 20, 20]}
          intensity={1.2}
          angle={0.35}
          penumbra={0.7}
        />
        <ambientLight intensity={0.3} />

        {/* TẤM NỀN BÀN PHÍM (backplate) */}
        <KeyboardRig onWheelDelta={wheelDeltaRef}>
          {/* TẤM NỀN BÀN PHÍM (backplate) */}
          <mesh position={[0, 0, -0.5]}>
            <boxGeometry args={[7.5, 5.5, 0.5]} />
            <meshStandardMaterial color="#0f1115" roughness={0.9} />
          </mesh>

          {/* NHÓM BÀN PHÍM */}
          <Keyboard />
        </KeyboardRig>

        {/* NHÓM BÀN PHÍM */}
        {/* <group rotation={[-Math.PI / 4, 0, -Math.PI / 16]}>
            <Keyboard />
          </group> */}

        <Environment preset="city" />
        <OrbitControls enablePan={false} minDistance={6} maxDistance={14} />
      </Canvas>
    </div>
  );
}
