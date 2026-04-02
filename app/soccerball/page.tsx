"use client";

import React, { useEffect, useRef, useState } from "react";
import InfoPanel from "./Infopanel";

const BASE_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? '';

/* =========================
   国ラベル位置
   x, y は画面に対する %
   最終フレームを見ながら微調整
========================= */
const COUNTRIES = [
  { code: "IN", name: "インド",         x: 62, y: 51, delay: 0.0 },
  { code: "BD", name: "バングラデシュ",  x: 65, y: 48, delay: 0.1 },
  { code: "PK", name: "パキスタン",      x: 60, y: 45, delay: 0.2 },
  { code: "TH", name: "タイ",           x: 67, y: 53, delay: 0.3 },
  { code: "CN", name: "中国",           x: 70, y: 40, delay: 0.4 },
] as const;

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRect = useVideoRect(videoRef, t);

  const start = async () => {
    setStarted(true);

    try {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        await videoRef.current.play();
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;

    const current = v.currentTime;
    setT(current);
    setShowOverlay(duration > 0 && current >= duration - ANIM_START_BEFORE_END_SEC);
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
  setShowOverlay(duration > 0 && value >= duration - ANIM_START_BEFORE_END_SEC);
};

  const ANIM_START_BEFORE_END_SEC = 5;
  const showInfoPanel =
    duration > 0 && t >= duration - ANIM_START_BEFORE_END_SEC + 2;

  // 動画の実際の表示サイズと位置を計算するhook
function useVideoRect(videoRef: React.RefObject<HTMLVideoElement>, t: number) {
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;

      const containerW = window.innerWidth;
      const containerH = window.innerHeight;
      const videoAspect = v.videoWidth / v.videoHeight;
      const containerAspect = containerW / containerH;

      let w, h, x, y;
      if (videoAspect > containerAspect) {
        // 横にフィット
        w = containerW;
        h = containerW / videoAspect;
        x = 0;
        y = (containerH - h) / 2;
      } else {
        // 縦にフィット
        h = containerH;
        w = containerH * videoAspect;
        x = (containerW - w) / 2;
        y = 0;
      }
      setRect({ x, y, w, h });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [videoRef, t]);

  return rect;
}

  function CountryLine({
    country,
    visible,
    delay,
    videoRect,
  }: {
    country: typeof COUNTRIES[number];
    visible: boolean;
    delay: number;
    videoRect: { x: number; y: number; w: number; h: number };
  }) {
    const [progress, setProgress] = useState(0);
    const [labelVisible, setLabelVisible] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const DURATION = 600; // ms

    useEffect(() => {
      if (!visible) {
        setProgress(0);
        setLabelVisible(false);
        startRef.current = null;
        return;
      }

      const timeout = setTimeout(() => {
        const animate = (now: number) => {
          if (!startRef.current) startRef.current = now;
          const p = Math.min((now - startRef.current) / DURATION, 1);
          setProgress(p);
          if (p >= 1) setLabelVisible(true);
          else rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
      }, delay * 1000);

      return () => {
        clearTimeout(timeout);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [visible, delay]);

    const toScreenX = (pct: number) => videoRect.x + videoRect.w * (pct / 100);
    const toScreenY = (pct: number) => videoRect.y + videoRect.h * (pct / 100);

    const sx1 = toScreenX(country.x);
    const sy1 = toScreenY(country.y);
    const sx2 = toScreenX(82); // 線の右端（動画内の%）
    const sy2 = toScreenY(country.y);

    const animSx2 = sx1 + (sx2 - sx1) * progress;
    // 画面幅・高さに対する%座標
    // 線の終点（ラベル側）は常に左端 x=18% あたり
    const x1 = country.x; // %
    const y1 = country.y; // %
    const x2 = 82;        // % ← ラベルの右端
    const y2 = country.y; // 水平線

    // SVGは画面全体を覆う
    const cx1 = `${x1}%`;
    const cy1 = `${y1}%`;
    // 線を progress でアニメーション（x1→x2 に伸びる）
    const animX2 = x1 + (x2 - x1) * progress;
    const cx2 = `${animX2}%`;
    const cy2 = `${y2}%`;

    return (
      <>
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 11,
        overflow: "visible",
      }}
    >
      <circle
        cx={sx1}
        cy={sy1}
        r="3"
        fill="white"
        opacity={visible ? 0.9 : 0}
        style={{ transition: "opacity 0.3s" }}
      />
      <line
        x1={sx1}
        y1={sy1}
        x2={animSx2}
        y2={sy2}
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="0.8"
      />
    </svg>

    {labelVisible && (
      <div
        style={{
          position: "absolute",
          left: sx2 + 8,
          top: sy2,
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.92)",
          fontSize: 11,
          letterSpacing: "0.14em",
          fontFamily: "monospace",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          zIndex: 12,
          animation: "fadeIn 0.3s ease forwards",
        }}
      >
        {country.name}
      </div>
    )}
  </>
    );
  }

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
        src={`${BASE_URL}/Ballmovie2.mp4`}
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
      <audio ref={audioRef} src={`${BASE_URL}/Ballaudio.flac`} preload="auto" />
      {!started && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: "fit-content",
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            zIndex: 30,
          }}
        >
          <button
            onClick={start}
            style={{
              width: 250,
              padding: "14px 0",
              border: "1px solid rgba(255,255,255,0.5)",
              background: "rgba(0,0,0,0.7)",
              color: "rgba(255,255,255,0.92)",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.25em",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
            }}
          >
            START
            <span style={{
              fontSize: 13,
              letterSpacing: "0.12em",
              color: "rgba(255, 255, 255, 0.76)",
              fontWeight: 400,
            }}>
              ※ 音が出ます
            </span>
          </button>
        </div>
      )}

      {/* シークバー */}
      {/* <input
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
      /> */}

      {/* 国名ラベル */}
      {showOverlay &&
        COUNTRIES.map((c) => (
          <CountryLine
            key={c.code}
            country={c}
            visible={showOverlay}
            delay={c.delay}
            videoRect={videoRect}
          />
        ))}

      {/* InfoPanel（全ラベル出たあとに表示） */}
      {showInfoPanel && (
        <div
          style={{
            position: "absolute",
            left: 0,   
            top: 0,
            height: "100%",
            width: 500,
            zIndex: 15,
            pointerEvents: "auto",
            animation: "slideIn 0.5s ease forwards",
          }}
        >
          <InfoPanel />
        </div>
      )}

    </div>
  );
}