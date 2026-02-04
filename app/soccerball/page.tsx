"use client";

import * as THREE from "three";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import InfoPanel from "./Infopanel";

/* =========================
   ★ここを調整：最後シーンの開始秒
   Blenderのタイムラインに合わせて変えてOK
========================= */
const SHOW_OVERLAY_FROM_SEC = 0;

/* =========================
   国定義（5か国のみ）
========================= */
const COUNTRIES = [
  { code: "IN", name: "インド", anchor: "IN_anchor", dx: 0.38, dy: 0.25 },
  { code: "BD", name: "バングラデシュ", anchor: "BD_anchor", dx: 0.45, dy: 0.05 },
  { code: "PK", name: "パキスタン", anchor: "PK_anchor", dx: 0.28, dy: 0.32 },
  { code: "TH", name: "タイ", anchor: "TH_anchor", dx: 0.52, dy: -0.05 },
  { code: "CN", name: "チュウゴク", anchor: "CN_anchor", dx: 0.22, dy: 0.42 },
] as const;

type ScreenPos = { x: number; y: number; visible: boolean };

export default function Page() {
  const [labels, setLabels] = useState<Record<string, ScreenPos>>({});
  const [showOverlay, setShowOverlay] = useState(false);
  const [t, setT] = useState(0); // 秒
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);

  const start = async () => {
    setStarted(true);
    setT(0);

    const a = audioRef.current;
    if (!a) return;

    try {
      a.currentTime = 0;
      a.muted = false;
      await a.play(); 
    } catch (e) {
      console.log("audio play blocked:", e);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Canvas camera={{ fov: 40, near: 0.1, far: 2000, position: [0, 0, 5] }}
  dpr={[1, 2]}>
        <color attach="background" args={["#07090e"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 2, 2]} intensity={1.4} />
        <directionalLight position={[-2, 1, -1]} intensity={0.6} />

        <Suspense fallback={null}>
          <SoccerballScene
            onUpdate={setLabels}
            onOverlayVisible={setShowOverlay}
            seekTime={t}
            started={started}
          />
        </Suspense>
        <OrbitControls enabled={false} />
      </Canvas>
      <audio
        ref={audioRef}
        src="/0001-0600.mp4"
        preload="auto"
        loop
      />
      <input
        type="range"
        min={0}
        max={200}
        step={0.01}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          width: 320,
          zIndex: 20,
        }}
      />
      {!started && (
        <button
          onClick={start}
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 160,
            height: 44,
            borderRadius: 999,
            zIndex: 50,
          }}
        >
          START
        </button>
      )}

      {/* ===== 国名（HTML）…最後シーンだけ表示 ===== */}
      {showOverlay &&
        COUNTRIES.map((c) => {
          const p = labels[c.code];
          if (!p || !p.visible) return null;
          return (
            <div
              key={c.code}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                transform: "translate(-50%, -50%)",
                color: "rgba(255,255,255,0.92)",
                fontSize: 12,
                letterSpacing: "0.14em",
                pointerEvents: "none",
                textShadow: "0 1px 12px rgba(0,0,0,0.65)",
                userSelect: "none",
              }}
            >
              {c.name}
            </div>
          );
        })}

      {/* ===== 右上パネル…最後シーンだけにしたいなら showOverlay && <InfoPanel /> にする ===== */}
      <InfoPanel />
    </div>
  );
}

