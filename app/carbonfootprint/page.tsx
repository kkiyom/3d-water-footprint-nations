"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { a, useSpring } from "@react-spring/three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import InfoPanel from "./infopanel";

type CountryCO2 = {
  name: string;
  code: string;
  co2Total: number;     // MtCO2
  co2PerCapita: number; // tCO2/person
};

type LatLon = { lat: number; lon: number };

const countryCoords: Record<string, LatLon> = {
  CN: { lat: 35, lon: 103 },
  IN: { lat: 21, lon: 78 },
  JP: { lat: 36, lon: 138 },
  KR: { lat: 36, lon: 128 },
  BD: { lat: 24, lon: 90 },
  TH: { lat: 15, lon: 101 },
  VN: { lat: 16, lon: 108 },
  MY: { lat: 4, lon: 109 },
  SA: { lat: 24, lon: 45 },
  IR: { lat: 32, lon: 53 },
  PK: { lat: 30, lon: 70 },
  ID: { lat: -2, lon: 118 },
  JO: { lat: 31, lon: 36 },
  RU: { lat: 60, lon: 90 },
  DE: { lat: 51, lon: 10 },
  FR: { lat: 46, lon: 2 },
  IT: { lat: 42, lon: 12.5 },
  ES: { lat: 40, lon: -4 },
  GB: { lat: 55, lon: -3 },
  NL: { lat: 52.1, lon: 5.3 },
  PL: { lat: 52, lon: 20 },
  SE: { lat: 60, lon: 18 },
  NO: { lat: 60, lon: 8 },
  UA: { lat: 49, lon: 32 },
  TR: { lat: 39, lon: 35 },
  NG: { lat: 9, lon: 8 },
  EG: { lat: 26, lon: 30 },
  MA: { lat: 32, lon: -6 },
  ET: { lat: 9, lon: 39 },
  ZA: { lat: -30, lon: 25 },
  US: { lat: 39, lon: -98 },
  CA: { lat: 60, lon: -95 },
  MX: { lat: 23, lon: -102 },
  BR: { lat: -10, lon: -55 },
  AR: { lat: -38, lon: -64 },
  AU: { lat: -25, lon: 133 },
  QA: { lat: 25.4, lon: 51.2 },
  KW: { lat: 29.3, lon: 47.7 },
  AE: { lat: 24.0, lon: 54.4 },
  BH: { lat: 26.0, lon: 50.5 },
  OM: { lat: 21.5, lon: 57.5 },
  KZ: { lat: 48.0, lon: 68.0 },
  CZ: { lat: 50.0, lon: 15.5 },
  BE: { lat: 50.5, lon: 4.5 },
  FI: { lat: 64.0, lon: 26.0 },
  GR: { lat: 39.0, lon: 22.0 },
  RO: { lat: 45.9, lon: 25.0 },
  CL: { lat: -35.0, lon: -71.0 },
  CO: { lat: 4.0, lon: -74.0 },
  PE: { lat: -10.0, lon: -76.0 },
  PH: { lat: 13.0, lon: 122.0 },
  GH: { lat: 8.0, lon: -1.0 },
  TZ: { lat: -6.0, lon: 35.0 },
  KE: { lat: 0.5, lon: 38.0 },
  CD: { lat: -4.0, lon: 22.0 },
  IQ: { lat: 33.0, lon: 44.0 },
  NZ: { lat: -41.0, lon: 174.0 },
  SG: { lat: 1.3, lon: 103.8 },
};

const countryNamesEn: Record<string, string> = {
  CN: "China", IN: "India", US: "United States", BR: "Brazil", RU: "Russia",
  ID: "Indonesia", NG: "Nigeria", PK: "Pakistan", CA: "Canada", TH: "Thailand",
  MX: "Mexico", AR: "Argentina", TR: "Turkey", IR: "Iran", VN: "Vietnam",
  MY: "Malaysia", ET: "Ethiopia", IT: "Italy", EG: "Egypt", FR: "France",
  ES: "Spain", MA: "Morocco", DE: "Germany", PL: "Poland", UA: "Ukraine",
  AU: "Australia", JP: "Japan", GB: "United Kingdom", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", BD: "Bangladesh", JO: "Jordan", SA: "Saudi Arabia",
  ZA: "South Africa", KR: "South Korea",
  QA: "Qatar", KW: "Kuwait", AE: "UAE", BH: "Bahrain", OM: "Oman",
  KZ: "Kazakhstan", CZ: "Czech Republic", BE: "Belgium", FI: "Finland",
  GR: "Greece", RO: "Romania", CL: "Chile", CO: "Colombia", PE: "Peru",
  PH: "Philippines", GH: "Ghana", TZ: "Tanzania", KE: "Kenya", CD: "DR Congo",
  IQ: "Iraq", NZ: "New Zealand", SG: "Singapore",
};

