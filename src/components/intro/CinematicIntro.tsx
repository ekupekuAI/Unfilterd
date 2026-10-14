import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Opening sequence: scattered points of light (everyone who can't say it out
 * loud) drift, find each other, and gather into one glowing sphere before the
 * wordmark appears and the scene opens into the app.
 *
 * three.js is loaded on demand so it never weighs on the main bundle.
 */

export type IntroMode = 'full' | 'short';

const TIMELINE = {
  full: { gather: [0.9, 2.9], word: 2.5, open: 4.1, end: 4.9 },
  short: { gather: [0.0, 0.9], word: 0.55, open: 1.6, end: 2.2 },
} as const;

const VERTEX = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uGather;
  uniform float uOpen;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float delay = aSeed * 0.35;
    float g = clamp((uGather - delay) / (1.0 - delay), 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g);

    vec3 drift = vec3(
      sin(uTime * 0.35 + aSeed * 40.0),
      cos(uTime * 0.28 + aSeed * 23.0),
      sin(uTime * 0.22 + aSeed * 11.0)
    ) * 0.18 * (1.0 - g);

    vec3 pos = mix(aStart + drift, aTarget, g);
    // the sphere breathes once it has formed
    pos *= 1.0 + sin(uTime * 2.2) * 0.025 * g;
    // and opens outward at the end
    pos *= 1.0 + uOpen * uOpen * 7.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + aSeed * 90.0);
    gl_PointSize = (3.0 + 2.6 * g + aSeed * 2.0) * twinkle * uPixelRatio * (8.0 / -mv.z);
    vColor = aColor;
    vAlpha = (0.6 + 0.4 * g) * (1.0 - uOpen);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, glow * glow * vAlpha);
  }
`;

function ease(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
}

export function CinematicIntro({ mode, onDone }: { mode: IntroMode; onDone: () => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const [showWord, setShowWord] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const t = TIMELINE[mode];

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 450);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    const wordTimer = window.setTimeout(() => setShowWord(true), t.word * 1000);
    const endTimer = window.setTimeout(finish, t.end * 1000);

    import('three').then(THREE => {
      if (disposed) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height);
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
      camera.position.set(0, 0, 9);

      const count = width < 640 ? 1400 : 2400;
      const start = new Float32Array(count * 3);
      const target = new Float32Array(count * 3);
      const seed = new Float32Array(count);
      const color = new Float32Array(count * 3);
      const palette = [new THREE.Color('#D9CCFF'), new THREE.Color('#9D7CFF'), new THREE.Color('#FFA48C'), new THREE.Color('#6EE7C8')];
      const golden = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i++) {
        start[i * 3] = (Math.random() - 0.5) * 22;
        start[i * 3 + 1] = (Math.random() - 0.5) * 13;
        start[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

        // even points on a sphere, with a little depth jitter
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        const radius = 1.75 + (Math.random() - 0.5) * 0.18;
        target[i * 3] = Math.cos(theta) * r * radius;
        target[i * 3 + 1] = y * radius;
        target[i * 3 + 2] = Math.sin(theta) * r * radius;

        seed[i] = Math.random();
        const c = palette[i % 7 === 0 ? 2 : i % 11 === 0 ? 3 : i % 2];
        color.set([c.r, c.g, c.b], i * 3);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(target.slice(), 3));
      geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
      geometry.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uGather: { value: mode === 'short' ? 0.4 : 0 },
          uOpen: { value: 0 },
          uPixelRatio: { value: pixelRatio },
        },
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const startTime = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const [g0, g1] = t.gather;
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uGather.value = Math.max(mode === 'short' ? 0.4 : 0, ease((elapsed - g0) / (g1 - g0)));
        material.uniforms.uOpen.value = ease((elapsed - t.open) / (t.end - t.open));
        points.rotation.y = elapsed * 0.22;
        points.rotation.x = Math.sin(elapsed * 0.3) * 0.12;
        camera.position.z = 9 - ease(elapsed / t.open) * 2.2;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      tick();

      const onResize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(frame);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => finish());

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
    window.addEventListener('keydown', onKey);

    return () => {
      disposed = true;
      clearTimeout(wordTimer);
      clearTimeout(endTimer);
      window.removeEventListener('keydown', onKey);
      cleanup();
    };
    // the timeline is fixed for the life of the intro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = 'Unfilterd';

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#040309] overflow-hidden select-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onClick={finish}
      role="presentation"
    >
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,#040309_95%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence>
          {showWord && (
            <motion.div key="word" className="text-center" exit={{ opacity: 0, scale: 1.08 }}>
              <h1 className="font-display text-6xl sm:text-8xl font-semibold tracking-tight text-aurora drop-shadow-[0_0_40px_rgba(157,124,255,0.35)]">
                {word.split('').map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: i * (mode === 'full' ? 0.06 : 0.025), duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </h1>
              <motion.p
                className="mt-4 text-sm sm:text-base tracking-[0.25em] uppercase text-primary-50/80"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mode === 'full' ? 0.7 : 0.25, duration: 0.8 }}
              >
                Say it. Someone feels it too.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); finish(); }}
        className="absolute bottom-8 right-6 px-4 py-2 rounded-full text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 transition-colors"
      >
        Skip intro
      </button>
    </motion.div>
  );
}
