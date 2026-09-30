import * as THREE from "three";
import { facets, fit, haze, part, release, type Item } from "./look";

/**
 * Lost glove (common): a chunky white astronaut glove, a grey ring at its cuff and a small orange
 * patch on its back, its fingers a little curled as a hand at rest is, tumbling slowly. White and
 * grey, the orange its accent.
 */
export function makeGlove(): Item {
  const white = facets("#f8f6f0", "#8b90b4");
  const grey = facets("#b8bcc8", "#4a4e62");
  const orange = facets("#ffa446", "#c8421c");
  const hand = new THREE.Group();

  // the back of the hand and the palm: a chunky, flattened ball
  const palm = part(new THREE.IcosahedronGeometry(1, 1), white);
  palm.scale.set(0.56, 0.52, 0.33);
  hand.add(palm);

  // four fingers, each two stubby pieces bent toward the palm, the middle ones longest
  // (fat and pressed together, as a stiff suit glove's are)
  const fingers = [
    { x: -0.33, len: 0.14, lean: 0.08 },
    { x: -0.11, len: 0.21, lean: 0.02 },
    { x: 0.11, len: 0.19, lean: -0.02 },
    { x: 0.33, len: 0.12, lean: -0.08 },
  ];
  for (const f of fingers) {
    const base = new THREE.Group();
    base.position.set(f.x, 0.34, 0);
    base.rotation.set(-0.3, 0, f.lean);
    const near = part(new THREE.CapsuleGeometry(0.155, f.len, 2, 7), white);
    near.position.y = f.len / 2 + 0.08;
    base.add(near);
    const joint = new THREE.Group();
    joint.position.y = f.len + 0.13;
    joint.rotation.x = -0.55;
    const tip = part(new THREE.CapsuleGeometry(0.145, f.len * 0.5, 2, 7), white);
    tip.position.y = (f.len * 0.5) / 2 + 0.07;
    joint.add(tip);
    base.add(joint);
    hand.add(base);
  }

  // the thumb, out to the side and up, curled in a little
  const thumb = new THREE.Group();
  thumb.position.set(0.47, -0.04, -0.04);
  thumb.rotation.set(-0.35, 0.2, -1.0);
  const thumbPart = part(new THREE.CapsuleGeometry(0.17, 0.2, 2, 7), white);
  thumbPart.position.y = 0.19;
  thumb.add(thumbPart);
  hand.add(thumb);

  // the cuff: a flared, oval gauntlet, and the grey ring where it meets the hand
  const cuff = part(new THREE.CylinderGeometry(0.5, 0.6, 0.44, 10, 1), white);
  cuff.position.y = -0.62;
  cuff.scale.z = 0.72;
  hand.add(cuff);
  const ring = part(new THREE.TorusGeometry(0.5, 0.075, 5, 12), grey, 30, 0.3);
  ring.position.y = -0.4;
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, 0.72, 1);
  hand.add(ring);
  const band = part(new THREE.TorusGeometry(0.59, 0.05, 4, 12), grey, 30, 0.3);
  band.position.y = -0.84;
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, 0.72, 1);
  hand.add(band);

  // the small orange patch on the back of the hand
  const patch = part(new THREE.BoxGeometry(0.3, 0.22, 0.06), orange, 20, 0.5);
  patch.position.set(-0.06, 0.02, 0.325);
  patch.rotation.set(0.05, -0.1, 0.08);
  hand.add(patch);

  const body = new THREE.Group();
  body.add(hand);
  fit(hand, 0.95);
  const root = new THREE.Group();
  const under = haze("#dfe8ff", 1.9, 0.09);
  under.position.set(0, -1.05, -0.5);
  root.add(under, body);
  // a slow tumble, the pose a function of its clock (so a held clock holds it, and any moment can be shown)
  const pose = (t: number) => body.rotation.set(0.4 + 0.21 * t, -0.5 + 0.33 * t, 0.25 + 0.09 * Math.sin(0.4 * t));
  pose(0);

  return {
    object: root,
    update(_dt, t) {
      pose(t);
    },
    dispose() {
      release(root);
    },
  };
}
