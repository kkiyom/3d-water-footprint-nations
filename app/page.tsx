"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useTexture, RenderTexture, Text } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const BASE_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? '';

const SCREEN_IMAGES: Record<string, string> = {
  screen2: `${BASE_URL}/Waterballsphoto.png`,
  screen3: `${BASE_URL}/Ball.png`,
  screen7: "",
};

const SCREEN_SIZES: Record<string, number> = {
  screen2: 20,
  screen3: 40,
  screen7: 40,
};

const SCREEN_PARAMS: Record<string, { direction: 1 | -1; speed: number; y: number }> = {
  screen1: { direction: -1, speed: 8, y: 0 },
  screen4: { direction: 1, speed: 5.5, y: 20 },
  screen5: { direction: -1, speed: 6, y: 0 },
  screen6: { direction: 1, speed: 6, y: 20 },
  screen8: { direction: -1, speed: 8, y: -20 },
};

const ROUTE_MAP: Record<string, string> = {
  screen2: "/waterfootprint",
  screen3: "/soccerball",
};

function FlowingText({
  text,
  speed = 6,
  loop = 800,
  direction = -1, // -1: 右→左, +1: 左→右
  phase = 0,      // 開始タイミングずらし
}: {
  text: string;
  speed?: number;
  loop?: number;
  direction?: 1 | -1;
  phase?: number;
}) {
  const textRef = useRef<any>(null);

  useFrame((state) => {
    if (!textRef.current) return;
    const t = state.clock.elapsedTime + phase;
    const v = (t * speed) % loop;
    const x = direction === -1
      ? (loop / 2) - v
      : -(loop / 2) + v;
    textRef.current.position.x = x;
  });

  return (
    <Text
      ref={textRef}
      font={`${BASE_URL}/Silkscreen-Regular.ttf`}
      fontSize={12}
      letterSpacing={-0.08}
      position={[0, 0, 0]}
      color="black"
      anchorX="left"
      anchorY="middle"
      rotation-y={Math.PI}
    >
      {text}
    </Text>
  );
}

function CameraRig() {
  useFrame((state) => {
    const { camera, pointer } = state;
    camera.position.x = 70 + pointer.x * 0.8;
    camera.position.y = 4 + pointer.y * 0.3;
    camera.lookAt(0, 5, 0);
  });

  return null;
}

function ScreenImageFlicker({ url, size = 40 }: { url: string; size?: number }) {
  const texture = useTexture(url);
  const materialRef = useRef<any>(null);
  const glitchTimer = useRef(0);
  const glitchActive = useRef(false);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const t = state.clock.elapsedTime;

    glitchTimer.current -= delta;
    if (glitchTimer.current <= 0) {
      glitchActive.current = !glitchActive.current;
      glitchTimer.current = glitchActive.current
        ? 0.05 + Math.random() * 0.15
        : 1.5 + Math.random() * 4.0;
    }

    const base = 0.2 + Math.sin(t * 3.5) * 0.06;
    const noise = (Math.random() - 0.5) * 0.04;

    if (glitchActive.current) {
      texture.offset.x = (Math.random() - 0.5) * 0.08;
      texture.offset.y += (Math.random() - 0.5) * 0.03;
      const blackout = Math.random() > 0.85 ? 0 : 1;
      const burst = 0.7 + Math.random() * 0.3;
      materialRef.current.opacity = blackout * burst;
      materialRef.current.color.setScalar(0.9 + Math.random() * 0.4);
    } else {
      texture.offset.x *= 0.85;
      texture.offset.y *= 0.98;
    }
  });

  return (
    <>
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[size, size] as [number, number]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -4.9]}>
        <planeGeometry args={[size, size] as [number, number]} />
        <meshBasicMaterial transparent opacity={0.08} color="black" />
      </mesh>
    </>
  );
}

function Model() {
  const router = useRouter();
  const { scene } = useGLTF(`${BASE_URL}/ComputersRevenge2.glb`) as any;

  const cloned = useMemo(() => scene.clone(true), [scene]);

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    const name = e.object?.name as string | undefined;
    if (!name) return;
    if (ROUTE_MAP[name]) router.push(ROUTE_MAP[name]);
  };

  return (
    <>
      <primitive object={cloned} onPointerDown={onPointerDown} />
      {["screen1", "screen2", "screen3", "screen4", "screen5", "screen6", "screen7", "screen8", "tv1_2_1", "tv2_2_1", "tv3_2_1"].map((n) => (
        <ScreenOverlay key={n} scene={cloned} targetName={n} />
      ))}
    </>
  );
}


type ScreenInfo = {
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  quat: [number, number, number, number];
  scl: [number, number, number];
};

