/** Deterministic PRNG (mulberry32) — pure, so scene layouts are stable across renders and SSR-safe. */
export function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniformly distributed point on a sphere of radius r using the given random source. */
export function randomOnSphere(rand: () => number, r: number): [number, number, number] {
  const u = rand() * 2 - 1
  const th = rand() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  return [s * Math.cos(th) * r, s * Math.sin(th) * r, u * r]
}
