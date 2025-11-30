"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useRef, useState } from "react";

type CountryWaterFootprint = {
  name: string;
  code: string;
  wfPerCapita: number;   // 1人あたりWF (m3/人/年)
  externalShare: number; // 対外依存度 (%)
};

const countryWaterFootprints: CountryWaterFootprint[] = [
  { name: "World average", code: "WORLD", wfPerCapita: 1243, externalShare: 16.1 },
  { name: "China",        code: "CN",    wfPerCapita: 702,  externalShare: 6.6 },
  { name: "Bangladesh",   code: "BD",    wfPerCapita: 896,  externalShare: 3.6 },
  { name: "South Africa", code: "ZA",    wfPerCapita: 931,  externalShare: 21.7 },
  { name: "India",        code: "IN",    wfPerCapita: 980,  externalShare: 1.6 },
  { name: "Egypt",        code: "EG",    wfPerCapita: 1097, externalShare: 18.9 },
  { name: "Japan",        code: "JP",    wfPerCapita: 1153, externalShare: 64.4 },
  { name: "Pakistan",     code: "PK",    wfPerCapita: 1218, externalShare: 5.3 },
  { name: "Netherlands",  code: "NL",    wfPerCapita: 1223, externalShare: 82.0 },
  { name: "United Kingdom", code: "GB",  wfPerCapita: 1245, externalShare: 70.4 },
  { name: "Jordan",       code: "JO",    wfPerCapita: 1303, externalShare: 73.0 },
  { name: "Indonesia",    code: "ID",    wfPerCapita: 1317, externalShare: 10.3 },
  { name: "Brazil",       code: "BR",    wfPerCapita: 1381, externalShare: 7.6 },
  { name: "Australia",    code: "AU",    wfPerCapita: 1393, externalShare: 18.1 },
  { name: "Mexico",       code: "MX",    wfPerCapita: 1441, externalShare: 30.0 },
  { name: "Germany",      code: "DE",    wfPerCapita: 1545, externalShare: 52.9 },
  { name: "Russia",       code: "RU",    wfPerCapita: 1858, externalShare: 15.5 },
  { name: "France",       code: "FR",    wfPerCapita: 1875, externalShare: 37.3 },
  { name: "Canada",       code: "CA",    wfPerCapita: 2049, externalShare: 20.4 },
  { name: "Thailand",     code: "TH",    wfPerCapita: 2223, externalShare: 8.3 },
  { name: "Italy",        code: "IT",    wfPerCapita: 2332, externalShare: 51.0 },
  { name: "United States",code: "US",    wfPerCapita: 2483, externalShare: 18.7 },
];

const minWF = Math.min(...countryWaterFootprints.map((c) => c.wfPerCapita));
const maxWF = Math.max(...countryWaterFootprints.map((c) => c.wfPerCapita));

// externalShare から淡い赤紫〜濃い紫のグラデーションを作る
function purpleGradient(wf: number): THREE.Color {
  // wf を minWF〜maxWF で 0〜1 に正規化
  const tRaw = (wf - minWF) / (maxWF - minWF || 1);
  const tClamped = Math.min(Math.max(tRaw, 0), 1);
  const t = Math.pow(tClamped, 0.9); // 中間の色を少し増やす

  // HSL 空間で補間（ピンク寄り → 紫）
  const hStart = 320 / 360;
  const hEnd = 285 / 360;
  const sStart = 0.5;
  const sEnd = 0.85;
  const lStart = 0.95;
  const lEnd = 0.55;

  const h = hStart + (hEnd - hStart) * t;
  const s = sStart + (sEnd - sStart) * t;
  const l = lStart + (lEnd - lStart) * t;

  const color = new THREE.Color();
  color.setHSL(h, s, l);
  return color;
}

// 疑似乱数（indexベースで安定）
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type SphereInfo = CountryWaterFootprint & {
  size: number;
  color: THREE.Color;
  position: [number, number, number];
};

// 「サイズに応じて」かつ「ぶつからないように」配置を決める（x,z）
// y はあとで3D配置用に大きめに振る
const spheres: SphereInfo[] = (() => {
  const result: SphereInfo[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const baseRadius = 6;
  const stepRadius = 1;

  countryWaterFootprints.forEach((country, index) => {
    const t =
      (country.wfPerCapita - minWF) / (maxWF - minWF || 1); // 0〜1
    const size = 0.9 + t * 4.6; // 半径 0.9〜5.5くらい
    const color = purpleGradient(country.wfPerCapita);

    const angle = goldenAngle * index;

    let radius = baseRadius + index * stepRadius * 0.6;
    let x = 0;
    let z = 0;
    let tries = 0;

    while (true) {
      // 方向はゴールデンアングル＋少し乱数でバラす
      const jitter = (rand(index * 10 + tries) - 0.5) * 0.4;
      const a = angle + jitter;

      x = Math.cos(a) * radius;
      z = Math.sin(a) * radius;

      let collision = false;
      for (const s of result) {
        const dx = x - s.position[0];
        const dz = z - s.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = (size + s.size) * 1.3; // 少し余裕を持たせる
        if (dist < minDist) {
          collision = true;
          break;
        }
      }

      if (!collision || tries > 25) break;
      radius += stepRadius; // 外側にずらす
      tries++;
    }

    // y はあとで「3D感」を出すために大きく振るので、ここでは 0 にしておく
    const y = 0;

    result.push({
      ...country,
      size,
      color,
      position: [x, y, z],
    });
  });

  return result;
})();

type RotatingSphereProps = {
  position: [number, number, number];
  radius: number;
  color: THREE.Color;
  country: CountryWaterFootprint;
};

function RotatingSphere({ position, radius, color, country }: RotatingSphereProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.003;
  });

  // ここで y を 3D 配置用に「縦にも大きく」振る
  const [x, _y, z] = position;
  const t =
    (country.wfPerCapita - minWF) / (maxWF - minWF || 1); // 0〜1
  const randomY = (rand(country.wfPerCapita) - 0.5) * 24; // -12〜12 くらい
  const y = randomY + t * 4.0; // 大きい国ほど少し上がる

  return (
    <mesh
      ref={ref}
      position={[x, y, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} />

      {hovered && (
        <Html center distanceFactor={20}>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "16px",
              background: "rgba(30, 12, 50, 0.9)",
              border: "1px solid rgba(255, 220, 255, 0.7)",
              color: "white",
              fontSize: "15px",
              whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}
          >
            <strong>{country.name}</strong>
            <br />
            {country.wfPerCapita} m³ / 人 / 年
            <br />
            外部依存: {country.externalShare}%
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default function Page() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#020817" }}>
      <Canvas camera={{ position: [0, 26, 55], fov: 45 }}>
        {/* 元あった「最低限のライト」：環境光＋方向光 */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 10]} intensity={1.2} />

        {spheres.map((s) => (
          <RotatingSphere
            key={s.code}
            position={s.position}
            radius={s.size}
            color={s.color}
            country={s}
          />
        ))}

        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
