/**
 * GLSL the planets share: the noise their surfaces are baked from, the 2:1 equirectangular mapping
 * they are baked into and read back through, and the frame every planet is drawn in (a sphere
 * traced a pixel at a time on a square, pixelated on the room's grid).
 */

/** The equirectangular mapping: a point on the unit sphere to its uv, and back (u round the equator from +x toward +z, v up). */
export const EQUIRECT = /* glsl */ `
#define PI 3.141592653589793
vec2 equirect(vec3 p) {
  return vec2(atan(p.z, p.x) * (0.5 / PI) + 0.5, asin(clamp(p.y, -1.0, 1.0)) / PI + 0.5);
}
vec3 sphereAt(vec2 uv) {
  float lon = (uv.x - 0.5) * 2.0 * PI, lat = (uv.y - 0.5) * PI;
  return vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
}
/** Due east and due north on the sphere at p, unit length (east is where u grows). */
vec3 eastAt(vec3 p) { vec3 e = vec3(-p.z, 0.0, p.x); float l = length(e); return l > 1e-5 ? e / l : vec3(0.0, 0.0, 1.0); }
vec3 northAt(vec3 p) { return cross(eastAt(p), p); }`;

/**
 * Noise for the bakes: 3D simplex noise (Ashima Arts and Stefan Gustavson, MIT), a sine-free hash
 * (Dave Hoskins), and fractal sums of the noise. Sampled at points on the sphere, whatever it
 * makes wraps round without a seam and meets itself at the poles.
 */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
/** Fractal noise, about -1 .. 1: \`octaves\` of it, each twice as fine and half as strong. */
float fbm(vec3 p, int octaves) {
  float s = 0.0, a = 0.5, n = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    s += a * snoise(p);
    n += a;
    p = p * 2.03 + vec3(1.7, 9.2, 4.1);
    a *= 0.5;
  }
  return s / n;
}`;

/** How far a planet's glow reaches, in its falloff's widths: its square covers that much past the limb. */
export const GLOW_REACH = 2.5;

/**
 * The frame every planet is drawn in. The planet is a unit sphere traced a pixel at a time on a
 * square that covers it and its glow (so its outline is exactly round at any size, and it turns as
 * a ball does); the camera is the room's, orthographic, so a pixel's ray goes straight in and meets
 * the sphere at n = (q, sqrt(1 - q.q)), q being where the pixel is on the disc (radius 1). The
 * shader works in the drawing buffer's pixels (gl_FragCoord): pixelated (`uPix`, a cell in device
 * pixels), each cell is worked out once at its middle, on the same grid Urchi's cells and dither
 * lie on, and the disc's edge is hard; smooth, the edge is shaded over a pixel. `uBody` turns a
 * direction from the view into the planet's own frame (its tilt and how far it has spun), where its
 * surface is looked up; `uLight` stays with the view, so the night side never turns with the ground.
 *
 * What a planet's own shader gets (see planetMain): `n` the normal where the sample is, `nf` the
 * normal at the pixel itself (for how fast the surface changes across the screen: the texture's
 * level of detail), `q` the sample's place on the disc and `r` its distance from the middle, and
 * `cell` (1 smooth).
 */
export const FRAME = /* glsl */ `
#define GLOW_REACH ${GLOW_REACH.toFixed(2)}
uniform vec2 uCentre;
uniform float uRadius;
uniform float uPix;
uniform float uFade;
uniform vec3 uLight;
uniform mat3 uBody;
${EQUIRECT}
/** How an equirectangular uv changes from one pixel to the next: across the seam u jumps by a whole turn, which is no change at all. */
vec2 unwrap(vec2 d) { return vec2(d.x - floor(d.x + 0.5), d.y); }
/**
 * A texture on the sphere at the sample point p (in its own frame), its detail chosen by how much of
 * it one cell covers at the pixel's own point pf: across the seam without a line, and near the poles
 * as finely as the equator (the mapping stretches it there, so it is no coarser than it looks).
 */
vec4 onSphere(sampler2D map, vec3 p, vec3 pf, float cell) {
  vec2 f = equirect(pf);
  vec2 dx = unwrap(dFdx(f)), dy = unwrap(dFdy(f));
  float k = sqrt(max(0.0, 1.0 - pf.y * pf.y));
  dx.x *= k;
  dy.x *= k;
  return textureGrad(map, equirect(p), dx * cell, dy * cell);
}
/** The disc's edge at distance r (1 the limb): hard when pixelated, else over the pixel it crosses. */
float coverage(float r) {
  return uPix > 0.0 ? step(r, 1.0) : clamp((1.0 - r) * uRadius + 0.5, 0.0, 1.0);
}
/**
 * A glow \`px\` pixels past the limb, \`width\` pixels its falloff, comes down to nothing by GLOW_REACH
 * of those widths, so it never ends at the edge of the square it is drawn on.
 */
float glowEnd(float px, float width) {
  return 1.0 - smoothstep(0.55 * GLOW_REACH * width, GLOW_REACH * width, px);
}
/**
 * A limb's light: how much the air at the edge of the disc in direction \`dir\` (from its middle)
 * faces the sun, 0 .. 1.
 */
float limbLight(vec2 dir, vec2 range) {
  return smoothstep(range.x, range.y, dot(dir, uLight.xy));
}`;

/**
 * The start of a planet's main(): the sample point (the pixel's middle, or pixelated its cell's) on
 * the disc, and the sphere's normal there and at the pixel itself. Everything that is differentiated
 * (onSphere) must be worked out before any branch, from these.
 */
export const PLANET_MAIN = /* glsl */ `
  vec2 frag = gl_FragCoord.xy;
  float cell = max(uPix, 1.0);
  vec2 at = uPix > 0.0 ? (floor(frag / uPix) + 0.5) * uPix : frag;
  vec2 q = (at - uCentre) / uRadius;
  float r = length(q);
  vec2 qn = q * min(1.0, 0.9995 / max(r, 1e-6));
  vec3 n = vec3(qn, sqrt(max(0.0, 1.0 - dot(qn, qn))));
  vec2 qf = (frag - uCentre) / uRadius;
  qf *= min(1.0, 0.9995 / max(length(qf), 1e-6));
  vec3 nf = vec3(qf, sqrt(max(0.0, 1.0 - dot(qf, qf))));
  vec2 dir = q / max(r, 1e-6);`;

/** The square a planet is drawn on: a unit square the host scales to cover it and its glow. */
export const PLANET_VERT = /* glsl */ `
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** A bake's square: the whole render target, its uv the texel's place in the equirectangular map. */
export const BAKE_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
