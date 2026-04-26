"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Water } from "three-stdlib";
import { extend } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import InfoPanel from "./Infopanel";
import { buildEstimatedBilateralFlows2016 } from "../data/waterFlows";

const BASE_URL = process.env.NEXT_PUBLIC_ASSET_URL ?? '';

extend({ Water });

type CountryWaterFootprint = {
  name: string;
  code: string;
  wfTotal: number;
  wfPerCapita: number;
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
};

const countryNamesEn: Record<string, string> = {
  CN: 'China', IN: 'India', US: 'United States', BR: 'Brazil', RU: 'Russia',
  ID: 'Indonesia', NG: 'Nigeria', PK: 'Pakistan', CA: 'Canada', TH: 'Thailand',
  MX: 'Mexico', AR: 'Argentina', TR: 'Turkey', IR: 'Iran', VN: 'Vietnam',
  MY: 'Malaysia', ET: 'Ethiopia', IT: 'Italy', EG: 'Egypt', FR: 'France',
  ES: 'Spain', MA: 'Morocco', DE: 'Germany', PL: 'Poland', UA: 'Ukraine',
  AU: 'Australia', JP: 'Japan', GB: 'United Kingdom', NL: 'Netherlands',
  SE: 'Sweden', NO: 'Norway', BD: 'Bangladesh', JO: 'Jordan', SA: 'Saudi Arabia',
  ZA: 'South Africa', KR: 'South Korea',
};

const countryWaterFootprints: CountryWaterFootprint[] = [
  { name: '中国', code: 'CN', wfTotal: 1368003.7, wfPerCapita: 1071 },
  { name: 'インド', code: 'IN', wfTotal: 1144605.1, wfPerCapita: 1089 },
  { name: 'アメリカ', code: 'US', wfTotal: 821353.7, wfPerCapita: 2842 },
  { name: 'ブラジル', code: 'BR', wfTotal: 355373.6, wfPerCapita: 1861 },
  { name: 'ロシア', code: 'RU', wfTotal: 270490.4, wfPerCapita: 1858 },
  { name: 'インドネシア', code: 'ID', wfTotal: 232238.6, wfPerCapita: 1064 },
  { name: 'ナイジェリア', code: 'NG', wfTotal: 157335.7, wfPerCapita: 1084 },
  { name: 'パキスタン', code: 'PK', wfTotal: 199429.0, wfPerCapita: 1218 },
  { name: 'カナダ', code: 'CA', wfTotal: 72074.3, wfPerCapita: 2194 },
  { name: 'タイ', code: 'TH', wfTotal: 88623.5, wfPerCapita: 1345 },
  { name: 'メキシコ', code: 'MX', wfTotal: 197425.1, wfPerCapita: 1978 },
  { name: 'アルゼンチン', code: 'AR', wfTotal: 59546.2, wfPerCapita: 1620 },
  { name: 'トルコ', code: 'TR', wfTotal: 109757.9, wfPerCapita: 1544 },
  { name: 'イラン', code: 'IR', wfTotal: 125348.3, wfPerCapita: 1823 },
  { name: 'ベトナム', code: 'VN', wfTotal: 83817.6, wfPerCapita: 1013 },
  { name: 'マレーシア', code: 'MY', wfTotal: 49339.9, wfPerCapita: 1889 },
  { name: 'エチオピア', code: 'ET', wfTotal: 77632.3, wfPerCapita: 1022 },
  { name: 'イタリア', code: 'IT', wfTotal: 132466.4, wfPerCapita: 2332 },
  { name: 'エジプト', code: 'EG', wfTotal: 95155.5, wfPerCapita: 1302 },
  { name: 'フランス', code: 'FR', wfTotal: 106131.9, wfPerCapita: 1786 },
  { name: 'スペイン', code: 'ES', wfTotal: 100520.0, wfPerCapita: 2461 },
  { name: 'モロッコ', code: 'MA', wfTotal: 49952.6, wfPerCapita: 1567 },
  { name: 'ドイツ', code: 'DE', wfTotal: 117151.5, wfPerCapita: 1426 },
  { name: 'ポーランド', code: 'PL', wfTotal: 53980.0, wfPerCapita: 1409 },
  { name: 'ウクライナ', code: 'UA', wfTotal: 76744.4, wfPerCapita: 1625 },
  { name: 'オーストラリア', code: 'AU', wfTotal: 44718.2, wfPerCapita: 2315 },
  { name: '日本', code: 'JP', wfTotal: 174779.2, wfPerCapita: 1380 },
  { name: 'イギリス', code: 'GB', wfTotal: 74645.7, wfPerCapita: 1258 },
  { name: 'オランダ', code: 'NL', wfTotal: 23372.9, wfPerCapita: 1426 },
  { name: 'スウェーデン', code: 'SE', wfTotal: 12724.1, wfPerCapita: 1402 },
  { name: 'ノルウェー', code: 'NO', wfTotal: 6405.0, wfPerCapita: 1381 },
  { name: 'バングラデシュ', code: 'BD', wfTotal: 109116.6, wfPerCapita: 745 },
  { name: 'ヨルダン', code: 'JO', wfTotal: 8316.5, wfPerCapita: 1303 },
  { name: 'サウジアラビア', code: 'SA', wfTotal: 39046.6, wfPerCapita: 1604 },
  { name: '南アフリカ', code: 'ZA', wfTotal: 56723.7, wfPerCapita: 1142 },
  { name: '韓国', code: 'KR', wfTotal: 75669.8, wfPerCapita: 1629 },
];