function SoccerballScene({
  onUpdate,
  onOverlayVisible,
  seekTime,
  started,
}: {
  onUpdate: (p: Record<string, ScreenPos>) => void;
  onOverlayVisible: (v: boolean) => void;
  seekTime: number
  started: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const frags1 = useRef<THREE.Object3D[]>([]);
  const frags2 = useRef<THREE.Object3D[]>([]);
  const { scene, animations, nodes, cameras } = useGLTF("/soccerball7.glb");
  const {  mixer } = useAnimations(animations, groupRef);
  const { camera, size } = useThree();
  const overlayShownRef = useRef(false);

  const cam = cameras?.[0];
  useEffect(() => {
    if (!cam) return;
  }, [cam]);

   const glbCam = useMemo(() => {
    // 1) cameras配列に入ってればそこから
    const byArray =
      cameras?.find((c: THREE.Object3D) => c.name === "Camera_Orientation") ??
      cameras?.[0];
    if (byArray) return byArray;

    // 2) 無ければ scene から直接探す
    let found: THREE.Object3D | null = null;
    scene.traverse((o: THREE.Object3D) => {
      if (o.type === "PerspectiveCamera" || (o as any).isCamera) {
        if (o.name === "Camera_Orientation") found = o;
        if (!found) found = o; // とりあえず最初のカメラ
      }
    });
    return found as any;
  }, [scene, cameras]);
  
  useEffect(() => {
    console.log(
      "gltf cameras:",
      cameras?.map((c: any) => c.name)
    );
    console.log("ACTIVE CAMERA:", camera?.name, camera);
  }, [cameras, camera]);
  
  const fragsBefore = useRef<THREE.Object3D[]>([]);
  const fragsAfter = useRef<THREE.Object3D[]>([]);
  
  useEffect(() => {
  // 初期状態：after は消す / before は出す
    fragsAfter.current.forEach((o) => (o.visible = false));
    fragsBefore.current.forEach((o) => (o.visible = true));
  }, []);

  useEffect(() => {
  const before: THREE.Mesh[] = [];
  const after: THREE.Mesh[] = [];

  Object.values(nodes).forEach((node: any) => {
    if (!node || !node.isMesh) return;

    const n = node.name || node.parent?.name || "";

    const m = n.match(/cell[._\s-]?(\d+)/i);
    if (!m) return;

    const idx = Number(m[1]);
    if (idx < 100) before.push(node);
    else after.push(node);
  });

  console.log("NODES before:", before.length, "after:", after.length);
  fragsBefore.current = before;
  fragsAfter.current = after;
}, [nodes]);

useEffect(() => {
  console.log("ANIM COUNT:", animations.length);
  console.log(
    "ANIMS:",
    animations.map((a) => ({ name: a.name, duration: a.duration }))
  );
}, [animations]);

  // seekTime（秒）基準で制御
  useEffect(() => {
    const SWITCH_FRAME = 370;
    const FPS = 30;
    const showAfter = seekTime >= SWITCH_FRAME / FPS;

    fragsBefore.current.forEach((o) => (o.visible = !showAfter));
    fragsAfter.current.forEach((o) => (o.visible = showAfter));
  }, [seekTime]);

  // アニメ開始
  useEffect(() => {
    if (!mixer || animations.length === 0) return;

    // すべてのActionを再生状態に
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });

    mixer.timeScale = 1;
  }, [mixer, animations]);

  useFrame((_, delta) => {
  if (!mixer || !started) return;
  mixer.update(delta);
});

  /* --- アンカー取得 --- */
  const anchors = useMemo(() => {
    const map = new Map<string, THREE.Object3D>();
    scene.traverse((o) => {
      if (!o.name) return;
      COUNTRIES.forEach((c) => {
        if (o.name === c.anchor) map.set(c.code, o);
      });
    });
    return map;
  }, [scene]);

  /* --- 線用（最後シーンだけ描画するので、データは作っておく） --- */
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "white",
        transparent: true,
        opacity: 0.85,
      }),
    []
  );

  const lines = useMemo(
    () =>
      COUNTRIES.map((c) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(geo, lineMaterial); // ← SVG衝突回避
        return { code: c.code, geo, line, dx: c.dx, dy: c.dy };
      }),
    [lineMaterial]
  );

  const vCountry = useRef(new THREE.Vector3());
  const vEnd = useRef(new THREE.Vector3());
  const vRight = useRef(new THREE.Vector3());
  const vUp = useRef(new THREE.Vector3());
  const vProj = useRef(new THREE.Vector3());

  const throttle = useRef(0);

  useFrame((state, dt) => {
    // 現在のアニメ再生秒数（R3Fのclockで良い：glbの再生時間に合わせる用途）
    const t = state.clock.elapsedTime;

    // 最後のシーンだけ表示
    const shouldShow = t >= SHOW_OVERLAY_FROM_SEC;

    if (shouldShow !== overlayShownRef.current) {
      overlayShownRef.current = shouldShow;
      onOverlayVisible(shouldShow);
    }

    // overlay非表示なら、線やラベル座標の更新もしない（軽い）
    if (!shouldShow) return;

    // 30fpsで更新
    throttle.current += dt;
    if (throttle.current < 1 / 30) return;
    throttle.current = 0;

    vRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    vUp.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const out: Record<string, ScreenPos> = {};

    for (const l of lines) {
      const anchor = anchors.get(l.code);
      if (!anchor) continue;

      anchor.getWorldPosition(vCountry.current);

      vEnd.current
        .copy(vCountry.current)
        .addScaledVector(vRight.current, l.dx)
        .addScaledVector(vUp.current, l.dy);

      const pos = l.geo.getAttribute("position") as THREE.BufferAttribute;
      pos.setXYZ(0, vCountry.current.x, vCountry.current.y, vCountry.current.z);
      pos.setXYZ(1, vEnd.current.x, vEnd.current.y, vEnd.current.z);
      pos.needsUpdate = true;

      vProj.current.copy(vEnd.current).project(camera);

      out[l.code] = {
        visible: vProj.current.z > -1 && vProj.current.z < 1,
        x: (vProj.current.x * 0.5 + 0.5) * size.width,
        y: (-vProj.current.y * 0.5 + 0.5) * size.height,
      };
    }

    onUpdate(out);
  });

  //Cam_Rigのempty設定
  const rigRef = useRef<THREE.Object3D | null>(null);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    let found: THREE.Object3D | null = null;
    scene.traverse((o) => {
      if (o.name === "Cam_Rig") found = o;
    });
    rigRef.current = found;
  }, [scene]);

  useFrame(() => {
    const rig = rigRef.current;
    if (!rig) return;

    // Cam_Rig のワールド姿勢を、R3Fの実カメラへコピー
    rig.getWorldPosition(tmpPos);
    rig.getWorldQuaternion(tmpQuat);

    camera.position.copy(tmpPos);
    camera.quaternion.copy(tmpQuat);
    camera.updateProjectionMatrix();
  });

  useFrame(() => {
    camera.position.y -= 6; // 値は微調整
  });

  useEffect(() => {
    if (!mixer || !started) return;
    mixer.setTime(seekTime); // ← ここで任意秒へ
  }, [mixer, seekTime]);

  return (
    <group ref={groupRef}>
      {cam && <primitive object={cam} makeDefault />}
      <primitive object={scene} />

      {/* 線は「最後のシーンだけ」見せる */}
      {overlayShownRef.current && (
        <>
          {lines.map((l) => (
            <primitive key={l.code} object={l.line} />
          ))}
        </>
      )}
    </group>
  );
}

useGLTF.preload("/soccerball7.glb");
