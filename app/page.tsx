"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useTexture, RenderTexture, Text } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

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

    // 0..loop を回す
    const v = (t * speed) % loop;

    // directionで左右を反転
    const x = direction === -1
      ? (loop / 2) - v          // 右→左
      : -(loop / 2) + v;        // 左→右

    textRef.current.position.x = x;
  });

  return (
    <Text
      ref={textRef}
      font="/Silkscreen-Regular.ttf"
      fontSize={12}          // ← 小さく
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
// function FlowingText({ text }: { text: string }) {
//   const textRef = useRef<any>(null);
//   const SPEED = 6;   // 速さ
//   const LOOP = 800;   // ループ幅（固定）

//   useFrame((state) => {
//     if (!textRef.current) return;
//     const t = state.clock.elapsedTime;
//     const x = (LOOP / 2) - ((t * SPEED) % LOOP); // 右→左
//     textRef.current.position.x = x;
//   });

//   return (
//     <Text
//       ref={textRef}
//       font="/Silkscreen-Regular.ttf"
//       fontSize={12}
//       letterSpacing={-0.099}
//       position={[0, 0, 0]}
//       color="black"
//       anchorX="left"
//       anchorY="middle"
//       rotation-y={Math.PI}
//     >
//       {text}
//     </Text>
//   );
// }

function CameraRig() {
  // “固定だけどマウスで少し動く” カメラ
  useFrame((state) => {
    const { camera, pointer } = state;

    // ここで「どれくらい動くか」を調整
    camera.position.x = 70 + pointer.x * 0.8;
    camera.position.y = 4 + pointer.y * 0.3;
    camera.lookAt(0, 5, 0);
  });

  return null;
}
function ScreenImageFlicker({ url }: { url: string }) {
  const texture = useTexture(url);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (!materialRef.current) return;

    const t = state.clock.elapsedTime;

    // チラチラ
    const flicker = 0.85 + Math.random() * 0.2;
    materialRef.current.opacity = flicker;

    // 少しだけ明るさ変化
    materialRef.current.color.setScalar(0.9 + Math.random() * 0.1);
  });

  return (
    <>
      {/* 画像 */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* スキャンライン */}
      <mesh position={[0, 0, -4.9]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          transparent
          opacity={0.08}
          color="black"
        />
      </mesh>
    </>
  );
}

