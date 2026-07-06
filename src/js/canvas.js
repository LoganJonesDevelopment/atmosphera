let canvas, ctx, W, H;

export function initCanvas() {
  canvas = document.getElementById('scene');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return { canvas, ctx };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width = window.innerWidth * dpr;
  H = canvas.height = window.innerHeight * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  W /= dpr;
  H /= dpr;
  window.dispatchEvent(new Event('canvas-resize'));
}

export function getCtx() { return ctx; }
export function getW() { return W; }
export function getH() { return H; }
