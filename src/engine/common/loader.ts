import * as THREE from "three";
import type { Media } from "@/content/site";

export type Loaded = {
  texture: THREE.Texture;
  /** width / height of the decoded media */
  aspect: number;
  video?: HTMLVideoElement;
  dispose(): void;
};

const imageLoader = new THREE.TextureLoader();

function prep(tex: THREE.Texture) {
  // Images are shown as-is: no colour-space decode, so pixels pass straight through.
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  return tex;
}

export function loadImage(src: string): Promise<Loaded> {
  return new Promise((resolve, reject) => {
    imageLoader.load(
      src,
      (tex) => {
        prep(tex);
        const img = tex.image as HTMLImageElement;
        resolve({ texture: tex, aspect: img.naturalWidth / img.naturalHeight || 1, dispose: () => tex.dispose() });
      },
      undefined,
      reject,
    );
  });
}

/**
 * Muted, inline, looping video as a texture. Resolves once the first frame
 * can be drawn; falls back to the poster if the video cannot load.
 */
export function loadVideo(src: string, poster: string): Promise<Loaded> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      resolve({
        texture: tex,
        aspect: video.videoWidth / video.videoHeight || 1,
        video,
        dispose: () => {
          video.pause();
          video.removeAttribute("src");
          video.load();
          tex.dispose();
        },
      });
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      loadImage(poster).then(resolve, () => resolve({ texture: prep(new THREE.Texture()), aspect: 1, dispose: () => undefined }));
    };
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("error", fail, { once: true });
    video.src = src;
    video.load();
  });
}

export function loadMedia(media: Media): Promise<Loaded> {
  return media.kind === "video" ? loadVideo(media.src, media.poster) : loadImage(media.src);
}

/** Loads everything, reporting a 0..1 fraction as each item lands. */
export async function loadAll(list: Media[], onProgress?: (p: number) => void): Promise<Loaded[]> {
  let n = 0;
  const out = await Promise.all(
    list.map((m) =>
      loadMedia(m).then((l) => {
        n++;
        onProgress?.(n / list.length);
        return l;
      }),
    ),
  );
  return out;
}

export function makeRenderer(canvas: HTMLCanvasElement, alpha = false) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, alpha ? 0 : 1);
  return renderer;
}

/** Uploads a texture to the GPU now, so the first frame that uses it never hitches. */
export function upload(renderer: THREE.WebGLRenderer, loaded: Loaded[]) {
  loaded.forEach((l) => {
    if (!l.video) renderer.initTexture(l.texture);
  });
}