function ScreenOverlay({ scene, targetName }: { scene: THREE.Object3D, targetName: string }) {
  const [info, setInfo] = useState<ScreenInfo | null>(null);
  const overlayRef = useRef<THREE.Mesh>(null);
  const isTV = ["tv1_2_1", "tv2_2_1", "tv3_2_1"].includes(targetName);
  const tvMap = useTVTexture(targetName, isTV);
  const screenParams = SCREEN_PARAMS[targetName] ?? { direction: -1 as const, speed: 6, y: 0 };
  const bgRef = useRef<any>(null);

  useFrame((state) => {
    if (!bgRef.current) return;

    if (!SCREEN_IMAGES[targetName]) {
      bgRef.current.color.setRGB(0.06 * 2, 0.55 * 2, 0.3 * 2);
      return;
    }

    const t = state.clock.elapsedTime;
    const base = 0.35 + Math.sin(t * 3.5) * 0.02;
    const spike = Math.random() > 0.995 ? Math.random() * 0.8 - 0.1 : 0;
    const noise = (Math.random() - 0.5) * 0.08;
    const intensity = Math.max(0.1, Math.min(1.0, base + spike + noise));
    bgRef.current.color.setRGB(0.06 * 2 * intensity, 0.55 * 2 * intensity, 0.3 * 2 * intensity);
  });

  useEffect(() => {
    const root: any = scene;
    if (!root?.getObjectByName) return;

    const obj: any = root.getObjectByName(targetName);
    if (!obj) return;

    let mesh: any = obj?.isMesh ? obj : null;

    if (!mesh && obj?.traverse) {
      obj.traverse((c: any) => {
        if (!mesh && c?.isMesh) mesh = c;
      });
    }
    if (!mesh?.geometry) return;

    mesh.updateWorldMatrix(true, false);

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    mesh.getWorldPosition(p);
    mesh.getWorldQuaternion(q);
    mesh.getWorldScale(s);

    setInfo({
      geo: mesh.geometry as THREE.BufferGeometry,
      pos: [p.x, p.y, p.z],
      quat: [q.x, q.y, q.z, q.w],
      scl: [s.x, s.y, s.z],
    });
  }, [scene, targetName]);

  if (!info) return null;

  return (
    <mesh
      ref={overlayRef}
      name={targetName}
      geometry={info.geo}
      position-x={info.pos[0]}
      position-y={info.pos[1]}
      position-z={info.pos[2]}
      quaternion-x={info.quat[0]}
      quaternion-y={info.quat[1]}
      quaternion-z={info.quat[2]}
      quaternion-w={info.quat[3]}
      scale-x={info.scl[0]}
      scale-y={info.scl[1]}
      scale-z={info.scl[2]}
    >
      {isTV ? (
        <meshBasicMaterial
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          side={THREE.DoubleSide}
          map={tvMap}
        />
      ) : (
        <meshBasicMaterial
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          side={THREE.DoubleSide}
        >
          <RenderTexture attach="map" width={512} height={512} anisotropy={8}>
            <PerspectiveCamera makeDefault manual aspect={1} position={[0, 0, 15]} />
            <color attach="background" args={["#000"]} />
            <mesh position={[0, 0, -5]}>
              <planeGeometry args={[200, 200]} />
              <meshBasicMaterial
                ref={bgRef}
                toneMapped={false}
                color={[0.06 * 2, 0.55 * 2, 0.3 * 2]}
              />
            </mesh>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} />
            {SCREEN_IMAGES[targetName] ? (
              <ScreenImageFlicker
                url={SCREEN_IMAGES[targetName]}
                size={SCREEN_SIZES[targetName] ?? 40}
              />
            ) : (
              <FlowingText
                text="Whereas recognition of the inherent dignity"
                direction={screenParams.direction}
                speed={screenParams.speed} />
            )}
          </RenderTexture>
        </meshBasicMaterial>
      )}
    </mesh>
  );
}

//貼るパターン
function useTVTexture(tvName: string, isTV: boolean) {
  const { ctx, tex } = useMemo(() => {
    if (!isTV || typeof document === "undefined") {
      return { ctx: null as any, tex: null as any };
    }
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.flipY = false;
    return { ctx, tex };
  }, [isTV]);

  useFrame((state) => {
    if (!ctx || !tex) return;

    const t = state.clock.elapsedTime;

    ctx.fillStyle = "#101530";
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = "#cc2222";
    ctx.fillRect(0, 0, 512, 56);

    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 460, 512, 52);

    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";

    ctx.font = "18px monospace";
    const channel =
      tvName === "tv1_2_1" ? "CHANNEL 01" : tvName === "tv2_2_1" ? "CHANNEL 02" : "CHANNEL 03";
    ctx.fillText(channel, 16, 28);

    const mm = String(Math.floor(t / 60) % 60).padStart(2, "0");
    const ss = String(Math.floor(t) % 60).padStart(2, "0");
    const ff = String(Math.floor((t * 30) % 30)).padStart(2, "0");
    ctx.font = "16px monospace";
    ctx.fillText(`PLAY  ${mm}:${ss}:${ff}`, 16, 438);

    const headline =
      tvName === "tv1_2_1"
        ? "BREAKING: WATER FOOTPRINTS RISE"
        : tvName === "tv2_2_1"
          ? "UPDATE: SUPPLY CHAINS UNDER PRESSURE"
          : "LIVE: TRACEABILITY & TRANSPARENCY";

    ctx.font = "64px monospace";
    const text = headline + "   ";
    const w = ctx.measureText(text).width;

    const speed = 90;
    const x = 512 - ((t * speed) % (w + 512));
    const y = 260;

    ctx.fillText(text, x, y);
    ctx.fillText(text, x + w + 512, y);

    tex.needsUpdate = true;
  });

  return tex;
}

useGLTF.preload(`${BASE_URL}/ComputersRevenge2.glb`);

export default function Page() {
  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [20, 20, 20], fov: 10, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#111"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />

        <Suspense fallback={null}>
          <OrbitControls
            enableZoom={true}
            maxPolarAngle={Math.PI / 2}
          />
          <Model />
          <CameraRig />
          <EffectComposer>
            <Bloom
              intensity={1}
              luminanceThreshold={0.25}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </main>
  );
}
