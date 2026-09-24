export const runtime = "nodejs";

const CDN = "https://lastfm.freetls.fastly.net/i/u/300x300/";
const ID = /^([a-f0-9]{32})(?:\.(png|jpg))?$/;

/**
 * Album art proxied same-origin so it can be a WebGL texture without a CORS
 * header from a third party. Cached for a day; the hash names the bytes.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/cover/[id]">) {
  const { id } = await ctx.params;
  const m = ID.exec(id);
  if (!m) return new Response(null, { status: 404 });
  const [, hash, ext] = m;
  try {
    // The CDN keys on the hash; try the asked-for extension first, then the other.
    const exts = ext === "jpg" ? ["jpg", "png"] : ["png", "jpg"];
    for (const e of exts) {
      const res = await fetch(`${CDN}${hash}.${e}`, { next: { revalidate: 86400 } });
      if (!res.ok || !res.body) continue;
      return new Response(res.body, {
        headers: {
          "Content-Type": res.headers.get("content-type") ?? `image/${e === "jpg" ? "jpeg" : "png"}`,
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }
  } catch {
    /* fall through */
  }
  return new Response(null, { status: 404 });
}
