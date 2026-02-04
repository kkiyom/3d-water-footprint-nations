"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, MeshDistortMaterial, Sky } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo } from "react";
import { a, useSpring } from "@react-spring/three";
import { Water } from "three-stdlib";
import { extend } from "@react-three/fiber";

export default function Page() {
  return (
    <><div>
      <a href="/waterfootprint">ウォータフットプリント</a>
    </div><div>
        <a href="/soccerball">Soccer Ball</a>
      </div></>
  );
}


