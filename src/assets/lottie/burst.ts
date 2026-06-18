// Minimal monochrome "ripple" used as a subtle success flourish.
// Two expanding rings (mid-gray, visible on both light and dark) that scale
// up and fade out over ~0.7s. Authored inline to avoid a JSON import.

function ring(delay: number) {
  return {
    ty: "gr",
    nm: `ring-${delay}`,
    it: [
      {
        ty: "el",
        d: 1,
        s: { a: 0, k: [120, 120] },
        p: { a: 0, k: [0, 0] },
        nm: "e",
      },
      {
        ty: "st",
        c: { a: 0, k: [0.6, 0.6, 0.6, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 6 },
        lc: 2,
        lj: 1,
        ml: 4,
        nm: "s",
      },
      {
        ty: "tr",
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: {
          a: 1,
          k: [
            {
              t: delay,
              s: [20, 20],
              i: { x: [0.2, 0.2], y: [1, 1] },
              o: { x: [0.8, 0.8], y: [0, 0] },
            },
            { t: delay + 36, s: [150, 150] },
          ],
        },
        r: { a: 0, k: 0 },
        o: {
          a: 1,
          k: [
            {
              t: delay,
              s: [85],
              i: { x: [0.2], y: [1] },
              o: { x: [0.8], y: [0] },
            },
            { t: delay + 36, s: [0] },
          ],
        },
      },
    ],
  };
}

export const burst = {
  v: "5.7.0",
  fr: 60,
  ip: 0,
  op: 48,
  w: 200,
  h: 200,
  nm: "burst",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "rings",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [ring(0), ring(10)],
      ip: 0,
      op: 48,
      st: 0,
      bm: 0,
    },
  ],
};
