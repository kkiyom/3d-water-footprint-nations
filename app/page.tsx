"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Water } from "three-stdlib";
import { extend } from "@react-three/fiber";

extend({ Water });

type CountryWaterFootprint = {
  name: string;
  code: string;
  wfTotal: number;
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

const countryWaterFootprints: CountryWaterFootprint[] = [
  { name: '中国', code: 'CN', wfTotal: 1368003.7 },
  { name: 'インド', code: 'IN', wfTotal: 1144605.1 },
  { name: 'アメリカ', code: 'US', wfTotal: 821353.7 },
  { name: 'ブラジル', code: 'BR', wfTotal: 355373.6 },
  { name: 'ロシア', code: 'RU', wfTotal: 270490.4 },
  { name: 'インドネシア', code: 'ID', wfTotal: 232238.6 },
  { name: 'ナイジェリア', code: 'NG', wfTotal: 157335.7 },
  { name: 'パキスタン', code: 'PK', wfTotal: 199429.0 },
  { name: 'カナダ', code: 'CA', wfTotal: 72074.3 },
  { name: 'タイ', code: 'TH', wfTotal: 88623.5 },
  { name: 'メキシコ', code: 'MX', wfTotal: 197425.1 },
  { name: 'アルゼンチン', code: 'AR', wfTotal: 59546.2 },
  { name: 'トルコ', code: 'TR', wfTotal: 109757.9 },
  { name: 'イラン', code: 'IR', wfTotal: 125348.3 },
  { name: 'ベトナム', code: 'VN', wfTotal: 83817.6 },
  { name: 'マレーシア', code: 'MY', wfTotal: 49339.9 },
  { name: 'エチオピア', code: 'ET', wfTotal: 77632.3 },
  { name: 'イタリア', code: 'IT', wfTotal: 132466.4 },
  { name: 'エジプト', code: 'EG', wfTotal: 95155.5 },
  { name: 'フランス', code: 'FR', wfTotal: 106131.9 },
  { name: 'スペイン', code: 'ES', wfTotal: 100520.0 },
  { name: 'モロッコ', code: 'MA', wfTotal: 49952.6 },
  { name: 'ドイツ', code: 'DE', wfTotal: 117151.5 },
  { name: 'ポーランド', code: 'PL', wfTotal: 53980.0 },
  { name: 'ウクライナ', code: 'UA', wfTotal: 76744.4 },
  { name: 'オーストラリア', code: 'AU', wfTotal: 44718.2 },
  { name: '日本', code: 'JP', wfTotal: 174779.2 },
  { name: 'イギリス', code: 'GB', wfTotal: 74645.7 },
  { name: 'オランダ', code: 'NL', wfTotal: 23372.9 },
  { name: 'スウェーデン', code: 'SE', wfTotal: 12724.1 },
  { name: 'ノルウェー', code: 'NO', wfTotal: 6405.0 },
  { name: 'バングラデシュ', code: 'BD', wfTotal: 109116.6 },
  { name: 'ヨルダン', code: 'JO', wfTotal: 8316.5 },
  { name: 'サウジアラビア', code: 'SA', wfTotal: 39046.6 },
  { name: '南アフリカ', code: 'ZA', wfTotal: 56723.7 },
  { name: '韓国', code: 'KR', wfTotal: 75669.8 },
];

const minWF = Math.min(...countryWaterFootprints.map((c) => c.wfTotal));
const maxWF = Math.max(...countryWaterFootprints.map((c) => c.wfTotal));

//お風呂・プール換算
const BATH_TUB_M3 = 0.2;
const POOL_M3 = 25 * 10 * 1.5;

function getEquivalents(wfPerCapita: number) {
  const baths = wfPerCapita / BATH_TUB_M3;
  const pools = wfPerCapita / POOL_M3;
  return { baths, pools };
}

//球体配置
// lat: 緯度（-90〜90）、lon: 経度（-180〜180）
function latLonToXYZ(
  latDeg: number,
  lonDeg: number,
  r: number
): [number, number, number] {
  const lonRad = -lonDeg * Math.PI / 180; 
  const latRad =  latDeg * Math.PI / 180;
  // x = r · cosφ · cosλ
  // y = r · sinφ
  // z = r · cosφ · sinλ
  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

const EARTH_RADIUS = 20;

const spheres: SphereInfo[] = (() => {
  const result: SphereInfo[] = [];

  countryWaterFootprints.forEach((country, index) => {
    const t =
      (country.wfTotal - minWF) / (maxWF - minWF || 1); // 0〜1
    const size = 0.8 + t * 4.8;

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
      color: waterBlueGradient(country.wfTotal),
      position,
    });
  });

  return result;
})();


