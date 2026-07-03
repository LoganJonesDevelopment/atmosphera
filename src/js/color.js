export function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const r = Math.round(((ah >> 16) & 255) * (1 - t) + ((bh >> 16) & 255) * t);
  const g = Math.round(((ah >> 8) & 255) * (1 - t) + ((bh >> 8) & 255) * t);
  const bl = Math.round((ah & 255) * (1 - t) + (bh & 255) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

export function lerpColors(a, b, t) {
  return a.map((c, i) => lerpColor(c, b[i], t));
}

export function getSkyGradient(isDay, code, sunProgress) {
  if (isDay) {
    if (code >= 95) return [['#2c3e50', '#4a4a4a', '#1a1a2e'], 0.7];
    if (code >= 61) return [['#4a6274', '#6b8294', '#8fa5b5'], 0.85];
    if (code >= 51) return [['#5a7a8f', '#7a9ab0', '#9abac5'], 0.9];
    if (code >= 45) return [['#7a8a94', '#9aa5ae', '#b5bfc5'], 0.85];
    if (code >= 2) return [['#3a6186', '#6a9bc3', '#89CFF0'], 0.95];
    const t = Math.max(0, Math.min(1, (sunProgress - 0.05) / 0.15));
    const t2 = Math.max(0, Math.min(1, (sunProgress - 0.8) / 0.15));
    if (t < 1) {
      return [lerpColors(['#0f0c29', '#302b63', '#24243e'], ['#2980B9', '#6DD5FA', '#89CFF0'], t), 1];
    }
    if (t2 > 0) {
      return [lerpColors(['#2980B9', '#6DD5FA', '#89CFF0'], ['#e96443', '#904e95', '#24243e'], t2), 1];
    }
    return [['#2980B9', '#6DD5FA', '#89CFF0'], 1];
  } else {
    if (code >= 61) return [['#0a0a15', '#151520', '#1a1a28'], 0.7];
    return [['#0a0a1a', '#0f1528', '#141e30'], 1];
  }
}
