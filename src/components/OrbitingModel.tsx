// OrbitingModel.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  url: string;
  radius?: number; // bán kính quỹ đạo
  speed?: number; // tốc độ góc (rad/giây, >0 là thuận)
  direction?: 1 | -1; // 1 = thuận, -1 = ngược
  bobAmp?: number; // biên độ nhún
  bobSpeed?: number; // tốc độ nhún
  scale?: number;
  phase?: number; // lệch pha ban đầu
  tilt?: number; // nghiêng model
  selfRotate?: number; // tự quay quanh Y
  center?: [number, number, number]; // tâm quỹ đạo
};

export default function OrbitingModel({
  url,
  radius = 9,
  speed = 0.25,
  direction = 1, // 👈 thêm
  bobAmp = 1.2,
  bobSpeed = 0.6,
  scale = 0.28,
  phase = 0,
  tilt = 0.2,
  selfRotate = 0.6,
  center = [0.5, 1.6, -1.8],
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const angle = useRef(phase); // 👈 cộng dồn góc ở đây
  const tAccum = useRef(0);
  const { scene } = useGLTF(url);

  scene.traverse((o: any) => (o.frustumCulled = false));

  useFrame((_, delta) => {
    // tăng/giảm góc theo delta, có direction để đảo chiều rõ ràng
    angle.current += speed * direction * delta;

    tAccum.current += delta;
    const [cx, cy, cz] = center;

    // ellipse nhẹ để đẹp mắt
    const x = cx + Math.cos(angle.current) * radius;
    const z = cz + Math.sin(angle.current) * radius * 0.85;
    const y = cy + Math.sin(tAccum.current * bobSpeed + phase) * bobAmp;

    group.current.position.set(x, y, z);
    group.current.lookAt(cx, cy, cz);
    group.current.rotation.z += (tilt - group.current.rotation.z) * 0.08;

    if (group.current.children[0]) {
      (group.current.children[0] as THREE.Object3D).rotation.y =
        tAccum.current * selfRotate;
    }
  });

  return (
    <group ref={group} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// preload (tuỳ chọn)
useGLTF.preload("/models/cosmonaut.glb");