const ARC_BASE_COLOR = "#AEE6FF";     // 通常
const ARC_EXPORT_HOVER = "#eaf75bc3";   // 輸出 (黄色)
const ARC_IMPORT_HOVER = "#5f64fb";   // 輸入（紫）
const ARC_LINK_HOVER = "#62D2C6";     // arc直接hover（黄色）

const minWF = Math.min(...countryWaterFootprints.map((c) => c.wfPerCapita));
const maxWF = Math.max(...countryWaterFootprints.map((c) => c.wfPerCapita));

//お風呂・プール換算
const BATH_TUB_M3 = 0.2;
const POOL_M3 = 25 * 10 * 1.5;
const POOL_SWITCH_AT_M3 = 375; // 1人あたりが1プール以上ならプール表記

function getEquivalentLabel(perCapitaM3: number, lang: "ja" | "en" = "ja") {
  const baths = perCapitaM3 / BATH_TUB_M3;
  const pools = perCapitaM3 / POOL_M3;

  if (lang === "en") {
    return perCapitaM3 >= POOL_SWITCH_AT_M3
      ? `≈ ${Math.round(pools).toLocaleString()} pools / person / year`
      : `≈ ${Math.round(baths).toLocaleString()} bathtubs / person / year`;
  }

  if (perCapitaM3 >= POOL_SWITCH_AT_M3) {
    return `プール 約 ${Math.round(pools).toLocaleString()} 杯分 / 人 / 年`;
  }
  return `お風呂 約 ${Math.round(baths).toLocaleString()} 杯分 / 人 / 年`;
}

