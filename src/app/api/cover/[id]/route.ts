import { artUrl } from "../../songs";

export const runtime = "nodejs";

const CDN = "https://lastfm.freetls.fastly.net/i/u/300x300/";
const ID = /^([a-f0-9]{32})(?:\.(png|jpg|gif|webp))?$/;
const DAY = 86400;

const image = (res: Response, fallback: string) =>
  new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? fallback,
      "Cache-Control": `public, max-age=${DAY}, immutable`,
    },
  });

/**
 * Album art proxied same-origin so it can be a WebGL texture without a CORS
 * header from a third party. Cached for a day; the id names the bytes: a
 * Last.fm sleeve's hash, or (for a sleeve Last.fm has none of) a store's own
 * image URL as songs.ts's artId writes it, served only from the stores' hosts.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/cover/[id]">) {
  const { id } = await ctx.params;
  const store = artUrl(id);
  if (store) {
    try {
      const res = await fetch(store, { next: { revalidate: DAY } });
      if (res.ok && res.body) return image(res, "image/jpeg");
    } catch {
      /* fall through */
    }
    return new Response(null, { status: 404 });
  }
  const m = ID.exec(id);
  if (!m) return new Response(null, { status: 404 });
  const [, hash, ext] = m;
  try {
    // The CDN keys on the hash; try the asked-for extension first, then the others.
    const exts = [...new Set([ext ?? "png", "png", "jpg", "webp", "gif"])];
    for (const e of exts) {
      const res = await fetch(`${CDN}${hash}.${e}`, { next: { revalidate: DAY } });
      if (!res.ok || !res.body) continue;
      return image(res, `image/${e === "jpg" ? "jpeg" : e}`);
    }
  } catch {
    /* fall through */
  }
  return new Response(null, { status: 404 });
}
