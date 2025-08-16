/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Canvas,
  extend,
  useFrame,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  useGLTF,
  useTexture,
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RigidBodyApi,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

// 🧩 GLB trong /public
const cardGLB = "/models/card.glb";
// 🧩 Banner (dùng khi GLB không có map)
import lanyard from "/banner2.png";

// Cho meshline hoạt động trong JSX
extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: React.DetailedHTMLProps<React.HTMLAttributes<any>, any>;
      meshLineMaterial: React.DetailedHTMLProps<
        React.HTMLAttributes<any>,
        any
      > & {
        color?: string;
        lineWidth?: number;
        useMap?: boolean;
        map?: any;
        repeat?: [number, number] | THREE.Vector2;
        depthTest?: boolean;
        resolution?: [number, number] | THREE.Vector2;
      };
    }
  }
}

// GLTF: hỗ trợ 2 mặt (front/back) + fallback base (file cũ)
type CardGLTF = GLTF & {
  nodes: {
    card: any; // có thể là Mesh hoặc Group (nhiều primitive)
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    front?: THREE.MeshPhysicalMaterial & { map?: THREE.Texture };
    back?: THREE.MeshPhysicalMaterial & { map?: THREE.Texture };
    metal: THREE.MeshStandardMaterial;
    base?: THREE.MeshPhysicalMaterial & { map?: THREE.Texture }; // fallback file cũ
  };
};

type LanyardProps = {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
};

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
}: LanyardProps) {
  return (
    <div className="relative z-0 w-full h-screen flex justify-center items-center transform scale-100 origin-center">
      <Canvas
        camera={{ position, fov }}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={1 / 60}>
          <Band />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
}: {
  maxSpeed?: number;
  minSpeed?: number;
}) {
  const band = useRef<THREE.Mesh | null>(null);
  const fixed = useRef<RigidBodyApi | null>(null);
  const j1 = useRef<RigidBodyApi | null>(null);
  const j2 = useRef<RigidBodyApi | null>(null);
  const j3 = useRef<RigidBodyApi | null>(null);
  const card = useRef<RigidBodyApi | null>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    type: "dynamic" as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  const { nodes, materials } = useGLTF(cardGLB) as unknown as CardGLTF;

  // Texture dự phòng
  const texture = useTexture(lanyard);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;

  // Lấy 2 material mặt trước/sau (fallback base nếu file cũ)
  const matFront = (materials.front ?? materials.base) as
    | (THREE.MeshPhysicalMaterial & { map?: THREE.Texture })
    | undefined;
  const matBack = (materials.back ?? materials.base) as
    | (THREE.MeshPhysicalMaterial & { map?: THREE.Texture })
    | undefined;

  // Ưu tiên map từ GLB; nếu không có → dùng banner
  const cardTexture = (matFront?.map as THREE.Texture | undefined) ?? texture;

  // Đồng bộ 2 mặt: map + DoubleSide
  useEffect(() => {
    [matFront, matBack].forEach((m) => {
      if (!m) return;
      if (!m.map) m.map = cardTexture;
      m.map.anisotropy = 16;
      m.map.needsUpdate = true;
      m.side = THREE.DoubleSide;
    });
  }, [matFront, matBack, cardTexture]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, setDragged] = useState<false | THREE.Vector3>(false);
  const [hovered, setHovered] = useState(false);
  const [isSmall, setIsSmall] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  // ⚠️ Nếu origin của `card` đã nằm ở lỗ móc trong Blender → đổi [0,1.5,0] thành [0,0,0]
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  useEffect(() => {
    const handleResize = () => setIsSmall(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useFrame((state: RootState, delta: number) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (
      fixed.current &&
      j1.current &&
      j2.current &&
      j3.current &&
      card.current
    ) {
      [j1, j2].forEach((ref) => {
        const api = ref.current!;
        const anyApi = api as any;
        if (!anyApi.lerped)
          anyApi.lerped = new THREE.Vector3().copy(api.translation());
        const lerped: THREE.Vector3 = anyApi.lerped;
        const dist = lerped.distanceTo(api.translation());
        const clamped = Math.max(0.1, Math.min(1, dist));
        lerped.lerp(
          api.translation(),
          delta * (minSpeed + clamped * (maxSpeed - minSpeed))
        );
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy((j2.current as any).lerped as THREE.Vector3);
      curve.points[2].copy((j1.current as any).lerped as THREE.Vector3);
      curve.points[3].copy(fixed.current.translation());
      if (band.current?.geometry && (band.current.geometry as any).setPoints) {
        (band.current.geometry as any).setPoints(curve.getPoints(32));
      }

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const onPointerOver = () => setHovered(true);
  const onPointerOut = () => setHovered(false);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    (e.target as any)?.setPointerCapture?.(e.pointerId);
    const current = card.current?.translation();
    if (current) {
      setDragged(
        new THREE.Vector3()
          .copy(e.point)
          .sub(vec.set(current.x, current.y, current.z))
      );
    }
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    (e.target as any)?.releasePointerCapture?.(e.pointerId);
    setDragged(false);
  };

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
          >
            {/* Nếu file import trả về Group (nhiều primitive: front/back) */}
            {!(nodes.card as any).isMesh ? (
              <primitive object={nodes.card} />
            ) : (
              // Nếu là Mesh đơn, vẫn render bình thường
              <mesh geometry={(nodes.card as THREE.Mesh).geometry}>
                <meshPhysicalMaterial
                  map={cardTexture}
                  clearcoat={1}
                  clearcoatRoughness={0.15}
                  roughness={0.9}
                  metalness={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              /* @ts-expect-error */ material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      <mesh ref={band as React.MutableRefObject<THREE.Mesh>}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isSmall ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

// Preload GLB
useGLTF.preload(cardGLB);