//球体配置
// lat: 緯度（-90〜90）、lon: 経度（-180〜180）
function latLonToXYZ(
  latDeg: number,
  lonDeg: number,
  r: number
): [number, number, number] {
  const lonRad = -lonDeg * Math.PI / 180;
  const latRad = latDeg * Math.PI / 180;
  // x = r · cosφ · cosλ
  // y = r · sinφ
  // z = r · cosφ · sinλ
  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

const EARTH_RADIUS = 16;

const spheres: SphereInfo[] = (() => {
  const result: SphereInfo[] = [];

  countryWaterFootprints.forEach((country, index) => {
    const t =
      (country.wfPerCapita - minWF) / (maxWF - minWF || 1); // 0〜1
    const size = 0.4 + Math.pow(t, 1.4) * 6.0;

    const baseCoord = countryCoords[country.code] ?? { lat: 0, lon: 0 };
    let lat = baseCoord.lat;
    let lon = baseCoord.lon;

    let position: [number, number, number] = latLonToXYZ(lat, lon, EARTH_RADIUS);

    const maxTries = 60;
    for (let tries = 0; tries < maxTries; tries++) {
      let collision = false;

      for (const s of result) {
        const dx = position[0] - s.position[0];
        const dy = position[1] - s.position[1];
        const dz = position[2] - s.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const minDist = (size + s.size) * 1.15; // 少し余裕を持たせる
        if (dist < minDist) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        break; // OK な位置が見つかった
      }

      // ぶつかっている場合：徐々に広い範囲でジッターさせる
      // spread は 3° → 20° くらいまで広がるイメージ
      const spread = Math.min(3 + tries * 1.5, 20);

      const jitterLat =
        (rand(index * 10 + tries) * 2 - 1) * spread; // -spread〜+spread 度
      const jitterLon =
        (rand(index * 17 + tries) * 2 - 1) * spread;

      lat = baseCoord.lat + jitterLat;
      lon = baseCoord.lon + jitterLon;

      // 緯度が極端になりすぎないようにクランプ
      if (lat > 85) lat = 85;
      if (lat < -85) lat = -85;

      // 経度は -180〜180 にラップ
      if (lon > 180) lon -= 360;
      if (lon < -180) lon += 360;

      position = latLonToXYZ(lat, lon, EARTH_RADIUS);
    }

    result.push({
      ...country,
      size,
      color: waterBlueGradient(country.wfPerCapita),
      position,
    });
  });

  return result;
})();

const posByCode = (() => {
  const map: Record<string, THREE.Vector3> = {};
  for (const s of spheres) {
    map[s.code] = new THREE.Vector3(s.position[0], s.position[1], s.position[2]);
  }
  // ハブ（中心点）を追加
  map["WORLD"] = new THREE.Vector3(0, 0, 0);
  return map;
})();

function waterBlueGradient(wf: number): THREE.Color {
  const tRaw = (wf - minWF) / (maxWF - minWF || 1);
  const t = Math.min(Math.max(tRaw, 0), 1);

  // 白みがかった水色（t=0） → 深い藍色（t=1）
  const h = (196 + t * 30) / 360;   // 196°(空色) → 226°(藍)
  const s = 0.18 + t * 0.82;        // 淡い → 鮮やか
  const l = 0.94 - t * 0.76;        // 明るい白 → 濃い紺

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

type RotatingSphereProps = {
  position: [number, number, number];
  radius: number;
  color: THREE.Color;
  country: CountryWaterFootprint;
  onHoverCountry?: (code: string | null) => void;
  lang?: "ja" | "en";
  resetKey?: number;
  isMobile?: boolean;
};

const AnimatedMaterial = a(MeshDistortMaterial);

function RotatingSphere({ position, radius, color, country, onHoverCountry, lang = "ja", resetKey, isMobile = false }: RotatingSphereProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setHovered(false);
    onHoverCountry?.(null);
  }, [resetKey]);
  const compareLabel = getEquivalentLabel(country.wfPerCapita, lang);
  const displayName = lang === "en" ? (countryNamesEn[country.code] ?? country.name) : country.name;

  const [spring, api] = useSpring(() => ({
    wobble: 1,
    config: { mass: 2, tension: 800, friction: 15 },
  }));

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.003;
  });

  const normSize = Math.min(Math.max((radius - 0.4) / 6.0, 0), 1);
  const distortAmount = 0.27 + (0.06 - 0.27) * normSize;
  const baseHex = "#" + color.getHexString();

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
      <sphereGeometry args={[radius, 64, 64]} />
      <AnimatedMaterial
        color={hovered ? "#6efbf6" : baseHex}
        distort={distortAmount}
        speed={0}
        envMapIntensity={0.9}
        clearcoat={0.8}
        clearcoatRoughness={0}
        metalness={0.1}
        toneMapped={false}
      />

      {hovered && (
        <Html center distanceFactor={20} style={{ pointerEvents: "none" }}>
          <div style={{
            padding: isMobile ? "10px 14px" : "18px 28px",
            borderRadius: "16px",
            background: "rgba(30, 12, 50, 0.92)",
            border: "1px solid rgba(255, 220, 255, 0.7)",
            color: "white",
            fontSize: isMobile ? "13px" : "17px",
            lineHeight: "1.7",
            whiteSpace: "nowrap",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}>
            <strong style={{ fontSize: isMobile ? "15px" : "19px" }}>{displayName}</strong>
            <br />
            {lang === "en" ? "Total" : "合計"}: {country.wfTotal.toLocaleString()} m³ / {lang === "en" ? "yr" : "年"}
            <br />
            {lang === "en" ? "Per capita" : "1人あたり"}: {country.wfPerCapita.toLocaleString()} m³
            <br />
            {compareLabel}
          </div>
        </Html>
      )}
    </a.mesh>
  );
}

