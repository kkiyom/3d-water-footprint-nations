"use client";

import React from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { Suspense, useMemo, useRef } from "react"
import { useFrame, MeshProps } from "@react-three/fiber"
import { useGLTF, RenderTexture, PerspectiveCamera, Text } from "@react-three/drei"
import { useRouter } from "next/navigation"

export default function Page(): JSX.Element {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Canvas camera={{ fov: 40, position: [5, 5, 5] }}
  dpr={[1, 2]}>
        {/* <ambientLight intensity={0.9} /> */}
        <directionalLight position={[2, 2, 2]} intensity={1.4} />
        <color attach="background" />
        <Suspense fallback={null}>
          <ComputersScene />
        </Suspense>
      </Canvas>
    </div>
  )
}

type ScreenScrollProps = {
  geometry: THREE.BufferGeometry
  text: string
}

type ScreenLinkProps = {
  geometry: THREE.BufferGeometry
  href: string
  label: string
}

type ScreenScrollConfig = { name: string; type: "scroll"; text: string }
type ScreenLinkConfig = { name: string; type: "link"; href: string; label: string }

type ScreenConfig = ScreenScrollConfig | ScreenLinkConfig

type NodesMap = Record<string, THREE.Mesh>

export function ComputersScene(): JSX.Element {
  // useGLTFの返り値を最低限型付け
  const { nodes } = useGLTF("/Computers2.glb") as unknown as { nodes: NodesMap }

  const screens: ScreenConfig[] = useMemo(
    () => [
      { name: "screen1", type: "scroll", text: "WATER FOOTPRINT  •  WATER FOOTPRINT  •  " },
      { name: "screen2", type: "link", href: "/waterfootprint", label: "ウォータフットプリント" },
      { name: "screen3", type: "link", href: "/soccerball", label: "Soccer Ball" },
    ],
    []
  )

  return (
    <group>
      {screens.map((s) => {
        const obj = nodes[s.name]
        if (!obj) return null
        console.log(obj.position, obj.rotation, obj.scale)
        console.log(Object.keys(nodes))

        if (s.type === "scroll") {
          // ここで s は scroll 型に絞られるので s.text が安全
          return <ScreenScroll key={s.name} geometry={obj.geometry} text={s.text} />
        }

        if (s.type === "link") {
          // ここで s は link 型に絞られるので s.href / s.label が安全
          return <ScreenLink key={s.name} geometry={obj.geometry} href={s.href} label={s.label} />
        }

        return null
      })}
    </group>
  )
}

useGLTF.preload("/Computers2.glb")

// //文字を流す
function ScreenScroll({ geometry, text }: ScreenScrollProps) {
  const textRef = useRef<any>(null)

  useFrame(() => {
    if (!textRef.current) return
    textRef.current.position.x -= 0.08
    if (textRef.current.position.x < -14) {
      textRef.current.position.x = 14
    }
  })

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial toneMapped={false}>
        <RenderTexture attach="map">
          <PerspectiveCamera makeDefault manual aspect={2} position={[0, 0, 15]} />
          <color attach="background" args={["#35c19f"]} />
          <ambientLight intensity={1} />
          <Text
            ref={textRef}
            font="/Inter-Medium.woff"
            fontSize={4}
            color="black"
          >
            {text}
          </Text>
        </RenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}

//遷移
function ScreenLink({ geometry, href, label }: ScreenLinkProps) {
  const router = useRouter()

  return (
    <mesh
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation()
        router.push(href)
      }}
    >
      <meshBasicMaterial toneMapped={false}>
        <RenderTexture attach="map">
          <PerspectiveCamera makeDefault manual aspect={2} position={[0, 0, 15]} />
          <color attach="background" args={["black"]} />
          <ambientLight intensity={1} />
          <Text font="/Inter-Medium.woff" fontSize={3} color="#35c19f">
            {label}
          </Text>
        </RenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}

// export default function Page() {
//   return (
//     <><div>
//       <a href="/waterfootprint">ウォータフットプリント</a>
//     </div><div>
//         <a href="/soccerball">Soccer Ball</a>
//       </div></>
//   );
// }


