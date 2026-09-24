#!/usr/bin/env node
// Copies Urchi's baked head mesh from urchi/index.html, where urchi/tools/build-mascot.mjs
// writes it, into src/engine/urchi/mesh.json, where the site reads it.
//
//   node urchi/tools/build-mascot.mjs && npm run urchi:sync

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(ROOT, "urchi/index.html"), "utf8");
const START = "<!-- mesh:start -->", END = "<!-- mesh:end -->";
const s = html.indexOf(START), e = html.indexOf(END);
if (s < 0 || e < 0) throw new Error("urchi/index.html is missing the <!-- mesh:start --> / <!-- mesh:end --> markers");
const json = html.slice(s + START.length, e).replace(/<script[^>]*>|<\/script>/g, "").trim();
const mesh = JSON.parse(json);
const out = resolve(ROOT, "src/engine/urchi/mesh.json");
writeFileSync(out, JSON.stringify(mesh) + "\n");
console.log(`urchi: ${mesh.v.length} vertices, ${mesh.f.length} triangles -> src/engine/urchi/mesh.json`);