const flows = buildEstimatedBilateralFlows2016({
  topExporters: 6,
  topImporters: 6,
  excludeSelf: true,
  includeROW: false,
});

function mapThickness(value: number, minV: number, maxV: number) {
  // 安全対策
  const v = Math.max(1e-6, value);
  const min = Math.max(1e-6, minV);
  const max = Math.max(min * 1.01, maxV);

  // log 正規化（差がはっきり出る）
  const t =
    (Math.log(v) - Math.log(min)) /
    (Math.log(max) - Math.log(min));
  const clamped = Math.min(1, Math.max(0, t));

  // ★ 幅
  const minR = 0.04;  // 最小
  const maxR = 2;  // 最大
  return minR + clamped * (maxR - minR);
}

function greatCirclePoints(
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3,
  baseRadius: number,
  segments: number,
  liftMax: number // 0なら完全に球面ピッタリ、少し浮かせるなら 0.5〜3 くらい
) {
  const a = fromPos.clone().normalize();
  const b = toPos.clone().normalize();

  const omega = a.angleTo(b);
  const sinOmega = Math.sin(omega);

  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    let dir: THREE.Vector3;
    if (sinOmega < 1e-6) {
      // ほぼ同じ方向
      dir = a.clone();
    } else {
      // slerp（球面線形補間）
      const s0 = Math.sin((1 - t) * omega) / sinOmega;
      const s1 = Math.sin(t * omega) / sinOmega;
      dir = a.clone().multiplyScalar(s0).add(b.clone().multiplyScalar(s1)).normalize();
    }

    // 中央ほど少しだけ外側に膨らませる（膜が見やすい）
    const lift = liftMax * Math.sin(Math.PI * t);
    pts.push(dir.multiplyScalar(baseRadius + lift));
  }

  return pts;
}

// ====== 4) 1本のアーチ線（ArcLink） ======
function ArcLink({
  value, fromPos, toPos, minV, maxV, highlighted, color,
}: {
  value: number; fromPos: THREE.Vector3; toPos: THREE.Vector3;
  minV: number; maxV: number; highlighted: boolean; color: string;
  onHover?: (id: string | null) => void;
}) {
  const progressRef = useRef(0);

  const { geometry, indexCount } = useMemo(() => {
    const width = mapThickness(value, minV, maxV);
    const segments = 90;
    const points = greatCirclePoints(fromPos, toPos, EARTH_RADIUS, segments, 2.0);
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const taper = Math.sin(Math.PI * t); // 両端0→中央1→両端0（尖る）
      const w = width * taper;
      const p = points[i];
      const tangent = i < points.length - 1
        ? points[i + 1].clone().sub(p)
        : p.clone().sub(points[i - 1]);
      tangent.normalize();
      const normal = new THREE.Vector3()
        .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
        .normalize()
        .multiplyScalar(w * 0.5);
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
      material.color.set(color);
    } else {
      progressRef.current = Math.max(0, progressRef.current - delta * 8);
    }
    geometry.setDrawRange(0, Math.floor(progressRef.current * indexCount));
  });

  return <mesh geometry={geometry} material={material} />;
}