function Model() {
  const router = useRouter();
  const { scene, nodes } = useGLTF("/ComputersRevenge2.glb") as any;

  // scene を安全に触るため clone（material差し替えなどの副作用を避ける）
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // screenっぽいメッシュ一覧をconsoleに出す（取得できてるか確認用）
  useEffect(() => {
    const names: string[] = [];
    cloned.traverse((obj: any) => {
      if (obj?.isMesh && typeof obj.name === "string") {
        if (obj.name.toLowerCase().includes("screen")) names.push(obj.name);
      }
    });
  }, [cloned]);

  // @ts-ignore threeの型がうるさいので軽く無視
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  mat.map = null;

  // クリックでページへ
  const onPointerDown = (e: any) => {
    e.stopPropagation();
    const name = e.object?.name as string | undefined;
    if (!name) return;

    console.log("clicked:", name);

    const routes: Record<string, string> = {
      screen2: "/waterfootprint",
      screen3: "/soccerball",
    };

    if (routes[name]) router.push(routes[name]);
  };

  return (
    <>
      <primitive object={cloned} onPointerDown={onPointerDown} />
      {["screen1", "screen4", "screen5", "screen6", "screen8", "tv1_2_1", "tv2_2_1", "tv3_2_1"].map((n) => (
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

/** ---------- 型ガード: Object3D -> Mesh ---------- */
function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return (obj as any)?.isMesh === true;
}

function ScreenOverlay({ scene, targetName }: { scene: THREE.Object3D, targetName: string }) {
  const [info, setInfo] = useState<ScreenInfo | null>(null);
  const overlayRef = useRef<THREE.Mesh>(null);
  const screenImages: Record<string, string> = {
    screen2: "/Ball.png",
    screen4: "/Ball.png",
    screen7: "/Ball.png",
  };
  const isTV = ["tv1_2_1", "tv2_2_1", "tv3_2_1"].includes(targetName);
  const tvMap = useTVTexture(targetName, isTV);
  const screenParamsMap: Record<
    string,
    { direction: 1 | -1; speed: number; y: number }
  > = {
    screen1: { direction: -1, speed: 8, y: 0 },
    screen4: { direction: 1, speed: 5.5, y: 20 },
    screen5: { direction: -1, speed: 6, y: 0 },
    screen6: { direction: 1, speed: 6, y: 20 },
    screen8: { direction: -1, speed: 8, y: -20 },
  };
  const screenParams = screenParamsMap[targetName] ?? { direction: -1, speed: 6, y: 0 };

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as any).isMesh && obj.name.toLowerCase().includes("tv")) {
        console.log("TV mesh:", obj.name);
      }
    });
  }, [scene, targetName]);

  useEffect(() => {
    const root: any = scene; // ★ここが重要（never回避）
    if (!root?.getObjectByName) return;

    // 1) 名前のオブジェクトを取得（MeshでもEmptyでもOK）
    const obj: any = root.getObjectByName(targetName);
    if (!obj) return;

    // 2) Mesh を確定（tv3みたいに親がEmptyなら子Meshを拾う）
    let mesh: any = obj?.isMesh ? obj : null;

    if (!mesh && obj?.traverse) {
      obj.traverse((c: any) => {
        if (!mesh && c?.isMesh) mesh = c;
      });
    }
    if (!mesh?.geometry) return;

    // 3) ワールド行列更新（any経由）
    mesh.updateWorldMatrix(true, false);

    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    mesh.getWorldPosition(p);
    mesh.getWorldQuaternion(q);
    mesh.getWorldScale(s);

    const uv = (mesh.geometry as THREE.BufferGeometry).attributes.uv as THREE.BufferAttribute;
    if (uv) {
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      console.log(targetName, "uv range:", { minU, maxU, minV, maxV });
    }

    setInfo({
      geo: mesh.geometry as THREE.BufferGeometry,
      pos: [p.x, p.y, p.z],
      quat: [q.x, q.y, q.z, q.w],
      scl: [s.x, s.y, s.z],
    });
  }, [scene, targetName]);

  useEffect(() => {
    if (!info) return;
    // requestAnimationFrame を挟むと「refが確実に入った後」に走る
    requestAnimationFrame(() => {
      const m = overlayRef.current;
      if (!m) {
        console.warn("overlayRef.current がまだ null（描画されてない）");
        return;
      }

    });
  }, [info]);

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
        // ✅ TV：CanvasTexture を map に直貼り（RenderTextureは使わない）
        <meshBasicMaterial
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          side={THREE.DoubleSide}
          map={tvMap}
        />
      ) : (
        // ✅ screen：今まで通り RenderTexture
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
                toneMapped={false}
                color={[0.06 * 2, 0.55 * 2, 0.3 * 2]}
              />
            </mesh>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} />
            {screenImages[targetName] ? (
              <ScreenImageFlicker url={screenImages[targetName]} />
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

function VHSNoiseTV({ seed = 0 }: { seed?: number }) {
  const planeRef = useRef<THREE.Mesh>(null);

  // 64x64のノイズを毎フレ更新（軽い）
  const noiseTex = useMemo(() => {
    const w = 64, h = 64;
    const data = new Uint8Array(w * h * 4);
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    (tex as any).userData = { data, w, h };
    return tex;
  }, []);

  useFrame((state) => {
    const ud = (noiseTex as any).userData;
    if (!ud) return;
    const { data, w, h } = ud;

    // ノイズ更新
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + 0.15 * Math.sin(t * 18 + seed);
    for (let i = 0; i < w * h; i++) {
      const v = Math.floor((Math.random() * 255) * flicker);
      const idx = i * 4;
      data[idx + 0] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
    noiseTex.needsUpdate = true;

    // ノイズが少し流れる感じ
    noiseTex.offset.x = (t * 0.12 + seed * 0.1) % 1;
    noiseTex.offset.y = (t * 0.35) % 1;

    // 微妙な揺れ
    if (planeRef.current) {
      planeRef.current.position.x = Math.sin(t * 2.2 + seed) * 0.06;
      planeRef.current.position.y = Math.sin(t * 3.1 + seed) * 0.03;
    }
  });

  return (
    <>
      {/* 背景（暗め） */}
      <mesh position={[0, 0, -6]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial toneMapped={false} color={[0.02, 0.02, 0.02]} />
      </mesh>

      {/* ノイズ面 */}
      <mesh ref={planeRef} position={[0, 0, -5]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          toneMapped={false}
          map={noiseTex}
          opacity={0.55}
          transparent
          color={[1, 1, 1]}
        />
      </mesh>

      {/* スキャンライン（薄い横線） */}
      <mesh position={[0, 0, -4.9]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          toneMapped={false}
          transparent
          opacity={0.18}
          color={[0.6, 0.6, 0.6]}
        />
      </mesh>

      {/* タイムコード */}
      <Timecode_TV seed={seed} />
    </>
  );
}

function Timecode_TV({ seed = 0 }: { seed?: number }) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + seed * 10;
    const mm = String(Math.floor(t / 60) % 60).padStart(2, "0");
    const ss = String(Math.floor(t) % 60).padStart(2, "0");
    const ff = String(Math.floor((t * 30) % 30)).padStart(2, "0");
    // troika-text は ref.current.text で更新OK
    ref.current.text = `PLAY  ${mm}:${ss}:${ff}`;
  });

  return (
    <Text
      ref={ref}
      frustumCulled={false}
      font="/Silkscreen-Regular.ttf"
      fontSize={10}
      position={[-90, -55, -4.5]}
      anchorX="left"
      anchorY="middle"
      color="white"
    >
      PLAY  00:00:00
    </Text>
  );
}

function NewsTV3_TV() {
  const headlines = [
    "BREAKING: WATER FOOTPRINTS RISE",
    "UPDATE: SUPPLY CHAINS UNDER PRESSURE",
    "FACT: COTTON IS WATER-INTENSIVE",
    "LIVE: ETHICAL PRODUCTION QUESTIONS",
    "NOW: TRACEABILITY & TRANSPARENCY",
  ];

  const [idx, setIdx] = useState(0);
  const textRef = useRef<any>(null);

  useEffect(() => {
    const id = setInterval(() => setIdx((v) => (v + 1) % headlines.length), 3000);
    return () => clearInterval(id);
  }, []);

  // ★ 200スケール想定：右(=90)→左へ流してループ
  useFrame((state) => {
    if (!textRef.current) return;
    const t = state.clock.elapsedTime;
    const speed = 35;     // 速度（大きい世界なので大きめ）
    const loop = 240;     // ループ幅
    textRef.current.position.x = 90 - ((t * speed) % loop);
  });

  return (
    <>
      {/* 背景 */}
      <mesh position={[0, 0, -6]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial toneMapped={false} color="#101530" />
      </mesh>

      {/* 上バー */}
      <mesh position={[0, 70, -5]}>
        <planeGeometry args={[200, 26]} />
        <meshBasicMaterial toneMapped={false} color="#cc2222" />
      </mesh>

      <Text
        frustumCulled={false}
        font="/Silkscreen-Regular.ttf"
        fontSize={12}
        position={[-90, 70, 1]}
        anchorX="left"
        anchorY="middle"
        color="white"
      >
        CHANNEL 03
      </Text>

      {/* ニュース見出し（流れる） */}
      <Text
        ref={textRef}
        frustumCulled={false}
        font="/Silkscreen-Regular.ttf"
        fontSize={14}
        position={[90, 5, -4.5]}
        anchorX="left"
        anchorY="middle"
        color="white"
      >
        {headlines[idx]}
      </Text>

      {/* 下バー */}
      <mesh position={[0, -80, -5]}>
        <planeGeometry args={[200, 22]} />
        <meshBasicMaterial toneMapped={false} color="#202020" />
      </mesh>

      <Text
        frustumCulled={false}
        font="/Silkscreen-Regular.ttf"
        fontSize={10}
        position={[-90, -80, -4.5]}
        anchorX="left"
        anchorY="middle"
        color="white"
      >
        LIVE • INFO FEED
      </Text>

      {/* タイムコード */}
      <Timecode_TV seed={3} />
    </>
  );
}

//貼るパターン
function useTVTexture(tvName: string, isTV: boolean) {
  const { ctx, tex } = useMemo(() => {
    if (typeof document === "undefined") {
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
  }, []);

  useFrame((state) => {
    if (!ctx || !tex) return;

    const t = state.clock.elapsedTime;

    // 背景
    ctx.fillStyle = "#101530";
    ctx.fillRect(0, 0, 512, 512);

    // 上バー
    ctx.fillStyle = "#cc2222";
    ctx.fillRect(0, 0, 512, 56);

    // 下バー
    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 460, 512, 52);

    // 文字（まずは確実に出る monospace）
    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";

    ctx.font = "18px monospace";
    const channel =
      tvName === "tv1_2_1" ? "CHANNEL 01" : tvName === "tv2_2_1" ? "CHANNEL 02" : "CHANNEL 03";
    ctx.fillText(channel, 16, 28);

    // タイムコード
    const mm = String(Math.floor(t / 60) % 60).padStart(2, "0");
    const ss = String(Math.floor(t) % 60).padStart(2, "0");
    const ff = String(Math.floor((t * 30) % 30)).padStart(2, "0");
    ctx.font = "16px monospace";
    ctx.fillText(`PLAY  ${mm}:${ss}:${ff}`, 16, 438);

    // ニュース（tvごとに変える）
    const headline =
      tvName === "tv1_2_1"
        ? "BREAKING: WATER FOOTPRINTS RISE"
        : tvName === "tv2_2"
          ? "UPDATE: SUPPLY CHAINS UNDER PRESSURE"
          : "LIVE: TRACEABILITY & TRANSPARENCY";

    // ticker
    ctx.font = "64px monospace";
    const text = headline + "   ";
    const w = ctx.measureText(text).width;

    const speed = 90; // px/sec
    const x = 512 - ((t * speed) % (w + 512));
    const y = 260;

    ctx.fillText(text, x, y);
    ctx.fillText(text, x + w + 512, y);

    tex.needsUpdate = true;
  });

  return tex;
}

useGLTF.preload("/ComputersRevenge2.glb");

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
            enableZoom={true}   // ホイールズーム
            maxPolarAngle={Math.PI / 2} // 下から覗き込まない
          />
          <Model />
          <CameraRig />
          <EffectComposer>
            <Bloom
              intensity={1}          // 発光の強さ
              luminanceThreshold={0.25} // 明るい部分だけ光る（0にすると全部滲む）
              luminanceSmoothing={0.9} // 滲みの滑らかさ
              mipmapBlur               // ふわっとしたBloom
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </main>
  );
}
