"use client";

import React, { useEffect, useRef, useState } from "react";
import InfoPanel from "./Infopanel";

/* =========================
   ★ ここを調整
   国名ラベルを表示し始める秒数
   例: 動画の最後10秒だけ表示したいなら
   「動画全体 - 10秒」で計算してもOK
========================= */
const SHOW_OVERLAY_FROM_SEC = 0;

/* =========================
   国ラベル位置
   x, y は画面に対する %
   最終フレームを見ながら微調整してね
========================= */
const COUNTRIES = [
  { code: "IN", name: "インド", x: 63, y: 43 },
  { code: "BD", name: "バングラデシュ", x: 67, y: 48 },
  { code: "PK", name: "パキスタン", x: 58, y: 38 },
  { code: "TH", name: "タイ", x: 70, y: 56 },
  { code: "CN", name: "チュウゴク", x: 55, y: 30 },
] as const;

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(0);

  const start = async () => {
    const v = videoRef.current;
    if (!v) return;

    setStarted(true);

    try {
      v.currentTime = 0;
      await v.play();
    } catch (e) {
      console.log("video play blocked:", e);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;

    const current = v.currentTime;
    setT(current);
    setShowOverlay(current >= SHOW_OVERLAY_FROM_SEC);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
  };

  const handleSeek = (value: number) => {
    const v = videoRef.current;
    if (!v) return;

    v.currentTime = value;
    setT(value);
    setShowOverlay(value >= SHOW_OVERLAY_FROM_SEC);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onEnded = () => {
      // ループしないなら最後で overlay を維持したい場合
      setShowOverlay(true);
    };

    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* 背景動画 */}
      <video
        ref={videoRef}
        src="/Ballmovie.mp4"
        preload="auto"
        playsInline
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          width: "100vw",
          height: "100vh",
          objectFit: "contain", // 全面表示。全部見せたいなら "contain"
          display: "block",
          background: "#000",
        }}
      />

      {/* STARTボタン */}
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
            border: "none",
            background: "rgba(255,255,255,0.9)",
            color: "#111",
            fontWeight: 700,
            letterSpacing: "0.08em",
            zIndex: 30,
            cursor: "pointer",
          }}
        >
          START
        </button>
      )}

      {/* シークバー */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={t}
        onChange={(e) => handleSeek(Number(e.target.value))}
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          width: 320,
          zIndex: 20,
        }}
      />

      {/* 国名ラベル */}
      {showOverlay &&
        COUNTRIES.map((c) => (
          <div
            key={c.code}
            style={{
              position: "absolute",
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: "translate(-50%, -50%)",
              color: "rgba(255,255,255,0.92)",
              fontSize: 12,
              letterSpacing: "0.14em",
              pointerEvents: "none",
              textShadow: "0 1px 12px rgba(0,0,0,0.65)",
              userSelect: "none",
              zIndex: 10,
            }}
          >
            {c.name}
          </div>
        ))}

      {/* InfoPanel はそのまま */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15 }}>
        <div style={{ pointerEvents: "auto" }}>
          {/* <InfoPanel /> */}
        </div>
      </div>
    </div>
  );
}