function FlowLinks({
  hoveredCountry,
  hoveredLink,
  setHoveredLink,
}: {
  hoveredCountry: string | null;
  hoveredLink: string | null;
  setHoveredLink: (id: string | null) => void;
}) {
  const { minV, maxV } = useMemo(() => {
    const values = flows.map((f) => f.value).filter((v) => Number.isFinite(v));
    return { minV: Math.min(...values), maxV: Math.max(...values) };
  }, []);


  return (
    <>
      {flows.map((f, i) => {
  const fromPos = posByCode[f.from];
  const toPos = posByCode[f.to];
  if (!fromPos || !toPos) return null;

  const id = `${f.from}-${f.to}-${f.kind}-${i}`;

  const isArcHovered = hoveredLink === id;

  const isExportFromHoveredCountry =
    hoveredCountry !== null && f.from === hoveredCountry; // 出る=輸出
  const isImportToHoveredCountry =
    hoveredCountry !== null && f.to === hoveredCountry;   // 入る=輸入

  // ★通常は薄水色のまま
  let color = ARC_BASE_COLOR;
  let emphasized = false;

  // ★優先順位：arc直接hover > 国ホバー輸出/輸入 > 通常
  if (isArcHovered) {
    color = ARC_LINK_HOVER;
    emphasized = true;
  } else if (isExportFromHoveredCountry) {
    color = ARC_EXPORT_HOVER; // 黄色
    emphasized = true;
  } else if (isImportToHoveredCountry) {
    color = ARC_IMPORT_HOVER; // 紫（ホバー時だけ）
    emphasized = true;
  }

  return (
    <ArcLink
      key={id}
      value={f.value}
      fromPos={fromPos}
      toPos={toPos}
      minV={minV}
      maxV={maxV}
      highlighted={emphasized}
      color={color}
      onHover={setHoveredLink}
    />
  );
})}

    </>
  );
}

function Ocean() {
  const ref = useRef<any>(null);
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, `${BASE_URL}/waternormals.jpeg`);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []);

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    }),
    [waterNormals]
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    // three-stdlib の Water は material.uniforms.time を持っている
    ref.current.material.uniforms.time.value += delta;
  });

  return (
    // @ts-ignore three-stdlib の Water を primitive として使う
    <water ref={ref} args={[geom, config]} rotation-x={-Math.PI / 2} position={[0, -40, 0]} />
  );
}

function CameraSetup({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, 40, isMobile ? 110 : 80);
    cam.fov = isMobile ? 55 : 40;
    cam.updateProjectionMatrix();
  }, [isMobile, camera]);
  return null;
}

function Scene({ lang, resetKey, isMobile }: { lang: "ja" | "en"; resetKey: number; isMobile: boolean }) {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useFrame((state, delta) => {
    if (!globeRef.current) return;

    globeRef.current.rotation.y -= 0.001; // メイン回転
    globeRef.current.rotation.x -= 0.0006; // 斜め回転を少し追加
    globeRef.current.rotation.z -= 0.0004;
  });

  return (
    <>
      {/* <fog attach="fog" args={["#05070b", 22, 100]} /> */}
      <EffectComposer>
        <Bloom
          intensity={0.25}
          luminanceThreshold={0.28}
          luminanceSmoothing={0.18}
        />
      </EffectComposer>
      <pointLight decay={0} position={[100, 100, 100]} intensity={1.2} />
      <pointLight decay={0.5} position={[-100, -100, -100]} intensity={0.4} />
      <ambientLight intensity={0.5} />
      <hemisphereLight
        groundColor={0x222222} // 反射
        intensity={1.0}
      />


      <CameraSetup isMobile={isMobile} />
      <Suspense fallback={null}>
        {/* 海は固定（回転しない） */}
        <Ocean />

        {/* 地球儀（球の集合）だけ回す */}
        <group ref={globeRef}>



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
          <FlowLinks
            hoveredCountry={hoveredCountry}
            hoveredLink={hoveredLink}
            setHoveredLink={setHoveredLink}
          />
        </group>

        {/* 空も固定 */}
        <Sky
          sunPosition={[500, 150, -1000]}
          turbidity={1.0}
          rayleigh={1.5}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableDamping
        maxDistance={50}
      />
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
    <div style={{ width: "100vw", height: "100vh", background: "#020817" }}>
      <Canvas
        camera={{ position: [0, 40, 80], fov: 40, near: 1, far: 2000 }}
        onPointerMissed={() => setResetKey((k) => k + 1)}
      >
        <Scene lang={lang} resetKey={resetKey} isMobile={isMobile} />
      </Canvas>
      <InfoPanel lang={lang} onLangChange={setLang} defaultOpen={!isMobile} />
    </div>
  );
}


