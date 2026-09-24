"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { pointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The hero's atmosphere: a domain-warped plasma field rendered by a single
 * fragment shader.
 *
 * Written against raw WebGL rather than three.js on purpose. A Three scene
 * would cost roughly 600 kB of JavaScript for what is ultimately one
 * full-screen triangle, and the landing page has a 150 kB budget. This is a
 * few kB and does exactly one thing.
 *
 * Only the WebGL tier ever loads this module (hero-atmosphere.tsx decides,
 * and imports it at idle as its own chunk). The CSS nebula sits beneath it,
 * so the canvas is transparent until its first frame and then fades in; with
 * no WebGL it renders nothing and the nebula simply stays. The loop suspends
 * whenever the tab is hidden or the hero scrolls out of view, so it never
 * burns a laptop battery animating pixels nobody is looking at.
 */

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uIntensity;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uBg;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rot * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.045;

  // Two rounds of domain warping. One round gives clouds; two gives the
  // folded, filamentary look that reads as plasma rather than fog.
  vec2 q = vec2(
    fbm(uv * 1.15 + t * 0.60),
    fbm(uv * 1.15 + vec2(3.1, 1.7) - t * 0.45)
  );
  vec2 r = vec2(
    fbm(uv * 1.60 + q * 1.4 + vec2(1.7, 9.2) + t * 0.35),
    fbm(uv * 1.60 + q * 1.4 + vec2(8.3, 2.8) - t * 0.30)
  );

  float field = fbm(uv * 1.9 + r * 1.25 + uPointer * 0.35);

  // Ridged noise: thin bright veins instead of soft blobs. The exponent sets
  // how thin — high enough that the filaments read as structure in the
  // background rather than as a foreground subject.
  float veins = 1.0 - abs(field * 2.0 - 1.0);
  veins = pow(clamp(veins, 0.0, 1.0), 7.0);

  vec3 col = mix(uC1, uC2, smoothstep(0.30, 0.78, field + r.x * 0.25));
  col = mix(col, uC3, smoothstep(0.55, 1.00, r.y + veins * 0.5) * 0.8);
  col += veins * uC3 * 0.22;

  // The cursor carries its own light source through the field.
  float d = length(uv - uPointer);
  col += exp(-d * d * 2.6) * uC2 * 0.28;

  float mask = smoothstep(0.18, 0.82, field) * 0.70 + veins * 0.30;

  // Vignette keeps the energy off the edges; the scroll term fades the field
  // out so the hero hands attention down the page instead of competing.
  // Written as 1.0 - smoothstep rather than a reversed-edge smoothstep: GLSL
  // leaves smoothstep undefined when edge0 >= edge1, and the drivers that
  // return 0 for it zero the entire field.
  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv * vec2(0.55, 1.0)));
  mask *= vignette * uIntensity * (1.0 - uScroll * 0.75);

  vec3 result = mix(uBg, col, clamp(mask, 0.0, 1.0));

  // Dither. Large smooth gradients band badly at 8 bits otherwise.
  result += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(result, 1.0);
}
`;

type Palette = {
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
  bg: [number, number, number];
  intensity: number;
};

/** Mirrors the Plasma / Ion / Signal / Void tokens in styles/tokens.css. */
const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    c1: [0.62, 0.482, 1.0],
    c2: [0.969, 0.388, 0.808],
    c3: [0.059, 0.847, 0.855],
    bg: [0.0353, 0.0353, 0.0745],
    // Deliberately low. At full strength the field is genuinely beautiful and
    // completely unusable — it becomes the subject and the headline becomes
    // an obstacle in front of it. This is atmosphere, so it stays under the
    // copy, not over it.
    intensity: 0.62,
  },
  light: {
    // Light needs a far quieter field. The same energy on paper reads as
    // noise rather than atmosphere.
    c1: [0.427, 0.212, 0.835],
    c2: [0.757, 0.039, 0.608],
    c3: [0.0, 0.451, 0.529],
    bg: [0.969, 0.969, 0.984],
    intensity: 0.24,
  },
};

/** Latest the field waits for an idle period before starting anyway. */
const IDLE_START_TIMEOUT_MS = 1500;
/** Stand-in delay where requestIdleCallback is missing (Safari). */
const IDLE_START_FALLBACK_MS = 300;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function PlasmaField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  // Held in a ref so a theme switch updates the uniforms on the next frame
  // instead of tearing down and rebuilding the whole GL program.
  const paletteRef = useRef<Palette>(PALETTES.dark);

  const redrawRef = useRef<(() => void) | null>(null);

  // Shader compilation is synchronous and, on a software-GL or low-end
  // device, costs hundreds of milliseconds of main thread. Doing it during
  // hydration held back the hero copy's paint (the page's LCP), so the field
  // waits for the browser to go idle. Until then the canvas is transparent
  // and the CSS nebula beneath it shows.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIsReady(true), {
        timeout: IDLE_START_TIMEOUT_MS,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIsReady(true), IDLE_START_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    paletteRef.current = PALETTES[resolvedTheme === "light" ? "light" : "dark"];
    // Repaint at once. If the loop happens to be parked (tab hidden, hero
    // scrolled away) it would otherwise hold the previous theme's palette
    // until the user came back.
    redrawRef.current?.();
  }, [resolvedTheme]);

  useEffect(() => {
    if (prefersReducedMotion || !isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const attributes: WebGLContextAttributes = {
      // Transparent rather than opaque-black. An undrawn WebGL buffer with
      // alpha:false composites as solid black, which is invisible in dark
      // mode and a black slab in light mode. With alpha:true the CSS nebula
      // shows through until the first frame lands.
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    };

    const gl = (canvas.getContext("webgl", attributes) ??
      canvas.getContext(
        "experimental-webgl",
        attributes,
      )) as WebGLRenderingContext | null;

    if (!gl) {
      setIsSupported(false);
      return;
    }

    const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program) {
      setIsSupported(false);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setIsSupported(false);
      return;
    }

    gl.useProgram(program);

    // One oversized triangle rather than a quad: fewer vertices and no
    // diagonal seam where two triangles would meet.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      res: gl.getUniformLocation(program, "uRes"),
      time: gl.getUniformLocation(program, "uTime"),
      pointer: gl.getUniformLocation(program, "uPointer"),
      scroll: gl.getUniformLocation(program, "uScroll"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      c1: gl.getUniformLocation(program, "uC1"),
      c2: gl.getUniformLocation(program, "uC2"),
      c3: gl.getUniformLocation(program, "uC3"),
      bg: gl.getUniformLocation(program, "uBg"),
    };

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    let isVisible = true;

    const resize = () => {
      // Capped at 1.5x. This is a soft, low-frequency image, so full retina
      // resolution costs two to four times the fragments for no visible gain.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width * dpr));
      const nextHeight = Math.max(1, Math.round(rect.height * dpr));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.res, width, height);
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const scroll = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(rect.height, 1)),
      );
      const aspect = width / Math.max(height, 1);
      const palette = paletteRef.current;

      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform2f(
        uniforms.pointer,
        (pointer.clientX - 0.5) * aspect,
        -(pointer.clientY - 0.5),
      );
      gl.uniform1f(uniforms.scroll, scroll);
      gl.uniform1f(uniforms.intensity, palette.intensity);
      gl.uniform3fv(uniforms.c1, palette.c1);
      gl.uniform3fv(uniforms.c2, palette.c2);
      gl.uniform3fv(uniforms.c3, palette.c3);
      gl.uniform3fv(uniforms.bg, palette.bg);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const render = (now: number) => {
      const delta = Math.min(now - last, 64) / 1000;
      last = now;

      // Park the loop rather than spinning it. It restarts from the
      // visibility or intersection handler.
      if (!isVisible || document.hidden) {
        frame = 0;
        return;
      }

      elapsed += delta;
      draw();
      frame = requestAnimationFrame(render);
    };

    const wake = () => {
      if (frame !== 0 || !isVisible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(render);
    };

    resize();

    // One synchronous frame before any rAF. drawArrays works in a background
    // tab even though rAF does not, so the hero is never a blank rectangle —
    // including when it mounts while the tab is hidden and the loop parks
    // itself immediately.
    draw();
    canvas.dataset.drawn = "";

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        wake();
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(canvas);

    redrawRef.current = draw;
    document.addEventListener("visibilitychange", wake);

    // Keep the shared pointer loop alive for as long as the field is mounted.
    const unsubscribePointer = subscribePointer(() => {});

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      redrawRef.current = null;
      document.removeEventListener("visibilitychange", wake);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      unsubscribePointer();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [prefersReducedMotion, isReady]);

  // The CSS nebula beneath is the fallback: nothing to draw here.
  if (prefersReducedMotion || !isSupported) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("ts-plasma size-full", className)}
    />
  );
}
