"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ═══════════════════════════════════════════
// Blossom texture — 5-petal flower with stamen
// ═══════════════════════════════════════════

function makeBlossomTex(baseColor: string): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const cx = s / 2, cy = s / 2;

  // Outer petals
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.08;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * s * 0.08, cy + Math.sin(a) * s * 0.08);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 0, -s * 0.28);
    g.addColorStop(0, "#fffef8");
    g.addColorStop(0.2, baseColor);
    g.addColorStop(0.6, baseColor + "dd");
    g.addColorStop(1, baseColor + "44");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.1, -s * 0.05, s * 0.08, -s * 0.2, 0, -s * 0.28);
    ctx.bezierCurveTo(-s * 0.08, -s * 0.2, -s * 0.1, -s * 0.05, 0, 0);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // Inner petals (smaller, offset)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.35;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * s * 0.04, cy + Math.sin(a) * s * 0.04);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 0, -s * 0.16);
    g.addColorStop(0, "#fffef8");
    g.addColorStop(0.3, baseColor);
    g.addColorStop(1, baseColor + "88");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.06, -s * 0.03, s * 0.05, -s * 0.12, 0, -s * 0.16);
    ctx.bezierCurveTo(-s * 0.05, -s * 0.12, -s * 0.06, -s * 0.03, 0, 0);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // Center
  const ctr = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.1);
  ctr.addColorStop(0, "#fffef0");
  ctr.addColorStop(0.5, "#fde68a");
  ctr.addColorStop(1, "rgba(253,230,138,0)");
  ctx.fillStyle = ctr;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Stamen dots
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? "#fbbf24" : "#f59e0b";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * s * 0.04, cy + Math.sin(a) * s * 0.04, s * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const blossomPalette = ["#f9d4e5", "#fce7f3", "#fde8ef", "#fdf2f8", "#fde68a", "#fef3c7"];
const blossomTexs = blossomPalette.map(makeBlossomTex);

// ═══════════════════════════════════════════
// 3D TREE — trunk mesh + foliage point cloud
// ═══════════════════════════════════════════