// Source: Global Carbon Project 2022 (Friedlingstein et al., 2022)
// Territorial CO2 emissions, 2021. Unit: MtCO2 / t CO2 per person
const countryCO2Data: CountryCO2[] = [
  { name: "中国",         code: "CN", co2Total: 11100, co2PerCapita: 7.9  },
  { name: "アメリカ",     code: "US", co2Total: 5000,  co2PerCapita: 15.1 },
  { name: "インド",       code: "IN", co2Total: 2700,  co2PerCapita: 1.9  },
  { name: "ロシア",       code: "RU", co2Total: 1700,  co2PerCapita: 11.7 },
  { name: "日本",         code: "JP", co2Total: 1000,  co2PerCapita: 8.0  },
  { name: "サウジアラビア",code: "SA", co2Total: 730,   co2PerCapita: 20.9 },
  { name: "イラン",       code: "IR", co2Total: 700,   co2PerCapita: 8.3  },
  { name: "ドイツ",       code: "DE", co2Total: 700,   co2PerCapita: 8.4  },
  { name: "インドネシア", code: "ID", co2Total: 650,   co2PerCapita: 2.4  },
  { name: "韓国",         code: "KR", co2Total: 620,   co2PerCapita: 12.0 },
  { name: "カナダ",       code: "CA", co2Total: 570,   co2PerCapita: 15.0 },
  { name: "ブラジル",     code: "BR", co2Total: 480,   co2PerCapita: 2.3  },
  { name: "トルコ",       code: "TR", co2Total: 460,   co2PerCapita: 5.5  },
  { name: "南アフリカ",   code: "ZA", co2Total: 430,   co2PerCapita: 7.3  },
  { name: "メキシコ",     code: "MX", co2Total: 420,   co2PerCapita: 3.3  },
  { name: "オーストラリア",code:"AU", co2Total: 380,   co2PerCapita: 14.7 },
  { name: "イギリス",     code: "GB", co2Total: 380,   co2PerCapita: 5.6  },
  { name: "ポーランド",   code: "PL", co2Total: 360,   co2PerCapita: 9.5  },
  { name: "イタリア",     code: "IT", co2Total: 330,   co2PerCapita: 5.5  },
  { name: "フランス",     code: "FR", co2Total: 320,   co2PerCapita: 4.8  },
  { name: "ベトナム",     code: "VN", co2Total: 290,   co2PerCapita: 3.0  },
  { name: "タイ",         code: "TH", co2Total: 280,   co2PerCapita: 4.0  },
  { name: "エジプト",     code: "EG", co2Total: 270,   co2PerCapita: 2.6  },
  { name: "マレーシア",   code: "MY", co2Total: 260,   co2PerCapita: 8.0  },
  { name: "スペイン",     code: "ES", co2Total: 250,   co2PerCapita: 5.3  },
  { name: "パキスタン",   code: "PK", co2Total: 210,   co2PerCapita: 0.9  },
  { name: "アルゼンチン", code: "AR", co2Total: 195,   co2PerCapita: 4.3  },
  { name: "ウクライナ",   code: "UA", co2Total: 160,   co2PerCapita: 3.7  },
  { name: "オランダ",     code: "NL", co2Total: 150,   co2PerCapita: 8.6  },
  { name: "バングラデシュ",code: "BD", co2Total: 100,   co2PerCapita: 0.6  },
  { name: "ナイジェリア", code: "NG", co2Total: 105,   co2PerCapita: 0.5  },
  { name: "モロッコ",     code: "MA", co2Total: 65,    co2PerCapita: 1.7  },
  { name: "スウェーデン", code: "SE", co2Total: 44,    co2PerCapita: 4.2  },
  { name: "ノルウェー",   code: "NO", co2Total: 42,    co2PerCapita: 7.7  },
  { name: "ヨルダン",     code: "JO", co2Total: 27,    co2PerCapita: 2.6  },
  { name: "エチオピア",   code: "ET", co2Total: 20,    co2PerCapita: 0.2  },
  { name: "カタール",     code: "QA", co2Total: 105,   co2PerCapita: 35.6 },
  { name: "クウェート",   code: "KW", co2Total: 100,   co2PerCapita: 23.2 },
  { name: "UAE",          code: "AE", co2Total: 200,   co2PerCapita: 20.3 },
  { name: "バーレーン",   code: "BH", co2Total: 40,    co2PerCapita: 23.3 },
  { name: "オマーン",     code: "OM", co2Total: 80,    co2PerCapita: 15.7 },
  { name: "カザフスタン", code: "KZ", co2Total: 270,   co2PerCapita: 14.3 },
  { name: "チェコ",       code: "CZ", co2Total: 110,   co2PerCapita: 10.2 },
  { name: "ベルギー",     code: "BE", co2Total: 120,   co2PerCapita: 10.3 },
  { name: "フィンランド", code: "FI", co2Total: 48,    co2PerCapita: 8.7  },
  { name: "ギリシャ",     code: "GR", co2Total: 72,    co2PerCapita: 6.7  },
  { name: "ルーマニア",   code: "RO", co2Total: 80,    co2PerCapita: 4.2  },
  { name: "イラク",       code: "IQ", co2Total: 220,   co2PerCapita: 5.4  },
  { name: "チリ",         code: "CL", co2Total: 90,    co2PerCapita: 4.7  },
  { name: "コロンビア",   code: "CO", co2Total: 90,    co2PerCapita: 1.8  },
  { name: "ペルー",       code: "PE", co2Total: 55,    co2PerCapita: 1.7  },
  { name: "フィリピン",   code: "PH", co2Total: 140,   co2PerCapita: 1.3  },
  { name: "ガーナ",       code: "GH", co2Total: 20,    co2PerCapita: 0.6  },
  { name: "タンザニア",   code: "TZ", co2Total: 16,    co2PerCapita: 0.3  },
  { name: "ケニア",       code: "KE", co2Total: 18,    co2PerCapita: 0.3  },
  { name: "コンゴ民主共和国", code: "CD", co2Total: 4, co2PerCapita: 0.04 },
  { name: "ニュージーランド", code: "NZ", co2Total: 37, co2PerCapita: 7.2 },
  { name: "シンガポール", code: "SG", co2Total: 53,    co2PerCapita: 9.2  },
];

