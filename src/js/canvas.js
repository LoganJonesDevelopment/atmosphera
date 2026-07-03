let canvas, ctx, W, H;

export function initCanvas() {
  canvas = document.getElementById('scene');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return { canvas, ctx };
}

function resize() {
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
  W /= devicePixelRatio;
  H /= devicePixelRatio;
  window.dispatchEvent(new Event('canvas-resize'));
}

export function getCtx() { return ctx; }
export function getW() { return W; }
export function getH() { return H; }