function waterBlueGradient(wf: number): THREE.Color {
  const tRaw = (wf - minWF) / (maxWF - minWF || 1);
  const t = Math.min(Math.max(tRaw, 0), 1);

  if (t <= 0.01) {
    return new THREE.Color(0xffffff);
  }

  let h: number, s: number, l: number;

  if (t <= 0.08) {
    const u = (t - 0.01) / (0.08 - 0.01);
    h = 190 / 360;
    s = 0.05 + (0.5 - 0.05) * u;
    l = 0.96 + (0.8 - 0.96) * u;
  } else if (t <= 0.25) {
    const u = (t - 0.08) / (0.25 - 0.08);
    h = (190 + (200 - 190) * u) / 360;
    s = 0.5 + (0.7 - 0.35) * u;
    l = 0.6 + (0.72 - 0.88) * u;
  } else {
    const u = Math.pow((t - 0.25) / (1 - 0.25), 0.9);
    h = (200 + (220 - 200) * u) / 360;
    s = 0.7 + (1.0 - 0.7) * u;
    l = 0.4 + (0.4 - 0.72) * u;
  }

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
};

const AnimatedMaterial = a(MeshDistortMaterial);

function RotatingSphere({ position, radius, color, country }: RotatingSphereProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const { baths, pools } = getEquivalents(country.wfTotal);

  // サンプルの wobble / coat / env を簡略化したやつ
  const [spring, api] = useSpring(() => ({
    wobble: 1,
    coat: 0.8,
    env: 0.9,
    color: "#" + color.getHexString(),
    config: { mass: 2, tension: 800, friction: 15 },
  }));

  // 形は変えず、ゆっくり回転だけ
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.003;
  });

  // 半径を 0〜1 に正規化（size ≒ 0.8〜5.6 を想定）
  const normSize = Math.min(Math.max((radius - 0.8) / 4.8, 0), 1);

  // distort の下限・上限をかなり分ける
  const distortSmall = 0.27; // 一番小さい球
  const distortLarge = 0.06; // 一番大きい球はほぼツルツル
  // 線形補間（大きくなるほど distort が小さくなる）
  const distortAmount = distortSmall + (distortLarge - distortSmall) * normSize;

  return (
    <a.mesh
      ref={ref}
      position={position}
      scale={spring.wobble.to((w) => [w, w, w])}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        api.start({
          wobble: 1.1,
          coat: 1.0,
          env: 1.0,
        });
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "default";
        // 元のサイズにぷるぷる戻る
        api.start({
          wobble: 1,
          coat: 0.8,
          env: 0.9,
        });
      }}
    >
      <sphereGeometry args={[radius, 64, 64]} />

      <AnimatedMaterial
        // 色は spring からとる（将来変えたくなったときのため）
        color={spring.color}
        distort={distortAmount}
        speed={0}
        envMapIntensity={spring.env}
        clearcoat={spring.coat}
        clearcoatRoughness={0}
        metalness={0.1}
        toneMapped={false}
      />

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
            {country.wfTotal} m³ / 年
            <br />
            {/* お風呂 約 {Math.round(baths).toLocaleString()} 杯 */}

          </div>
        </Html>
      )}
    </a.mesh>
  );
}

function Ocean() {
  const ref = useRef<any>(null);
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, "/images/waternormals.jpeg");
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

function Scene() {
  const globeRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!globeRef.current) return;

    // globeRef.current.rotation.y -= 0.001; // メイン回転
    // globeRef.current.rotation.x -= 0.0006; // 斜め回転を少し追加
    // globeRef.current.rotation.z -= 0.0004; 
  });

  return (
    <>
      <pointLight decay={0} position={[100, 100, 100]} intensity={1.2} />
      <pointLight decay={0.5} position={[-100, -100, -100]} intensity={0.4} />
      <ambientLight intensity={0.5} />
      <hemisphereLight
        groundColor={0x222222} // 反射
        intensity={1.0}
      />


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
            />
          ))}
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
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#020817" }}>
      <Canvas camera={{ position: [0, 60, 120], fov: 55, near: 1, far: 2000 }}>
        <Scene />
      </Canvas>
    </div>
  );
}