const WORLD_AVG_PER_CAPITA = 4.7; // tCO2/person (2021, GCP)

function getWorldAvgLabel(perCapita: number, lang: "ja" | "en"): string {
  const ratio = perCapita / WORLD_AVG_PER_CAPITA;
  if (lang === "en") return `≈ ${ratio.toFixed(1)}× world average`;
  return `世界平均の約 ${ratio.toFixed(1)} 倍`;
}

function latLonToXYZ(latDeg: number, lonDeg: number, r: number): [number, number, number] {
  const lonRad = -lonDeg * Math.PI / 180;
  const latRad = latDeg * Math.PI / 180;
  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad);
  return [x, y, z];
}

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const EARTH_RADIUS = 28;

const VEIL_VERT = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vEyeVector = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const VEIL_FRAG = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    float ndotv = clamp(dot(normalize(vNormal), normalize(vEyeVector)), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.5);
    float alpha = 0.04 + fresnel * 0.52;
    vec3 col = mix(vec3(0.0), uColor, 0.2 + fresnel * 0.8);
    gl_FragColor = vec4(col, alpha);
  }
`;

const minCO2 = Math.min(...countryCO2Data.map((c) => c.co2PerCapita));
const maxCO2 = Math.max(...countryCO2Data.map((c) => c.co2PerCapita));

function carbonGradient(co2: number): THREE.Color {
  const tRaw = (co2 - minCO2) / (maxCO2 - minCO2 || 1);
  const t = Math.min(Math.max(tRaw, 0), 1);

  // 薄黄 → 黄 → オレンジ → 赤 → 深紅（カタール）
  // US/Canada (t≈0.42) でオレンジ赤、カタール (t=1) で深紅
  let h: number, s: number, l: number;

  if (t <= 0.05) {
    const u = t / 0.05;
    h = 0.145; s = 0.15 + 0.75 * u; l = 0.95 - 0.30 * u;
  } else if (t <= 0.25) {
    const u = (t - 0.05) / 0.20;
    h = (52 - 27 * u) / 360;   // 黄→オレンジ
    s = 0.90 + 0.10 * u;
    l = 0.65 - 0.18 * u;
  } else if (t <= 0.50) {
    const u = (t - 0.25) / 0.25;
    h = (25 - 15 * u) / 360;   // オレンジ→オレンジ赤
    s = 1.0;
    l = 0.47 - 0.07 * u;
  } else {
    const u = Math.pow((t - 0.50) / 0.50, 0.75);
    h = (10 - 10 * u) / 360;   // オレンジ赤→深紅
    s = 1.0;
    l = 0.40 - 0.22 * u;
  }

  const color = new THREE.Color();
  color.setHSL(h, s, l);
  return color;
}

type SphereInfo = CountryCO2 & {
  size: number;
  color: THREE.Color;
  position: [number, number, number];
};

const spheres: SphereInfo[] = (() => {
  const result: SphereInfo[] = [];

  countryCO2Data.forEach((country, index) => {
    const t = (country.co2PerCapita - minCO2) / (maxCO2 - minCO2 || 1);
    const size = 1.1 + t * 6.5;

    const baseCoord = countryCoords[country.code] ?? { lat: 0, lon: 0 };
    let lat = baseCoord.lat;
    let lon = baseCoord.lon;
    let position: [number, number, number] = latLonToXYZ(lat, lon, EARTH_RADIUS);

    for (let tries = 0; tries < 60; tries++) {
      let collision = false;
      for (const s of result) {
        const dx = position[0] - s.position[0];
        const dy = position[1] - s.position[1];
        const dz = position[2] - s.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < (size + s.size) * 1.15) { collision = true; break; }
      }
      if (!collision) break;

      const spread = Math.min(3 + tries * 1.5, 20);
      lat = baseCoord.lat + (rand(index * 10 + tries) * 2 - 1) * spread;
      lon = baseCoord.lon + (rand(index * 17 + tries) * 2 - 1) * spread;
      if (lat > 85) lat = 85;
      if (lat < -85) lat = -85;
      if (lon > 180) lon -= 360;
      if (lon < -180) lon += 360;
      position = latLonToXYZ(lat, lon, EARTH_RADIUS);
    }

    result.push({ ...country, size, color: carbonGradient(country.co2PerCapita), position });
  });

  return result;
})();

const posByCode = (() => {
  const map: Record<string, THREE.Vector3> = {};
  for (const s of spheres) {
    map[s.code] = new THREE.Vector3(...s.position);
  }
  return map;
})();

// 内包炭素貿易フロー (MtCO₂, 近似値 Global Carbon Project / Peters et al.)
const carbonFlows = [
  { from: "CN", to: "US", value: 380 },
  { from: "CN", to: "JP", value: 130 },
  { from: "CN", to: "DE", value: 110 },
  { from: "CN", to: "KR", value: 85 },
  { from: "CN", to: "GB", value: 80 },
  { from: "CN", to: "FR", value: 65 },
  { from: "CN", to: "IT", value: 55 },
  { from: "CN", to: "AU", value: 50 },
  { from: "CN", to: "NL", value: 45 },
  { from: "RU", to: "DE", value: 85 },
  { from: "RU", to: "CN", value: 55 },
  { from: "RU", to: "JP", value: 40 },
  { from: "RU", to: "TR", value: 35 },
  { from: "IN", to: "US", value: 75 },
  { from: "IN", to: "GB", value: 35 },
  { from: "IN", to: "DE", value: 30 },
  { from: "US", to: "CA", value: 65 },
  { from: "US", to: "MX", value: 55 },
  { from: "DE", to: "FR", value: 45 },
  { from: "DE", to: "GB", value: 40 },
  { from: "KR", to: "US", value: 45 },
  { from: "JP", to: "US", value: 40 },
  { from: "SA", to: "CN", value: 60 },
  { from: "SA", to: "JP", value: 45 },
  { from: "SA", to: "KR", value: 40 },
  { from: "AU", to: "CN", value: 55 },
  { from: "AU", to: "JP", value: 35 },
];

function mapThickness(value: number, minV: number, maxV: number) {
  const v = Math.max(1e-6, value);
  const min = Math.max(1e-6, minV);
  const max = Math.max(min * 1.01, maxV);
  const t = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return 0.04 + Math.min(1, Math.max(0, t)) * 1.8;
}

function greatCirclePoints(
  fromPos: THREE.Vector3, toPos: THREE.Vector3,
  baseRadius: number, segments: number, liftMax: number
) {
  const a = fromPos.clone().normalize();
  const b = toPos.clone().normalize();
  const omega = a.angleTo(b);
  const sinOmega = Math.sin(omega);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let dir: THREE.Vector3;
    if (sinOmega < 1e-6) { dir = a.clone(); }
    else {
      const s0 = Math.sin((1 - t) * omega) / sinOmega;
      const s1 = Math.sin(t * omega) / sinOmega;
      dir = a.clone().multiplyScalar(s0).add(b.clone().multiplyScalar(s1)).normalize();
    }
    pts.push(dir.multiplyScalar(baseRadius + liftMax * Math.sin(Math.PI * t)));
  }
  return pts;
}

function CarbonArcLink({
  value, fromPos, toPos, minV, maxV, highlighted, isExport,
}: {
  value: number; fromPos: THREE.Vector3; toPos: THREE.Vector3;
  minV: number; maxV: number; highlighted: boolean; isExport: boolean;
}) {
  const progressRef = useRef(0);

  const { geometry, indexCount } = useMemo(() => {
    const width = mapThickness(value, minV, maxV);
    const segments = 60;
    const points = greatCirclePoints(fromPos, toPos, EARTH_RADIUS, segments, 2.0);
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const taper = Math.sin(Math.PI * t); // 両端0→中央1→両端0
      const w = width * taper;
      const p = points[i];
      const tangent = i < points.length - 1 ? points[i + 1].clone().sub(p) : p.clone().sub(points[i - 1]);
      tangent.normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(w * 0.5);
      positions.push(p.x + normal.x, p.y + normal.y, p.z + normal.z);
      positions.push(p.x - normal.x, p.y - normal.y, p.z - normal.z);
      if (i < points.length - 1) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
        indices.push(a, b, c, b, d, c);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.setDrawRange(0, 0);
    return { geometry: geom, indexCount: indices.length };
  }, [fromPos, toPos, value, minV, maxV]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.70,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (highlighted) {
      progressRef.current = Math.min(1, progressRef.current + delta * 2.5);
      material.color.set(isExport ? "#ff9944" : "#ff5544");
    } else {
      progressRef.current = Math.max(0, progressRef.current - delta * 8);
    }
    geometry.setDrawRange(0, Math.floor(progressRef.current * indexCount));
  });

  return <mesh geometry={geometry} material={material} />;
}

function CarbonFlowLinks({ hoveredCountry }: { hoveredCountry: string | null }) {
  const values = carbonFlows.map((f) => f.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  return (
    <>
      {carbonFlows.map((f, i) => {
        const fromPos = posByCode[f.from];
        const toPos = posByCode[f.to];
        if (!fromPos || !toPos) return null;
        const isExport = hoveredCountry !== null && f.from === hoveredCountry;
        const isImport = hoveredCountry !== null && f.to === hoveredCountry;
        return (
          <CarbonArcLink
            key={`${f.from}-${f.to}-${i}`}
            value={f.value}
            fromPos={fromPos}
            toPos={toPos}
            minV={minV}
            maxV={maxV}
            highlighted={isExport || isImport}
            isExport={isExport}
          />
        );
      })}
    </>
  );
}

type RotatingSphereProps = {
  position: [number, number, number];
  radius: number;
  color: THREE.Color;
  country: CountryCO2;
  onHoverCountry?: (code: string | null) => void;
  lang?: "ja" | "en";
  resetKey?: number;
  isMobile?: boolean;
};

function RotatingSphere({ position, radius, color, country, onHoverCountry, lang = "ja", resetKey, isMobile = false }: RotatingSphereProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setHovered(false);
    onHoverCountry?.(null);
  }, [resetKey]);
  const displayName = lang === "en" ? (countryNamesEn[country.code] ?? country.name) : country.name;
  const avgLabel = getWorldAvgLabel(country.co2PerCapita, lang);

  const [spring, api] = useSpring(() => ({
    wobble: 1,
    config: { mass: 2, tension: 800, friction: 15 },
  }));

  const uniforms = useMemo(() => ({ uColor: { value: color.clone() } }), []);

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uColor.value = color;
  }, [hovered, color]);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.003;
  });

  return (
    <a.mesh
      ref={ref}
      position={position}
      scale={spring.wobble.to((w) => [w, w, w])}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHoverCountry?.(country.code);
        document.body.style.cursor = "pointer";
        api.start({ wobble: 1.1 });
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHoverCountry?.(null);
        document.body.style.cursor = "default";
        api.start({ wobble: 1 });
      }}
      onClick={(e) => {
        e.stopPropagation();
        const next = !hovered;
        setHovered(next);
        onHoverCountry?.(next ? country.code : null);
        api.start({ wobble: next ? 1.1 : 1 });
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VEIL_VERT}
        fragmentShader={VEIL_FRAG}
        transparent
        depthWrite={false}
      />
      {hovered && (
        <Html center distanceFactor={20} style={{ pointerEvents: "none" }}>
          <div style={{
            padding: isMobile ? "10px 14px" : "18px 28px",
            borderRadius: "16px",
            background: "rgba(30, 8, 0, 0.92)",
            border: "1px solid rgba(255, 160, 40, 0.7)",
            color: "white",
            fontSize: isMobile ? "13px" : "17px",
            lineHeight: "1.7",
            whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}>
            <strong style={{ fontSize: isMobile ? "15px" : "19px" }}>{displayName}</strong>
            <br />
            {lang === "en" ? "Total" : "合計"}: {country.co2Total.toLocaleString()} MtCO₂ / {lang === "en" ? "yr" : "年"}
            <br />
            {lang === "en" ? "Per capita" : "1人あたり"}: {country.co2PerCapita.toFixed(1)} tCO₂
            <br />
            {avgLabel}
          </div>
        </Html>
      )}
    </a.mesh>
  );
}

function Stars() {
  const points = useRef<THREE.Points>(null!);
  const geo = (() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 300 + Math.random() * 200;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  })();

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial color="#ff9944" size={0.5} sizeAttenuation transparent opacity={0.35} />
    </points>
  );
}

function CameraSetup({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, 60, isMobile ? 170 : 120);
    cam.fov = isMobile ? 65 : 55;
    cam.updateProjectionMatrix();
  }, [isMobile, camera]);
  return null;
}

function Scene({ lang, resetKey, isMobile }: { lang: "ja" | "en"; resetKey: number; isMobile: boolean }) {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useFrame(() => {
    if (!globeRef.current) return;
    globeRef.current.rotation.y -= 0.001;
    globeRef.current.rotation.x -= 0.0006;
    globeRef.current.rotation.z -= 0.0004;
  });

  return (
    <>
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.25} luminanceSmoothing={0.9} />
      </EffectComposer>

      <pointLight decay={0} position={[100, 100, 100]} intensity={1.2} />
      <pointLight decay={0.5} position={[-100, -100, -100]} intensity={0.4} />
      <ambientLight intensity={0.5} />
      <hemisphereLight groundColor={0x1a0800} intensity={1.0} />

      <CameraSetup isMobile={isMobile} />
      <Suspense fallback={null}>
        <Stars />
        <group ref={globeRef} scale={isMobile ? 0.62 : 1}>
          {spheres.map((s) => (
            <RotatingSphere
              key={s.code}
              position={s.position}
              radius={s.size}
              color={s.color}
              country={s}
              onHoverCountry={setHoveredCountry}
              lang={lang}
              resetKey={resetKey}
              isMobile={isMobile}
            />
          ))}
          <CarbonFlowLinks hoveredCountry={hoveredCountry} />
        </group>
      </Suspense>

      <OrbitControls enablePan={false} enableZoom enableDamping maxDistance={50} />
    </>
  );
}

export default function Page() {
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [resetKey, setResetKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#060302" }}>
      <Canvas
        camera={{ position: [0, 60, 120], fov: 55, near: 1, far: 2000 }}
        onPointerMissed={() => setResetKey((k) => k + 1)}
      >
        <Scene lang={lang} resetKey={resetKey} isMobile={isMobile} />
      </Canvas>
      <InfoPanel lang={lang} onLangChange={setLang} defaultOpen={!isMobile} />
    </div>
  );
}
