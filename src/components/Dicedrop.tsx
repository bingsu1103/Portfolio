import React, { useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, RoundedBox } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

// ---- Dice drawing helpers --------------------------------------------------
function drawDieFace(n: number, size = 256): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Slight inset border for a nicer look
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = size * 0.04;
  ctx.strokeRect(
    ctx.lineWidth / 2,
    ctx.lineWidth / 2,
    size - ctx.lineWidth,
    size - ctx.lineWidth
  );

  // Pip positions (normalized)
  const p = [0.2, 0.5, 0.8];
  const mapping: Record<number, [number, number][]> = {
    1: [[p[1], p[1]]],
    2: [
      [p[0], p[0]],
      [p[2], p[2]],
    ],
    3: [
      [p[0], p[0]],
      [p[1], p[1]],
      [p[2], p[2]],
    ],
    4: [
      [p[0], p[0]],
      [p[0], p[2]],
      [p[2], p[0]],
      [p[2], p[2]],
    ],
    5: [
      [p[0], p[0]],
      [p[0], p[2]],
      [p[1], p[1]],
      [p[2], p[0]],
      [p[2], p[2]],
    ],
    6: [
      [p[0], p[0]],
      [p[0], p[1]],
      [p[0], p[2]],
      [p[2], p[0]],
      [p[2], p[1]],
      [p[2], p[2]],
    ],
  };

  // Draw pips
  ctx.fillStyle = "#111827";
  const r = size * 0.07;
  for (const [nx, ny] of mapping[n]) {
    ctx.beginPath();
    ctx.arc(nx * size, ny * size, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

function useDiceMaterials() {
  return useMemo(() => {
    const faces = [3, 4, 1, 6, 2, 5]; // +X,-X,+Y,-Y,+Z,-Z (opposites sum to 7)
    const mats = faces.map((num) => {
      const tex = new THREE.CanvasTexture(drawDieFace(num));
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: tex });
    });
    return { materials: mats, faceMap: faces };
  }, []);
}

// ---- Invisible Ground Collider (no visible plane) --------------------------
function InvisibleGround() {
  return (
    <RigidBody type="fixed" restitution={0.3} friction={1} colliders={false}>
      <CuboidCollider args={[15, 0.1, 15]} position={[0, -0.05, 0]} />
    </RigidBody>
  );
}

// ---- Dice Component ---------------------------------------------------------
function Dice({
  onSettled,
  onDespawn,
}: {
  onSettled: (value: number) => void;
  onDespawn: () => void;
}) {
  const body = useRef<RigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { materials, faceMap } = useDiceMaterials();

  // On mount: appear in mid-air, spin fast with gravity off for ~1.2s, then drop
  React.useEffect(() => {
    const b = body.current;
    if (!b) return;
    const startPos = {
      x: (Math.random() - 0.5) * 1.5,
      y: 6,
      z: (Math.random() - 0.5) * 1.5,
    };
    b.setTranslation(startPos, true);
    b.setRotation(
      {
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        w: Math.random(),
      },
      true
    );
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    b.setAngvel(
      {
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
      },
      true
    );
    b.setGravityScale(0, true);
    const t = setTimeout(() => {
      b.setGravityScale(1, true); // start falling
      // add a tiny shove for variety
      b.applyImpulse(
        {
          x: (Math.random() - 0.5) * 1.5,
          y: -0.2,
          z: (Math.random() - 0.5) * 1.5,
        },
        true
      );
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Detect settle & compute top face
  const settleFramesRef = useRef(0);
  const settledRef = useRef(false);

  useFrame(() => {
    const b = body.current;
    if (!b || settledRef.current) return;
    const v = b.linvel();
    const w = b.angvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    const spin = Math.hypot(w.x, w.y, w.z);
    if (speed < 0.05 && spin < 0.2) settleFramesRef.current += 1;
    else settleFramesRef.current = 0;

    if (settleFramesRef.current > 30) {
      settledRef.current = true;
      // figure out which face is up
      const r = b.rotation();
      const q = new THREE.Quaternion(r.x, r.y, r.z, r.w);
      const up = new THREE.Vector3(0, 1, 0);
      const normals = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ];
      let bestIdx = 0;
      let bestDot = -Infinity;
      normals.forEach((n, i) => {
        const worldN = n.clone().applyQuaternion(q);
        const d = worldN.dot(up);
        if (d > bestDot) {
          bestDot = d;
          bestIdx = i;
        }
      });
      const value = faceMap[bestIdx];
      onSettled(value);
      // Despawn after ~3s
      setTimeout(onDespawn, 3000);
    }
  });

  return (
    <RigidBody
      ref={body}
      restitution={0.4}
      friction={0.9}
      linearDamping={0.25}
      angularDamping={0.25}
      colliders={false}
    >
      {/* Rounded cube with per-face materials */}
      <RoundedBox
        args={[1, 1, 1]}
        radius={0.12}
        smoothness={6}
        castShadow
        receiveShadow
        material={materials as any}
      />
      {/* Collider approximates the rounded box */}
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
    </RigidBody>
  );
}

// ---- Main exported component ----------------------------------------------
export default function DiceDrop() {
  const [rollKey, setRollKey] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showDice, setShowDice] = useState(false);

  const handleRoll = useCallback(() => {
    setResult(null);
    setRolling(true);
    setShowDice(true);
    setRollKey((k) => k + 1);
  }, []);

  return (
    <div
      className="w-full h-[100vh] relative"
      style={{ background: "transparent" }}
    >
      {/* UI overlay */}
      <div className="absolute z-10 top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button
          onClick={handleRoll}
          className="px-4 py-2 rounded-2xl shadow text-white bg-black hover:opacity-90 active:opacity-80"
        >
          Thả xúc xắc
        </button>
        <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur shadow border border-slate-200 text-sm">
          {rolling && result == null && "Đang lắc…"}
          {!rolling && result == null && !showDice && "Nhấn nút để thả"}
          {result != null && `Kết quả: ${result}`}
        </div>
      </div>

      <Canvas
        gl={{ alpha: true }}
        shadows
        camera={{ position: [4, 5, 6], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Physics gravity={[0, -9.81, 0]}>
          <InvisibleGround />
          {showDice && (
            <Dice
              key={rollKey}
              onSettled={(v) => {
                setResult(v);
                setRolling(false);
              }}
              onDespawn={() => {
                setShowDice(false);
              }}
            />
          )}
        </Physics>

        <OrbitControls enablePan enableZoom />

        {/* Subtle origin helper (hidden, but keep for dev): */}
        {/* <Html position={[0, 0.01, 0]} center>
          <div style={{ fontSize: 12, color: "#64748b" }}>Sàn (ẩn)</div>
        </Html> */}
      </Canvas>
    </div>
  );
}
