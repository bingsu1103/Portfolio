import { useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * TẠO HÌNH HỌC KEYCAP CÓ TAPER (MẶT TRÊN NHỎ HƠN)
 * - Dựa trên BoxGeometry chia lưới đủ dày để "bóp" đỉnh theo trục Y
 */
function useTaperedBoxGeom(size: [number, number, number], topScale = 0.86) {
  return useMemo(() => {
    const [w, h, d] = size;
    const geo = new THREE.BoxGeometry(w, h, d, 12, 8, 12);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const halfH = h / 2;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + halfH) / h; // 0 ở đáy, 1 ở đỉnh
      const s = 1 + (topScale - 1) * t; // scale tuyến tính theo độ cao
      pos.setX(i, pos.getX(i) * s);
      pos.setZ(i, pos.getZ(i) * s);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [size, topScale]);
}

/** Kiểu props cho một keycap */
type KeycapProps = {
  color: string;
  label?: string;
  position: [number, number, number]; // trong hệ toạ độ CỦA NHÓM BÀN PHÍM (đã xoay)
  size?: [number, number, number];
  topScale?: number;
};

/**
 * KEYCAP với cơ chế NHẤN VUÔNG GÓC MẶT BÀN PHÍM
 * - pressRef: group bên ngoài chỉ lo DỊCH CHUYỂN (position.z) theo trục Z của CHA
 *   => luôn vuông góc với mặt phẳng XY của nhóm bàn phím đã xoay
 * - inner: group bên trong chỉ lo XOAY để hiển thị đẹp (không ảnh hưởng hướng dịch)
 */
function Keycap({
  color,
  label,
  position,
  size = [1.05, 0.62, 1.05],
  topScale = 0.84,
}: KeycapProps) {
  const pressRef = useRef<THREE.Group>(null!); // nhóm DỊCH (nhấn)
  const innerRef = useRef<THREE.Group>(null!); // nhóm XOAY (hiển thị)
  const [hovered, setHovered] = useState(false);
  const target = useRef(0);
  const current = useRef(0);

  useFrame((_, dt) => {
    // 1) easing vị trí nhún
    target.current = hovered ? -0.12 : 0;
    const k = 12;
    current.current += (target.current - current.current) * Math.min(1, k * dt);

    // 2) Hướng nhấn = pháp tuyến mặt TRÊN của keycap trong hệ nhóm bàn phím
    const n = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(innerRef.current.quaternion)
      .normalize();

    // 3) Dời pressRef dọc theo n, tính từ base position
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
  const geom = useTaperedBoxGeom(size, topScale);

  return (
    <group ref={pressRef} position={position}>
      {/* QUAN TRỌNG: quay -90° quanh X để mặt TRÊN (local +Y) // mặt phẳng bàn phím */}
      <group ref={innerRef} rotation={[-Math.PI / 2, 0, Math.PI]}>
        {/* Đế phím */}
        <mesh position={[0, -0.6, -0.08]}>
          <boxGeometry args={[size[0] * 1.05, size[1] * 0.2, size[2] * 1.05]} />
          <meshStandardMaterial color="#151515" />
        </mesh>

        {/* Thân phím */}
        <mesh
          geometry={geom}
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
        </mesh>

        {/* Nhãn — KHÔNG xoay thêm, vì innerRef đã xoay -90° */}
        {label && (
          <Text
            position={[0, topY, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
            material-side={THREE.DoubleSide}
            fontSize={0.32}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#000000"
            depthOffset={-0.5}
          >
            {label}
          </Text>
        )}
      </group>
    </group>
  );
}

/** Định nghĩa màu/nhãn mỗi phím */
type KeyDef = { color: string; label?: string };

const palette = {
  js: "#F1A93A",
  ts: "#2F91F3",
  react: "#61dafb",
  tailwind: "#38bdf8",
  three: "#6e6ef7",
  git: "#24292e",
  node: "#78b75a",
  red: "#ee4b4b",
  orange: "#f59e0b",
  cyan: "#22d3ee",
  green: "#22c55e",
  blue: "#3b82f6",
  gray: "#64748b",
};

const layout: KeyDef[][] = [
  [
    { color: palette.js, label: "JS" },
    { color: palette.ts, label: "TS" },
    { color: palette.tailwind, label: "TW" },
    { color: palette.node, label: "N" },
    { color: palette.git, label: "" },
  ],
  [
    { color: palette.red, label: "H" },
    { color: palette.cyan, label: "R3F" },
    { color: palette.three, label: "3" },
    { color: palette.green, label: "AWS" },
    { color: palette.orange, label: "Py" },
  ],
  [
    { color: palette.gray, label: "ex" },
    { color: palette.react, label: "⚛︎" },
    { color: palette.blue, label: "D" },
    { color: palette.green, label: "V" },
    { color: palette.gray, label: ">" },
  ],
];

/**
 * TÍNH TOẠ ĐỘ LƯỚI CĂN GIỮA TRONG HỆ CỦA NHÓM BÀN PHÍM (đã xoay)
 */
function Keyboard() {
  const keys = useMemo(() => {
    const items: { pos: [number, number, number]; def: KeyDef }[] = [];
    const spacing = 1.2;
    const rows = layout.length;
    for (let r = 0; r < rows; r++) {
      const cols = layout[r].length;
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacing; // căn giữa ngang
        const y = (rows / 2 - r) * spacing; // hàng trên y dương
        items.push({ pos: [x, y, 0], def: layout[r][c] }); // z=0: cùng mặt phẳng
      }
    }
    return items;
  }, []);

  return (
    <group>
      {keys.map((k, i) => (
        <Keycap
          key={i}
          color={k.def.color}
          label={k.def.label}
          position={k.pos}
        />
      ))}
    </group>
  );
}

/**
 * SCENE CHÍNH
 * - Nhóm <group rotation={...}> định nghĩa mặt phẳng bàn phím (XY local của nhóm)
 * - Nhấn phím = dịch theo trục Z của NHÓM NÀY => vuông góc mặt phẳng
 */
export default function Keyboard3D() {
  return (
    <div className="h-screen w-full bg-black text-white">
      <div className="absolute inset-x-0 top-6 text-center select-none">
        <h1 className="text-4xl font-bold tracking-wider opacity-90">SKILLS</h1>
        <p className="text-sm opacity-60">(hover: lún xuống)</p>
      </div>

      <Canvas camera={{ position: [0, -5.5, 8], fov: 40 }}>
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
        <mesh
          position={[0, 0, -0.5]}
          rotation={[-Math.PI / 4, 0, -Math.PI / 16]}
        >
          <boxGeometry args={[9, 6, 0.4]} />
          <meshStandardMaterial color="#0f1115" roughness={0.8} />
        </mesh>

        {/* NHÓM BÀN PHÍM: XOAY ĐỂ ĐỊNH NGHĨA MẶT PHẲNG */}
        <group rotation={[-Math.PI / 4, 0, -Math.PI / 16]}>
          {/* <axesHelper args={[2]} /> // bật lên nếu muốn kiểm tra hướng trục */}
          <Keyboard />
        </group>

        <Environment preset="city" />
        <OrbitControls enablePan={false} minDistance={6} maxDistance={14} />
      </Canvas>
    </div>
  );
}
