import * as THREE from "three";
import { facets, glint, part, release, type Item } from "./look";

/** How big the speck is against the space an item has (radius 1), how fast it tumbles (rad/s), and its glint's size. */
const SPECK = { size: 0.075, spin: 0.9, glint: 0.42 };

/**
 * Micrometeorite (common): one tiny dark-brown faceted speck with a single white glint, and a great
 * deal of empty space round it. The joke is how small it is: the glint is bigger than the rock. It
 * tumbles quickly, as small things do, and its glint breathes but never quite goes out.
 */
export function makeMicrometeorite(): Item {
  // a lumpy little rock: an icosahedron with its corners pushed in and out
  const g = new THREE.IcosahedronGeometry(1, 0);
  const at = g.attributes.position, seen = new Map<string, number>();
  for (let i = 0; i < at.count; i++) {
    const key = `${at.getX(i).toFixed(3)},${at.getY(i).toFixed(3)},${at.getZ(i).toFixed(3)}`;
    const k = seen.get(key) ?? seen.set(key, 0.72 + 0.5 * ((Math.sin(seen.size * 12.9898) * 43758.5453) % 1 + 1) % 1).get(key)!;
    at.setXYZ(i, at.getX(i) * k, at.getY(i) * k * 0.85, at.getZ(i) * k);
  }
  const rock = part(g, facets("#744c30", "#21140d", 0.7), 20, 0.4);
  rock.scale.setScalar(SPECK.size);
  const shine = glint(SPECK.glint);
  // caught on its lit side, up and to the left, where the key light is
  shine.mesh.position.set(-0.035, 0.04, 0.2);
  const root = new THREE.Group();
  root.add(rock, shine.mesh);
  const pose = (t: number) => rock.rotation.set(0.7 + SPECK.spin * t, 0.3 + SPECK.spin * 0.7 * t, 0.2 * Math.sin(t));

  return {
    object: root,
    update(_dt, t) {
      pose(t);
      shine.strength = 0.65 + 0.35 * Math.sin(t * 1.7) ** 2;
    },
    dispose() {
      release(root);
    },
  };
}
