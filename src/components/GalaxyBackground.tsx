// GalaxyBackground.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  count?: number; // số sao cố định
  radius?: number; // bán kính “vũ trụ”
  twist?: number; // độ xoáy hình đĩa (0–1)
  rotSpeed?: number; // tốc độ quay toàn trường
  jitter?: number; // biên độ rung nhẹ tại chỗ
};

export default function GalaxyBackground({
  count = 4000,
  radius = 60,
  twist = 0.55,
  rotSpeed = 0.03,
  jitter = 0.0009,
}: Props) {
  // tạo sao 1 lần
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // phân bố nghiêng về mặt phẳng XZ để giống dải ngân hà (y nhỏ hơn)
      const r = radius * Math.pow(Math.random(), 0.6); // nhiều sao gần tâm hơn
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2 - 1) * (radius * 0.15); // dải mỏng theo trục Y
      const spiral = 1 + twist * (r / radius); // xoáy nhẹ
      const x = r * Math.cos(theta * spiral);
      const z = r * Math.sin(theta * spiral);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count, radius, twist]);

  const geomRef = useRef<THREE.BufferGeometry>(null);
  const timeRef = useRef(0);

  useFrame((_, dt) => {
    timeRef.current += dt;
    const g = geomRef.current;
    if (!g) return;

    // quay toàn trường quanh trục Y → chuyển động nhẹ, không respawn
    g.rotateY(rotSpeed * dt);

    // rung cực nhẹ để “lấp lánh” nhưng không trôi khỏi vị trí (giữ số lượng cố định)
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      // noise nhỏ theo thời gian
      const jx = Math.sin(timeRef.current * 0.6 + ix) * jitter;
      const jy = Math.cos(timeRef.current * 0.5 + ix) * jitter * 0.6;
      const jz = Math.sin(timeRef.current * 0.4 + ix) * jitter;
      pos.setXYZ(
        i,
        positions[ix + 0] + jx,
        positions[ix + 1] + jy,
        positions[ix + 2] + jz
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points renderOrder={-10}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        depthWrite={false}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        color="#ffffff"
      />
    </points>
  );
}