function TreeTrunk() {
  // Build a tapered trunk using a custom geometry
  const geom = useMemo(() => {
    const height = 3.8;
    const baseRadius = 0.22;
    const topRadius = 0.08;
    const segments = 32;
    const rings = 20;

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    for (let r = 0; r <= rings; r++) {
      const t = r / rings;
      const y = t * height - 1.2; // base at y=-1.2
      const radius = baseRadius + (topRadius - baseRadius) * t;

      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const nx = Math.cos(a);
        const nz = Math.sin(a);
        positions.push(nx * radius, y, nz * radius);
        normals.push(nx, 0.15, nz);
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * (segments + 1) + s;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    return geo;
  }, []);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#4a2c0a" roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// Major branches
function Branches() {
  const branches = useMemo(() => {
    const result: { start: [number, number, number]; end: [number, number, number]; radius: number }[] = [];

    const trunkTop: [number, number, number] = [0, 2.2, 0.1];

    // Define branch start/end points
    const defs: { end: [number, number, number]; radius: number }[] = [
      { end: [-1.2, 1.2, 0.8], radius: 0.09 },
      { end: [1.3, 1.1, 0.7], radius: 0.09 },
      { end: [-1.8, 0.45, 1.2], radius: 0.07 },
      { end: [1.9, 0.35, 1.1], radius: 0.07 },
      { end: [-0.9, 1.75, 0.5], radius: 0.08 },
      { end: [1.0, 1.65, 0.4], radius: 0.08 },
      { end: [-0.5, 2.55, 0.2], radius: 0.05 },
      { end: [0.55, 2.45, 0.15], radius: 0.05 },
      { end: [-2.4, -0.25, 1.5], radius: 0.05 },
      { end: [2.5, -0.35, 1.4], radius: 0.05 },
      { end: [-3.0, 0.65, -0.3], radius: 0.06 },
      { end: [3.1, 0.55, -0.4], radius: 0.06 },
    ];

    for (const d of defs) {
      result.push({ start: trunkTop, end: d.end, radius: d.radius });
    }

    return result;
  }, []);

  return (
    <group>
      {branches.map((b, i) => {
        const start = new THREE.Vector3(...b.start);
        const end = new THREE.Vector3(...b.end);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        mid.y += 0.15; // slight upward curve
        const curve = new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
        const tubeGeo = new THREE.TubeGeometry(curve, 12, b.radius, 8, false);
        return (
          <mesh key={i} geometry={tubeGeo}>
            <meshStandardMaterial color="#4a2c0a" roughness={0.8} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════
// CANOPY — dense foliage particle cloud
// ═══════════════════════════════════════════

function FoliageCloud() {
  const ref = useRef<THREE.Points>(null);
  const count = 4000;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    // Seeded RNG for deterministic foliage
    let s = 42;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    // Canopy envelope: wide ellipse centered above trunk
    const cx = 0, cy = 1.35, cz = 0.15;
    const rx = 3.0, ry = 1.3, rz = 2.2;

    const darkGreen = new THREE.Color("#0d3316");
    const midGreen = new THREE.Color("#14532d");
    const lightGreen = new THREE.Color("#15803d");
    const brightGreen = new THREE.Color("#22c55e");

    for (let i = 0; i < count; i++) {
      // Gaussian-like distribution within the ellipsoid
      const a = r() * Math.PI * 2;
      const phi = r() * Math.PI * 0.8 - Math.PI * 0.15;
      const dist = Math.pow(r(), 0.6);
      const x = cx + Math.cos(a) * Math.cos(phi) * rx * dist;
      const y = cy + Math.sin(phi) * ry * dist;
      const z = cz + Math.sin(a) * Math.cos(phi) * rz * dist;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color: top=light, bottom=dark
      const yNorm = (y - (cy - ry)) / (2 * ry);
      const t = yNorm * 0.6 + r() * 0.4;

      let color: THREE.Color;
      if (t > 0.78) color = brightGreen.clone();
      else if (t > 0.5) color = lightGreen.clone();
      else if (t > 0.25) color = midGreen.clone();
      else color = darkGreen.clone();

      // Add slight variation
      color.r += (r() - 0.5) * 0.08;
      color.g += (r() - 0.5) * 0.06;
      color.b += (r() - 0.5) * 0.04;

      col[i * 3] = Math.max(0, Math.min(1, color.r));
      col[i * 3 + 1] = Math.max(0, Math.min(1, color.g));
      col[i * 3 + 2] = Math.max(0, Math.min(1, color.b));
    }

    return { positions: pos, colors: col };
  }, []);

  // Leaf-like texture for each particle (tiny)
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.15, "rgba(200,255,200,0.7)");
    grad.addColorStop(0.5, "rgba(100,200,100,0.3)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Subtle sway
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.03;
    ref.current.rotation.x = Math.cos(t * 0.25) * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.NormalBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ═══════════════════════════════════════════
// BLOSSOMS — flowers that appear on mouse
// ═══════════════════════════════════════════

interface BlossomData {
  pos: THREE.Vector3;
  born: number;
  tex: THREE.CanvasTexture;
  scale: number;
}

function MouseBlossoms({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const groupRef = useRef<THREE.Group>(null);
  const blossomsRef = useRef<BlossomData[]>([]);
  const lastSpawn = useRef(0);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // Project mouse to the canopy surface (y ≈ 0.5 to 2.5)
    const ndc = new THREE.Vector3(mouse.current[0], mouse.current[1], 0.5);
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();

    // Find intersection with approximate canopy sphere
    // Canopy center: (0, 1.35, 0.15), radius ~2.5
    const canopyCenter = new THREE.Vector3(0, 1.35, 0.15);
    const oc = camera.position.clone().sub(canopyCenter);
    const b = 2 * oc.dot(dir);
    const c = oc.dot(oc) - 2.5 * 2.5;
    const disc = b * b - 4 * c;

    const inCanopy = disc > 0 && t - lastSpawn.current > 0.05;

    if (inCanopy) {
      // Find intersection point (nearer one)
      const tHit = (-b - Math.sqrt(disc)) / 2;
      if (tHit > 0) {
        lastSpawn.current = t;
        const hitPt = camera.position.clone().add(dir.clone().multiplyScalar(tHit));
        blossomsRef.current.push({
          pos: hitPt.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.6,
              (Math.random() - 0.5) * 0.8,
            )
          ),
          born: t,
          tex: blossomTexs[Math.floor(Math.random() * blossomTexs.length)],
          scale: 0.15 + Math.random() * 0.35,
        });
      }
    }

    // Cull old blossoms
    blossomsRef.current = blossomsRef.current.filter((b) => t - b.born < 2.0);

    // Sync sprites
    while (group.children.length > blossomsRef.current.length) {
      const last = group.children[group.children.length - 1];
      (last as THREE.Sprite).material.dispose();
      group.remove(last);
    }

    blossomsRef.current.forEach((b, i) => {
      const age = t - b.born;
      const bloom = Math.min(age / 0.35, 1);
      const fade = Math.max(0, 1 - (age - 1.2) / 0.8);
      const sc = b.scale * bloom * fade;

      let sprite: THREE.Sprite;
      if (i < group.children.length) {
        sprite = group.children[i] as THREE.Sprite;
      } else {
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: b.tex, depthWrite: false, transparent: true, depthTest: false,
        }));
        group.add(sprite);
      }
      sprite.position.copy(b.pos);
      sprite.scale.setScalar(Math.max(sc, 0.001));
      sprite.material.opacity = Math.min(bloom, fade) * 0.85;
    });
  });

  return <group ref={groupRef} />;
}

// ═══════════════════════════════════════════
// FALLING PETALS
// ═══════════════════════════════════════════

function FallingPetals({ count = 50 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const meta: number[] = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -3.5 + Math.random() * 7;
      pos[i * 3 + 1] = 0.2 + Math.random() * 3.5;
      pos[i * 3 + 2] = -3 + Math.random() * 6;
      meta.push(Math.random() * Math.PI * 2, 0.2 + Math.random() * 1.0, 0.005 + Math.random() * 0.015);
    }
    return { pos, meta };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= data.meta[i * 3 + 2];
      arr[i * 3] += Math.sin(t * data.meta[i * 3 + 1] + data.meta[i * 3]) * 0.002;
      if (arr[i * 3 + 1] < -1.5) {
        arr[i * 3 + 1] = 2.5 + Math.random();
        arr[i * 3] = -3.5 + Math.random() * 7;
        arr[i * 3 + 2] = -3 + Math.random() * 6;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#f9d4e5" sizeAttenuation transparent opacity={0.3} depthWrite={false} />
    </points>
  );
}

// ═══════════════════════════════════════════
// FIREFLIES
// ═══════════════════════════════════════════

function Fireflies({ count = 25 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { pos, meta } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const m: number[] = [];
    for (let i = 0; i < count; i++) {
      p[i * 3] = -4 + Math.random() * 8;
      p[i * 3 + 1] = -0.5 + Math.random() * 4;
      p[i * 3 + 2] = -3.5 + Math.random() * 7;
      m.push(p[i * 3 + 1], Math.random() * Math.PI * 2, 0.25 + Math.random() * 0.8);
    }
    return { pos: p, meta: m };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = meta[i * 3] + Math.sin(t * meta[i * 3 + 2] + meta[i * 3 + 1]) * 0.2;
      arr[i * 3] += Math.sin(t * 0.35 * meta[i * 3 + 2] + meta[i * 3 + 1]) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#fef9c3" sizeAttenuation transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ═══════════════════════════════════════════
// GROUND
// ═══════════════════════════════════════════

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <planeGeometry args={[20, 20]} />
      <shaderMaterial
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`varying vec2 vUv;varying vec3 vPos;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vPos=w.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv;varying vec3 vPos;void main(){float d=length(vPos.xz)/6.;float a=1.-smoothstep(0.,.9,d);a*=1.-smoothstep(.82,1.,d);vec3 c=mix(mix(vec3(.2,.14,.06),vec3(.15,.26,.08),d*.5),vec3(.28,.38,.18),d);gl_FragColor=vec4(c,a);}`}
        transparent depthWrite={false}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════
// SCENE
// ═══════════════════════════════════════════

function Scene({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Very subtle ambient sway
    ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.015 + mouse.current[0] * 0.03;
  });

  return (
    <group ref={ref}>
      <Ground />
      <TreeTrunk />
      <Branches />
      <FoliageCloud />
      <MouseBlossoms mouse={mouse} />
      <FallingPetals count={50} />
      <Fireflies count={25} />
    </group>
  );
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════

export function ThreeScene() {
  const mouse = useRef<[number, number]>([0, 0]);

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 1 }}
      onMouseMove={(e) => {
        mouse.current = [
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1,
        ];
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 6.5], fov: 44, near: 0.1, far: 22 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#e8e4d4", 3.5, 14]} />
        <ambientLight intensity={0.45} color="#fef9e7" />
        <hemisphereLight args={["#fefce8", "#3f6212", 0.22]} />
        <directionalLight position={[4, 5, 3]} intensity={0.55} color="#fef9c3" />

        <Scene mouse={mouse} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.85} intensity={0.3} radius={0.5} />
          <Vignette darkness={0.06} offset={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
