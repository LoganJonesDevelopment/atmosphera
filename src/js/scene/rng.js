// Layout randomness is deterministic per location. Each subsystem draws
// from a generator seeded by (city seed ^ subsystem label), so the same
// city always composes the same scene, and a resize or data refresh
// re-running an init cannot reshuffle what's on screen. Transient event
// randomness (particle respawn, lightning bolts) deliberately stays on
// Math.random — events should differ; composition should not.

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

let citySeed = fnv1a('default');

export function setLayoutSeed(lat, lon) {
  citySeed = fnv1a(lat.toFixed(3) + ',' + lon.toFixed(3));
}

export function layoutRng(label) {
  return mulberry32(citySeed ^ fnv1a(label));
}
