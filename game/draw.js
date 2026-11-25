// Dapur Ceria Kiko - modul gambar kartun.
// Semua ilustrasi digambar langsung dengan canvas: Kiko si koki kucing, bahan besar
// yang mudah dikenali, stasiun berlabel, tiket pesanan, partikel bintang, dan teks
// koin melayang. Tidak ada aset atau permintaan jaringan, jadi game tetap luring.

import { INGREDIENT_BY_ID, itemReady } from './kitchen.js';

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export const COLORS = {
  cream: '#fdf3dc',
  creamDeep: '#f6e3c0',
  ink: '#4a2c17',
  inkSoft: '#7a5636',
  wall: '#8b5e34',
  wallDark: '#6e4524',
  floorA: '#f7e4bc',
  floorB: '#efd6a6',
  grout: '#e3c58c',
  orange: '#f08a34',
  orangeDark: '#c96b1f',
  teal: '#4f9c97',
  tealDark: '#2f6b67',
  white: '#fffdf7',
  shadow: 'rgba(74, 44, 23, 0.18)',
};

export const END_BUTTON = Object.freeze({ x: 490, y: 452, w: 300, h: 68 });

const STAR_COLORS = ['#f2c64b', '#f08a34', '#fff3b0', '#ff9f68', '#7fbf63'];

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function roundPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(ctx, x, y, w, h, radius, fill, stroke, lineWidth) {
  roundPath(ctx, x, y, w, h, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth ?? 2;
    ctx.stroke();
  }
}

function label(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function starPath(ctx, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = rotation + (index * Math.PI) / points;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawShine(ctx, cx, cy, rx, ry, rotation = -0.6) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function itemId(item) {
  if (!item) return null;
  return typeof item === 'string' ? item : item.id;
}

function ingredientName(id) {
  const ingredient = INGREDIENT_BY_ID.get(id);
  return ingredient ? ingredient.name : id;
}

function itemCaption(item) {
  if (!item) return '';
  const id = itemId(item);
  const ingredient = INGREDIENT_BY_ID.get(id);
  if (!ingredient) return id;
  if (ingredient.needsCook) return item.cooked ? `${ingredient.name} matang` : `${ingredient.name} mentah`;
  if (ingredient.needsChop) return item.chopped ? `${ingredient.name} potong` : `${ingredient.name} utuh`;
  return ingredient.name;
}

function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function urgencyColor(ratio) {
  if (ratio <= 0.25) return '#c0392b';
  if (ratio <= 0.55) return '#d68910';
  return '#4f8b5f';
}

function drawCheckMark(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.22);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx - size * 0.08, cy + size * 0.36);
  ctx.lineTo(cx + size * 0.48, cy - size * 0.32);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Partikel bintang dan teks koin melayang
// ---------------------------------------------------------------------------

export class Effects {
  constructor() {
    this.particles = [];
    this.texts = [];
  }

  clear() {
    this.particles.length = 0;
    this.texts.length = 0;
  }

  starBurst(x, y, options = {}) {
    const count = options.count ?? 18;
    const spread = options.spread ?? 165;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.5;
      const speed = spread * (0.45 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: 235,
        life: 0.65 + Math.random() * 0.45,
        maxLife: 1.1,
        size: 5 + Math.random() * 7,
        color: STAR_COLORS[index % STAR_COLORS.length],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 9,
        kind: index % 4 === 0 ? 'dot' : 'star',
      });
    }
  }

  sparkle(x, y, color = '#ffe08a') {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 45,
      vy: -35 - Math.random() * 45,
      gravity: 45,
      life: 0.55 + Math.random() * 0.3,
      maxLife: 0.85,
      size: 3.5 + Math.random() * 3.5,
      color,
      rotation: Math.random() * Math.PI,
      spin: 5,
      kind: 'star',
    });
  }

  coinPop(x, y, text, color = '#b7791f') {
    this.texts.push({
      x,
      y,
      vy: -58,
      life: 1.25,
      maxLife: 1.25,
      text,
      color,
      size: 26,
    });
  }

  comboPop(x, y, text) {
    this.texts.push({
      x,
      y,
      vy: -42,
      life: 1.1,
      maxLife: 1.1,
      text,
      color: '#c96b1f',
      size: 20,
    });
  }

  update(dt) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
        continue;
      }
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.spin * dt;
    }

    for (let index = this.texts.length - 1; index >= 0; index -= 1) {
      const text = this.texts[index];
      text.life -= dt;
      if (text.life <= 0) {
        this.texts.splice(index, 1);
        continue;
      }
      text.y += text.vy * dt;
      text.vy *= 0.985;
    }
  }

  draw(ctx) {
    ctx.save();
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      if (particle.kind === 'star') {
        starPath(ctx, particle.x, particle.y, particle.size, particle.size * 0.45, 5, particle.rotation);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const text of this.texts) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      label(ctx, text.text, text.x, text.y, text.size, text.color, 'center', '800');
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Pabrik penggambar: menutup canvas, warna, stasiun, dan rak pantry
// ---------------------------------------------------------------------------

export function createDrawer({ ctx, width, height, playArea, colors = COLORS, stations, pantrySlots, orderLimit = 3 }) {
  const WIDTH = width;
  const HEIGHT = height;
  const PLAY = playArea;
  const PANTRY = stations.find((station) => station.kind === 'pantry');

  // -------------------------------------------------------------------------
  // Bahan besar yang mudah dikenali anak
  // -------------------------------------------------------------------------

  function drawIngredient(id, cx, cy, size) {
    const s = size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (s > 18) {
      ctx.fillStyle = 'rgba(90, 50, 20, 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.36, s * 0.3, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (id === 'roti') {
      const crust = ctx.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
      crust.addColorStop(0, '#e8b26b');
      crust.addColorStop(1, '#c9873c');
      ctx.fillStyle = crust;
      ctx.strokeStyle = '#935d26';
      ctx.lineWidth = s * 0.06;
      roundPath(-s * 0.38, -s * 0.2, s * 0.76, s * 0.44, s * 0.17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f7d79a';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.1, s * 0.33, s * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b77b34';
      ctx.lineWidth = s * 0.045;
      for (let index = -1; index <= 1; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * s * 0.17 - s * 0.04, -s * 0.27);
        ctx.lineTo(index * s * 0.17 + s * 0.04, -s * 0.03);
        ctx.stroke();
      }
      drawShine(ctx, -s * 0.16, -s * 0.16, s * 0.1, s * 0.045, -0.5);
    } else if (id === 'telur') {
      ctx.fillStyle = '#fffdf7';
      ctx.strokeStyle = '#e0d4bf';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, s * 0.02);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.24, -s * 0.06, -s * 0.27);
      ctx.quadraticCurveTo(s * 0.24, -s * 0.31, s * 0.33, -s * 0.04);
      ctx.quadraticCurveTo(s * 0.38, s * 0.22, s * 0.08, s * 0.28);
      ctx.quadraticCurveTo(-s * 0.26, s * 0.34, -s * 0.34, s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const yolk = ctx.createRadialGradient(-s * 0.04, -s * 0.05, s * 0.02, 0, 0, s * 0.19);
      yolk.addColorStop(0, '#ffd45e');
      yolk.addColorStop(1, '#eda92c');
      ctx.fillStyle = yolk;
      ctx.strokeStyle = '#d18f1c';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.arc(s * 0.02, s * 0.01, s * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawShine(ctx, -s * 0.05, -s * 0.06, s * 0.06, s * 0.035, -0.5);
    } else if (id === 'tomat') {
      const tomato = ctx.createRadialGradient(-s * 0.08, -s * 0.1, s * 0.05, 0, 0, s * 0.32);
      tomato.addColorStop(0, '#ee7760');
      tomato.addColorStop(1, '#c8402f');
      ctx.fillStyle = tomato;
      ctx.strokeStyle = '#9e3125';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.31, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawShine(ctx, -s * 0.12, -s * 0.12, s * 0.08, s * 0.045, -0.6);

      ctx.fillStyle = '#5e9a4e';
      for (let index = 0; index < 5; index += 1) {
        ctx.save();
        ctx.rotate(-Math.PI / 2 + index * ((Math.PI * 2) / 5));
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.29, s * 0.06, s * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#4c7f3f';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'keju') {
      ctx.fillStyle = '#f7cf5c';
      ctx.strokeStyle = '#c99a2c';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, s * 0.22);
      ctx.lineTo(s * 0.34, s * 0.1);
      ctx.lineTo(s * 0.34, -s * 0.13);
      ctx.lineTo(-s * 0.34, -s * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffe28c';
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, -s * 0.02);
      ctx.lineTo(s * 0.34, -s * 0.13);
      ctx.lineTo(s * 0.19, -s * 0.3);
      ctx.lineTo(-s * 0.23, -s * 0.23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d9a32f';
      const holes = [
        [-0.13, 0.07, 0.065],
        [0.11, 0.03, 0.05],
        [0.2, -0.05, 0.038],
        [-0.02, -0.19, 0.045],
        [-0.24, 0.02, 0.035],
      ];
      for (const hole of holes) {
        ctx.beginPath();
        ctx.arc(hole[0] * s, hole[1] * s, hole[2] * s, 0, Math.PI * 2);
        ctx.fill();
      }
      drawShine(ctx, 0.08 * s, -0.16 * s, s * 0.09, s * 0.035, -0.35);
    } else if (id === 'selada') {
      ctx.fillStyle = '#4f8b43';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.34, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      const leaves = [
        [-0.17, -0.04, 0.18, '#8ccb6c'],
        [0.15, -0.06, 0.17, '#79bd5a'],
        [0, -0.17, 0.16, '#9ad879'],
        [0, 0.09, 0.15, '#6cae4f'],
      ];
      for (const leaf of leaves) {
        ctx.fillStyle = leaf[3];
        ctx.beginPath();
        ctx.arc(leaf[0] * s, leaf[1] * s, leaf[2] * s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#4c7f3f';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.24);
      ctx.quadraticCurveTo(s * 0.03, -s * 0.05, s * 0.01, s * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.02, -s * 0.14);
      ctx.lineTo(-s * 0.14, -s * 0.08);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.02, -s * 0.1);
      ctx.lineTo(s * 0.15, -s * 0.02);
      ctx.stroke();
      drawShine(ctx, -s * 0.1, -s * 0.14, s * 0.08, s * 0.04, -0.7);
    } else if (id === 'daging') {
      const meat = ctx.createLinearGradient(0, -s * 0.22, 0, s * 0.24);
      meat.addColorStop(0, '#d97d69');
      meat.addColorStop(1, '#b85445');
      ctx.fillStyle = meat;
      ctx.strokeStyle = '#853f31';
      ctx.lineWidth = s * 0.055;
      ctx.beginPath();
      ctx.moveTo(-s * 0.33, -s * 0.12);
      ctx.quadraticCurveTo(-s * 0.3, -s * 0.27, -s * 0.06, -s * 0.24);
      ctx.quadraticCurveTo(s * 0.24, -s * 0.27, s * 0.33, -s * 0.05);
      ctx.quadraticCurveTo(s * 0.38, s * 0.2, s * 0.08, s * 0.26);
      ctx.quadraticCurveTo(-s * 0.25, s * 0.3, -s * 0.33, -s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#eda08f';
      ctx.beginPath();
      ctx.ellipse(-s * 0.03, -s * 0.04, s * 0.17, s * 0.1, 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f7c9bd';
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo(-s * 0.24, s * 0.09);
      ctx.quadraticCurveTo(-s * 0.05, s * 0.02, s * 0.13, s * 0.13);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.01, -s * 0.16);
      ctx.quadraticCurveTo(s * 0.1, -s * 0.1, s * 0.19, -s * 0.02);
      ctx.stroke();

      ctx.fillStyle = '#fffdf7';
      ctx.strokeStyle = '#d8cbb6';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.arc(s * 0.29, -s * 0.18, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#7fbf63';
      ctx.beginPath();
      ctx.ellipse(-s * 0.24, -s * 0.24, s * 0.06, s * 0.03, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Ikon stasiun dan langkah tutorial
  // -------------------------------------------------------------------------

  function drawStationIcon(kind, cx, cy, size) {
    const s = size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (kind === 'chop') {
      ctx.fillStyle = '#e9c48e';
      ctx.strokeStyle = '#8b5e34';
      ctx.lineWidth = s * 0.06;
      roundPath(-s * 0.48, -s * 0.16, s * 0.94, s * 0.42, s * 0.1);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d96b54';
      ctx.beginPath();
      ctx.arc(-s * 0.2, s * 0.02, s * 0.075, 0, Math.PI * 2);
      ctx.arc(s * 0.04, s * 0.06, s * 0.065, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f5f2e8';
      ctx.lineWidth = s * 0.11;
      ctx.beginPath();
      ctx.moveTo(-s * 0.16, -s * 0.4);
      ctx.lineTo(s * 0.24, -s * 0.02);
      ctx.stroke();
      ctx.strokeStyle = '#b9bfc4';
      ctx.lineWidth = s * 0.065;
      ctx.beginPath();
      ctx.moveTo(s * 0.22, -s * 0.06);
      ctx.lineTo(s * 0.44, s * 0.08);
      ctx.stroke();
    } else if (kind === 'stove') {
      ctx.fillStyle = '#7e3428';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.15, s * 0.46, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3f2613';
      ctx.strokeStyle = '#f2b33d';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.arc(0, s * 0.06, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const flame = ctx.createLinearGradient(0, -s * 0.36, 0, s * 0.32);
      flame.addColorStop(0, '#ffe27a');
      flame.addColorStop(0.55, '#ffb43c');
      flame.addColorStop(1, '#f0662f');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.4);
      ctx.quadraticCurveTo(s * 0.25, -s * 0.04, s * 0.1, s * 0.15);
      ctx.quadraticCurveTo(s * 0.04, s * 0.28, 0, s * 0.32);
      ctx.quadraticCurveTo(-s * 0.06, s * 0.28, -s * 0.11, s * 0.14);
      ctx.quadraticCurveTo(-s * 0.25, -s * 0.04, 0, -s * 0.4);
      ctx.fill();

      ctx.fillStyle = '#fff6c4';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.15);
      ctx.quadraticCurveTo(s * 0.1, 0, 0, s * 0.13);
      ctx.quadraticCurveTo(-s * 0.1, 0, 0, -s * 0.15);
      ctx.fill();
    } else if (kind === 'plating') {
      ctx.fillStyle = '#d9c6a8';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.14, s * 0.46, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fffdf7';
      ctx.strokeStyle = '#c7a477';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.45, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(199, 164, 119, 0.6)';
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.32, s * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#7fbf63';
      ctx.beginPath();
      ctx.arc(-s * 0.12, s * 0.01, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8543f';
      ctx.beginPath();
      ctx.arc(s * 0.13, s * 0.06, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c64b';
      ctx.beginPath();
      ctx.arc(s * 0.01, s * 0.14, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'bin') {
      ctx.fillStyle = '#eae3d6';
      ctx.strokeStyle = '#6b4a2c';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s * 0.16);
      ctx.lineTo(s * 0.28, -s * 0.16);
      ctx.lineTo(s * 0.2, s * 0.36);
      ctx.lineTo(-s * 0.2, s * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      fillRound(ctx, -s * 0.37, -s * 0.32, s * 0.74, s * 0.13, s * 0.05, '#cfc3b0', '#6b4a2c', s * 0.04);
      fillRound(ctx, -s * 0.09, -s * 0.4, s * 0.18, s * 0.1, s * 0.04, '#cfc3b0', '#6b4a2c', s * 0.035);

      ctx.strokeStyle = '#9b8a75';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.06);
      ctx.lineTo(-s * 0.06, s * 0.26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.08, -s * 0.06);
      ctx.lineTo(s * 0.06, s * 0.26);
      ctx.stroke();
    } else if (kind === 'serve') {
      ctx.fillStyle = '#fffdf7';
      ctx.strokeStyle = '#c7a477';
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      ctx.ellipse(-s * 0.05, s * 0.16, s * 0.39, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f2c64b';
      ctx.beginPath();
      ctx.arc(-s * 0.05, s * 0.13, s * 0.14, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#4f9c97';
      ctx.lineWidth = s * 0.09;
      ctx.beginPath();
      ctx.moveTo(s * 0.16, -s * 0.26);
      ctx.lineTo(s * 0.42, -s * 0.06);
      ctx.lineTo(s * 0.16, s * 0.14);
      ctx.stroke();
    } else if (kind === 'pantry') {
      ctx.strokeStyle = '#a9743f';
      ctx.lineWidth = s * 0.055;
      ctx.beginPath();
      ctx.arc(0, s * 0.02, s * 0.36, Math.PI * 0.15, Math.PI * 0.85, true);
      ctx.stroke();

      ctx.fillStyle = '#d8a965';
      ctx.strokeStyle = '#8b5e34';
      ctx.lineWidth = s * 0.045;
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.02);
      ctx.lineTo(s * 0.32, -s * 0.02);
      ctx.lineTo(s * 0.22, s * 0.34);
      ctx.lineTo(-s * 0.22, s * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#b9854a';
      ctx.lineWidth = s * 0.03;
      for (let index = -1; index <= 1; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * s * 0.12, s * 0.02);
        ctx.lineTo(index * s * 0.08, s * 0.3);
        ctx.stroke();
      }

      drawIngredient('tomat', -s * 0.08, -s * 0.13, s * 0.34);
      drawIngredient('selada', s * 0.12, -s * 0.11, s * 0.32);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Papan pesanan dan HUD
  // -------------------------------------------------------------------------

  function drawTicket(order, x, y, w, h, now) {
    const ratio = clamp(order.timeLeft / order.totalTime, 0, 1);
    const color = urgencyColor(ratio);
    const urgent = ratio <= 0.25;
    const glow = urgent ? 0.72 + Math.sin(now * 0.012) * 0.28 : 1;

    fillRound(ctx, x + 3, y + 4, w, h, 12, 'rgba(74, 44, 23, 0.14)');
    fillRound(ctx, x, y, w, h, 12, '#fffaf0', color, urgent ? 4 : 2.5);

    ctx.save();
    ctx.globalAlpha = glow;
    fillRound(ctx, x, y, w, 6, 3, color);
    ctx.restore();

    const avatarX = x + 21;
    const avatarY = y + 22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(avatarX - 3.2, avatarY - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(avatarX + 3.2, avatarY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY + 1, 4, 0.25, Math.PI - 0.25);
    ctx.stroke();

    label(ctx, order.customer, x + 37, y + 22, 13, COLORS.ink, 'left', '800');
    label(ctx, formatClock(order.timeLeft), x + w - 10, y + 22, 12, color, 'right', '800');

    fillRound(ctx, x + 10, y + 28, w - 20, 6, 3, 'rgba(139, 94, 52, 0.16)');
    fillRound(ctx, x + 10, y + 28, (w - 20) * ratio, 6, 3, color);

    label(ctx, order.recipeName, x + 10, y + 48, 13.5, COLORS.ink, 'left', '800');
    label(ctx, `$${order.price}`, x + w - 10, y + 48, 11, COLORS.inkSoft, 'right', '700');

    const checked = order.checked || new Set();
    const step = (w - 22) / order.ingredients.length;
    for (let index = 0; index < order.ingredients.length; index += 1) {
      const id = order.ingredients[index];
      const chipX = x + 12 + index * step;
      const chipY = y + 63;
      const filled = checked.has(id);
      ctx.fillStyle = filled ? '#e2f3dc' : '#f1e7d4';
      ctx.strokeStyle = filled ? '#4f8b5f' : '#c8b492';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(chipX + 5, chipY - 2, 5.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (filled) drawCheckMark(ctx, chipX + 5, chipY - 2, 4.7, '#3f7a4f');
      label(
        ctx,
        ingredientName(id),
        chipX + 13,
        chipY + 2,
        order.ingredients.length > 3 ? 8.5 : 9.5,
        filled ? '#3f6b4a' : '#8a7456',
        'left',
        '700',
      );
    }
  }

  function drawEmptyTicket(x, y, w, h) {
    ctx.setLineDash([7, 6]);
    fillRound(ctx, x, y, w, h, 12, 'rgba(255, 250, 238, 0.38)', '#c9a46b', 2.5);
    ctx.setLineDash([]);
    label(ctx, 'Menunggu pesanan...', x + w / 2, y + h / 2 + 5, 12, '#a9865c', 'center', '700');
  }

  function drawHud(state) {
    const { game, orderBoard } = state;
    const x = 852;
    const y = 10;
    const w = 412;
    const h = 72;
    fillRound(ctx, x + 3, y + 4, w, h, 12, 'rgba(74, 44, 23, 0.12)');
    fillRound(ctx, x, y, w, h, 12, 'rgba(255, 250, 238, 0.9)', '#c9a46b', 2.5);

    const coinX = x + 24;
    const coinY = y + 23;
    const coin = ctx.createRadialGradient(coinX - 3, coinY - 3, 2, coinX, coinY, 12);
    coin.addColorStop(0, '#ffe27a');
    coin.addColorStop(1, '#eab52f');
    ctx.fillStyle = coin;
    ctx.strokeStyle = '#c99a2c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coinX, coinY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, '$', coinX, coinY + 5, 15, '#8a5a12', 'center', '800');

    label(ctx, `$${game.coins}`, x + 44, y + 31, 22, COLORS.ink, 'left', '800');
    label(ctx, `/ $${game.target}`, x + 148, y + 30, 12, COLORS.inkSoft, 'left', '700');

    fillRound(ctx, x + 44, y + 38, 186, 7, 3.5, 'rgba(139, 94, 52, 0.16)');
    const targetRatio = clamp(game.coins / game.target, 0, 1);
    fillRound(ctx, x + 44, y + 38, 186 * targetRatio, 7, 3.5, targetRatio >= 1 ? '#4f8b5f' : COLORS.orange);

    label(ctx, `Combo x${game.combo} · Streak ${game.streak}`, x + 44, y + 63, 11, COLORS.inkSoft, 'left', '700');

    const shiftRatio = clamp(game.shiftTime / game.shiftLength, 0, 1);
    const shiftColor = urgencyColor(shiftRatio);
    label(ctx, 'SISA SHIFT', x + w - 14, y + 16, 9, COLORS.inkSoft, 'right', '800');
    label(ctx, formatClock(game.shiftTime), x + w - 14, y + 40, 24, shiftColor, 'right', '800');

    const next = orderBoard.next();
    const nextText = next ? next.recipeName : 'Tidak ada';
    fillRound(ctx, x + w - 154, y + 49, 140, 17, 8.5, 'rgba(240, 138, 52, 0.14)');
    label(ctx, `NEXT: ${nextText}`, x + w - 14, y + 62, 10.5, '#8a5a28', 'right', '800');
  }

  function drawOrderBoard(state) {
    const { orderBoard, now } = state;
    ctx.fillStyle = COLORS.creamDeep;
    ctx.fillRect(0, 0, WIDTH, 92);

    ctx.fillStyle = 'rgba(139, 94, 52, 0.07)';
    for (let y = 18; y < 84; y += 22) ctx.fillRect(0, y, WIDTH, 2);

    for (let index = 0; index < 11; index += 1) {
      const flagX = 14 + index * 18;
      ctx.fillStyle = index % 2 === 0 ? COLORS.orange : COLORS.teal;
      ctx.beginPath();
      ctx.moveTo(flagX, 0);
      ctx.lineTo(flagX + 12, 0);
      ctx.lineTo(flagX + 6, 7);
      ctx.closePath();
      ctx.fill();
    }

    label(ctx, 'PAPAN PESANAN', 20, 33, 18, COLORS.ink, 'left', '800');
    label(ctx, 'Pesanan pelanggan', 20, 51, 11, COLORS.inkSoft, 'left', '600');
    label(ctx, `Tiket aktif ${orderBoard.orders.length}/${orderLimit}`, 20, 70, 11, COLORS.inkSoft, 'left', '700');

    const startX = 196;
    const ticketW = 210;
    const gap = 8;
    for (let index = 0; index < orderLimit; index += 1) {
      const x = startX + index * (ticketW + gap);
      const order = orderBoard.orders[index];
      if (order) drawTicket(order, x, 10, ticketW, 72, now);
      else drawEmptyTicket(x, 10, ticketW, 72);
    }

    drawHud(state);
  }

  // -------------------------------------------------------------------------
  // Latar dan stasiun
  // -------------------------------------------------------------------------

  function drawFloor() {
    ctx.fillStyle = COLORS.floorB;
    ctx.fillRect(0, PLAY.top, WIDTH, PLAY.bottom - PLAY.top);

    const tile = 80;
    ctx.fillStyle = COLORS.floorA;
    for (let y = PLAY.top; y < PLAY.bottom; y += tile) {
      for (let x = 0; x < WIDTH; x += tile) {
        const parity = (Math.floor(x / tile) + Math.floor(y / tile)) % 2;
        if (parity === 0) ctx.fillRect(x, y, tile, tile);
      }
    }

    ctx.strokeStyle = 'rgba(180, 139, 80, 0.18)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= WIDTH; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, PLAY.top);
      ctx.lineTo(x, PLAY.bottom);
      ctx.stroke();
    }
    for (let y = PLAY.top; y <= PLAY.bottom; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
  }

  function drawWalls() {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 92, WIDTH, 20);
    ctx.fillRect(0, PLAY.top, 20, PLAY.bottom - PLAY.top);
    ctx.fillRect(WIDTH - 20, PLAY.top, 20, PLAY.bottom - PLAY.top);
    ctx.fillRect(0, PLAY.bottom, WIDTH, HEIGHT - PLAY.bottom);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(0, 92, WIDTH, 4);
    ctx.fillRect(0, PLAY.top, 4, PLAY.bottom - PLAY.top);
    ctx.fillRect(WIDTH - 4, PLAY.top, 4, PLAY.bottom - PLAY.top);

    ctx.fillStyle = COLORS.wallDark;
    ctx.fillRect(0, PLAY.bottom - 4, WIDTH, 4);
    ctx.fillRect(0, HEIGHT - 8, WIDTH, 8);
  }

  function drawStationBody(station) {
    fillRound(ctx, station.x + 5, station.y + 8, station.w, station.h, 18, COLORS.shadow);
    fillRound(ctx, station.x, station.y, station.w, station.h, 18, station.fill, station.edge, 4.5);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    roundPath(ctx, station.x + 8, station.y + 8, station.w - 16, 12, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(58, 33, 16, 0.12)';
    roundPath(ctx, station.x + 8, station.y + station.h - 12, station.w - 16, 6, 3);
    ctx.fill();
  }

  function drawPlateContents(items, cx, cy, plateWidth, size) {
    ctx.fillStyle = 'rgba(90, 50, 20, 0.14)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + plateWidth * 0.09, plateWidth * 0.51, plateWidth * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffdf7';
    ctx.strokeStyle = '#c7a477';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, plateWidth / 2, plateWidth * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(199, 164, 119, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, plateWidth * 0.36, plateWidth * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (items.length) {
      const usable = plateWidth * 0.66;
      const spacing = items.length > 1 ? usable / (items.length - 1) : 0;
      const startX = cx - usable / 2;
      for (let index = 0; index < items.length; index += 1) {
        drawIngredient(itemId(items[index]), startX + index * spacing, cy - 2, size);
      }
    }

    ctx.fillStyle = '#7fbf63';
    ctx.beginPath();
    ctx.ellipse(cx - plateWidth * 0.38, cy + plateWidth * 0.04, plateWidth * 0.04, plateWidth * 0.018, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8543f';
    ctx.beginPath();
    ctx.arc(cx + plateWidth * 0.37, cy + plateWidth * 0.02, plateWidth * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStationProgress(station) {
    fillRound(ctx, station.x + 18, station.y + station.h - 16, station.w - 36, 8, 4, 'rgba(58, 33, 16, 0.24)');
    fillRound(
      ctx,
      station.x + 18,
      station.y + station.h - 16,
      (station.w - 36) * clamp(station.progress, 0, 1),
      8,
      4,
      '#ffe08a',
    );
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.arc(station.x + 18 + (station.w - 36) * clamp(station.progress, 0, 1), station.y + station.h - 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlatingStation(station, state) {
    const { kitchen, now } = state;
    const cx = station.x + station.w / 2;
    label(ctx, 'PLATING', cx, station.y + 30, 28, station.ink, 'center', '800');
    label(ctx, 'Tata Sajian', cx, station.y + 48, 12, station.ink, 'center', '600');

    const status = kitchen.plateStatus();
    drawPlateContents(kitchen.plate, cx, station.y + 86, 250, 42);

    if (!kitchen.plate.length) {
      label(ctx, 'Piring kosong', cx, station.y + 92, 13, 'rgba(74, 44, 23, 0.5)', 'center', '700');
      label(ctx, 'Taruh bahan siap di sini', cx, station.y + 124, 12, 'rgba(74, 44, 23, 0.45)', 'center', '600');
      return;
    }

    const total = status.candidate ? status.candidate.ingredients.length : kitchen.plate.length;
    const count = kitchen.plate.length;
    if (status.complete) {
      const pulse = 0.75 + Math.sin(now * 0.008) * 0.25;
      ctx.save();
      ctx.globalAlpha = pulse;
      label(ctx, `${status.complete.name} siap diambil (E)`, cx, station.y + 126, 13, '#3f7a4f', 'center', '800');
      ctx.restore();
    } else if (status.candidate) {
      label(ctx, `Rakitan ${count}/${total} · ${status.candidate.name}`, cx, station.y + 126, 13, COLORS.ink, 'center', '800');
    } else {
      label(ctx, `Rakitan ${count} bahan tidak cocok`, cx, station.y + 126, 12, '#b04a3a', 'center', '800');
    }

    fillRound(ctx, station.x + 34, station.y + 134, station.w - 68, 8, 4, 'rgba(58, 33, 16, 0.2)');
    fillRound(
      ctx,
      station.x + 34,
      station.y + 134,
      (station.w - 68) * (total > 0 ? count / total : 0),
      8,
      4,
      status.complete ? '#4f8b5f' : COLORS.orange,
    );
  }

  function drawStation(station, state) {
    const { kitchen, now } = state;
    drawStationBody(station);

    if (station.kind === 'plating') {
      drawPlatingStation(station, state);
      return;
    }

    const cx = station.x + station.w / 2;
    const iconY = station.y + 34;
    const labelY = station.y + 78;
    const subY = station.y + 98;

    const bob = station.working ? Math.sin(now * 0.02) * 2.2 : 0;
    drawStationIcon(station.kind, cx, iconY + bob, 34);
    label(ctx, station.label, cx, labelY, 30, station.ink, 'center', '800');

    let subText = station.sub;
    if (station.working) {
      const action = station.kind === 'chop' ? 'Memotong' : 'Memasak';
      subText = `${action} ${Math.round(clamp(station.progress, 0, 1) * 100)}%`;
    } else if (station.item) {
      subText = itemCaption(station.item);
    }
    label(ctx, subText, cx, subY, 14, station.ink, 'center', '600');

    if (station.working && station.kind === 'stove') {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.random() * 0.25;
      for (const offset of [-18, 0, 18]) {
        ctx.strokeStyle = '#fffdf7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + offset, station.y + 8);
        ctx.quadraticCurveTo(cx + offset + 8, station.y - 8, cx + offset, station.y - 22);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (station.item) {
      const badgeX = station.x + station.w - 28;
      const badgeY = station.y + station.h - 28;
      ctx.fillStyle = COLORS.white;
      ctx.strokeStyle = station.edge;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawIngredient(itemId(station.item), badgeX, badgeY, 29);

      if (itemReady(station.item)) {
        ctx.fillStyle = '#4f8b5f';
        ctx.strokeStyle = '#fffdf7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(badgeX + 16, badgeY - 15, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawCheckMark(ctx, badgeX + 16, badgeY - 15, 7, '#fffdf7');
      }
    }

    if (station.working) drawStationProgress(station);
  }

  function drawPantry(station) {
    drawStationBody(station);

    const cx = station.x + station.w / 2;
    fillRound(ctx, station.x + 12, station.y + 12, station.w - 24, 42, 12, 'rgba(255, 246, 226, 0.24)');
    label(ctx, 'PANTRY', cx, station.y + 34, 26, station.ink, 'center', '800');
    label(ctx, 'Rak Bahan', cx, station.y + 51, 13, station.ink, 'center', '600');

    for (const slot of pantrySlots) {
      fillRound(ctx, slot.x, slot.y, slot.w, slot.h, 12, '#fff6e2', '#d9b77e', 3);
      ctx.fillStyle = 'rgba(217, 183, 126, 0.18)';
      roundPath(ctx, slot.x, slot.y, slot.w, slot.h * 0.36, 10);
      ctx.fill();
      drawIngredient(slot.ingredient.id, slot.cx, slot.y + slot.h * 0.4, Math.min(slot.w, slot.h) * 0.62);
      label(ctx, slot.ingredient.name, slot.cx, slot.y + slot.h - 17, 14, '#5a3a1f', 'center', '700');
    }
  }

  function drawServeLane(station) {
    fillRound(ctx, station.x, station.y, station.w, station.h, 18, 'rgba(79, 156, 151, 0.18)', station.fill, 3);

    ctx.setLineDash([11, 9]);
    roundPath(ctx, station.x + 10, station.y + 10, station.w - 20, station.h - 20, 14);
    ctx.strokeStyle = 'rgba(79, 156, 151, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    const cx = station.x + station.w / 2;
    label(ctx, 'SERVE PASS', cx, station.y + 42, 24, COLORS.tealDark, 'center', '800');
    label(ctx, 'Jalur Antar', cx, station.y + 64, 14, '#4f8b86', 'center', '600');

    drawStationIcon('serve', cx, station.y + 112, 38);

    ctx.strokeStyle = 'rgba(79, 156, 151, 0.62)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let index = 0; index < 5; index += 1) {
      const y = station.y + 178 + index * 74;
      ctx.beginPath();
      ctx.moveTo(cx - 17, y + 12);
      ctx.lineTo(cx, y - 8);
      ctx.lineTo(cx + 17, y + 12);
      ctx.stroke();
    }
  }

  // -------------------------------------------------------------------------
  // Kiko si koki kucing
  // -------------------------------------------------------------------------

  function drawKiko(state) {
    const { game, kitchen, now } = state;
    const kiko = game.kiko;
    const moving = kiko.moving && game.screen === 'bermain';
    const bob = Math.sin(now * (moving ? 0.014 : 0.004)) * (moving ? 2.4 : 1);
    const blink = Math.sin(now * 0.0017) > 0.985;

    ctx.save();
    ctx.fillStyle = 'rgba(74, 44, 23, 0.22)';
    ctx.beginPath();
    ctx.ellipse(kiko.x, kiko.y + 32, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(kiko.x, kiko.y + bob);
    if (kiko.facingLeft) ctx.scale(-1, 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const wag = Math.sin(now * (moving ? 0.018 : 0.006)) * 8;

    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(21, 16);
    ctx.quadraticCurveTo(48, 10 + wag, 44, -10 + wag * 0.4);
    ctx.stroke();
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(21, 16);
    ctx.quadraticCurveTo(48, 10 + wag, 44, -10 + wag * 0.4);
    ctx.stroke();
    ctx.strokeStyle = '#ffd8b0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(41, -7 + wag * 0.4);
    ctx.lineTo(46, -11 + wag * 0.4);
    ctx.stroke();

    ctx.fillStyle = COLORS.orange;
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 12, 28, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff2d6';
    ctx.strokeStyle = '#d9b77e';
    ctx.lineWidth = 2.5;
    roundPath(ctx, -19, 4, 38, 29, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f08a34';
    ctx.beginPath();
    ctx.arc(-24, 16, 9.5, 0, Math.PI * 2);
    ctx.arc(24, 16, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c96b1f';
    ctx.beginPath();
    ctx.arc(0, 16, 2.3, 0, Math.PI * 2);
    ctx.arc(0, 25, 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f7b6a6';
    ctx.beginPath();
    ctx.ellipse(0, 27, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.orange;
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -22, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-27, -36);
    ctx.lineTo(-21, -59);
    ctx.lineTo(-4, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(27, -36);
    ctx.lineTo(21, -59);
    ctx.lineTo(4, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f7b6a6';
    ctx.beginPath();
    ctx.moveTo(-21, -40);
    ctx.lineTo(-18, -52);
    ctx.lineTo(-10, -45);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(21, -40);
    ctx.lineTo(18, -52);
    ctx.lineTo(10, -45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fffdf7';
    ctx.strokeStyle = '#d9c9b0';
    ctx.lineWidth = 2;
    for (const puff of [[-14, -65, 13], [0, -74, 16], [14, -65, 13]]) {
      ctx.beginPath();
      ctx.arc(puff[0], puff[1], puff[2], 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    fillRound(ctx, -23, -58, 46, 13, 5, '#fffdf7', '#d9c9b0', 2);
    fillRound(ctx, -19, -55, 38, 4, 2, '#d8543f');

    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.ellipse(-9, -25, 6.4, blink ? 1.2 : 7.4, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -25, 6.4, blink ? 1.2 : 7.4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#3a2110';
      ctx.beginPath();
      ctx.arc(-8.4, -24.4, 3.6, 0, Math.PI * 2);
      ctx.arc(9.6, -24.4, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(-9.2, -25.6, 1.4, 0, Math.PI * 2);
      ctx.arc(8.8, -25.6, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f3a1a1';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-4.2, -14.4);
    ctx.lineTo(4.2, -14.4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -10.5);
    ctx.quadraticCurveTo(-8.5, -6, -13, -9.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -10.5);
    ctx.quadraticCurveTo(8.5, -6, 13, -9.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(90, 58, 31, 0.65)';
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      for (let index = -1; index <= 1; index += 1) {
        ctx.beginPath();
        ctx.moveTo(side * 21, -18 + index * 4);
        ctx.lineTo(side * 39, -22 + index * 7);
        ctx.stroke();
      }
    }

    ctx.fillStyle = 'rgba(240, 138, 52, 0.3)';
    ctx.beginPath();
    ctx.arc(-17, -14, 5.4, 0, Math.PI * 2);
    ctx.arc(17, -14, 5.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffdf7e';
    ctx.beginPath();
    ctx.arc(-30, 4, 2.2, 0, Math.PI * 2);
    ctx.arc(30, 4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (kitchen.carried) {
      const itemY = kiko.y - 106 + bob;
      if (kitchen.carried.kind === 'dish') {
        drawPlateContents(kitchen.carried.ingredients, kiko.x, itemY, 78, 25);
      } else {
        ctx.fillStyle = 'rgba(255, 253, 247, 0.8)';
        ctx.beginPath();
        ctx.arc(kiko.x, itemY, 25, 0, Math.PI * 2);
        ctx.fill();
        drawIngredient(itemId(kitchen.carried), kiko.x, itemY, 38);
        if (itemReady(kitchen.carried)) {
          ctx.fillStyle = '#4f8b5f';
          ctx.strokeStyle = '#fffdf7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(kiko.x + 18, itemY - 17, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawCheckMark(ctx, kiko.x + 18, itemY - 17, 6, '#fffdf7');
        }
      }
    }

    if (moving && Math.random() < 0.08) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(kiko.x + (Math.random() - 0.5) * 44, kiko.y - 70 - Math.random() * 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -------------------------------------------------------------------------
  // Petunjuk dan pesan
  // -------------------------------------------------------------------------

  function distanceToServe(game) {
    const serve = stations.find((station) => station.kind === 'serve');
    const nx = clamp(game.kiko.x, serve.x, serve.x + serve.w);
    const ny = clamp(game.kiko.y, serve.y, serve.y + serve.h);
    return Math.hypot(game.kiko.x - nx, game.kiko.y - ny);
  }

  function drawTooltip(text, x, y) {
    ctx.font = `700 16px ${FONT}`;
    const tooltipWidth = ctx.measureText(text).width + 30;
    const tooltipHeight = 34;
    const boxX = clamp(x - tooltipWidth / 2, 10, WIDTH - tooltipWidth - 10);
    const boxY = clamp(y + 52, 10, HEIGHT - tooltipHeight - 10);

    fillRound(ctx, boxX, boxY, tooltipWidth, tooltipHeight, 12, '#fff6e2', '#8b5e34', 2.5);
    label(ctx, text, boxX + tooltipWidth / 2, boxY + 23, 16, COLORS.ink, 'center', '700');
  }

  function drawHints(state) {
    const { game, prompt, now } = state;

    if (game.screen === 'bermain' && prompt) {
      drawTooltip(prompt, game.kiko.x, game.kiko.y);
    }

    if (game.screen === 'bermain' && game.tutorialTime > 0) {
      label(
        ctx,
        '1 PANTRY ambil bahan   >   2 CHOP potong   >   3 STOVE masak   >   4 PLATING tata   >   5 SERVE antar',
        WIDTH / 2,
        704,
        11.5,
        '#ffe9b8',
        'center',
        '800',
      );
      label(
        ctx,
        'WASD / Panah: jalan  ·  Klik: jalan  ·  E: ambil/taruh  ·  Spasi: sajikan  ·  P: jeda  ·  M: suara',
        WIDTH / 2,
        717,
        9.2,
        '#fdf3dc',
        'center',
        '600',
      );
    } else {
      label(
        ctx,
        'WASD / Panah: jalan  ·  Klik: jalan ke titik  ·  E: ambil/taruh  ·  Spasi: sajikan  ·  P: jeda  ·  M: suara ON/OFF',
        WIDTH / 2,
        712,
        13,
        '#fdf3dc',
        'center',
        '600',
      );
    }

    if (game.messageTimer > 0 && game.message) {
      ctx.font = `700 18px ${FONT}`;
      const messageWidth = ctx.measureText(game.message).width + 44;
      const x = (WIDTH - messageWidth) / 2;
      const y = 636 + Math.sin(now * 0.006) * 1.5;
      fillRound(ctx, x, y, messageWidth, 38, 19, 'rgba(255, 246, 226, 0.96)', '#8b5e34', 2.5);
      label(ctx, game.message, WIDTH / 2, y + 25, 18, COLORS.ink, 'center', '700');
    }
  }

  // -------------------------------------------------------------------------
  // Strip tutorial, panel, dan layar
  // -------------------------------------------------------------------------

  const TUTORIAL_STEPS = [
    { title: 'PANTRY', text: 'Ambil bahan', detail: 'dari rak', kind: 'pantry' },
    { title: 'CHOP', text: 'Potong bahan', detail: 'di meja', kind: 'chop' },
    { title: 'STOVE', text: 'Masak sampai', detail: 'matang', kind: 'stove' },
    { title: 'PLATING', text: 'Tata bahan', detail: 'di piring', kind: 'plating' },
    { title: 'SERVE', text: 'Antar lalu', detail: 'tekan Spasi', kind: 'serve' },
  ];

  function drawStepCard(step, index, x, y, w, h) {
    fillRound(ctx, x + 3, y + 4, w, h, 16, 'rgba(74, 44, 23, 0.12)');
    fillRound(ctx, x, y, w, h, 16, index % 2 === 0 ? '#fffaf0' : '#ffeecb', '#d7b47c', 2.5);

    ctx.fillStyle = index < 3 ? COLORS.orange : COLORS.teal;
    ctx.beginPath();
    ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, String(index + 1), x + 22, y + 27, 14, '#fffdf7', 'center', '800');

    label(ctx, step.title, x + 42, y + 28, 17, COLORS.ink, 'left', '800');

    drawStationIcon(step.kind, x + w / 2, y + 86, 54);

    label(ctx, step.text, x + w / 2, y + h - 34, 13.5, COLORS.ink, 'center', '700');
    label(ctx, step.detail, x + w / 2, y + h - 16, 11.5, COLORS.inkSoft, 'center', '600');
  }

  function drawTutorialStrip(x, y, w, h, gap = 12) {
    const cardW = (w - gap * (TUTORIAL_STEPS.length - 1)) / TUTORIAL_STEPS.length;
    for (let index = 0; index < TUTORIAL_STEPS.length; index += 1) {
      drawStepCard(TUTORIAL_STEPS[index], index, x + index * (cardW + gap), y, cardW, h);
    }
  }

  function drawPanel(x, y, w, h) {
    fillRound(ctx, x + 6, y + 8, w, h, 28, 'rgba(58, 33, 16, 0.3)');
    fillRound(ctx, x, y, w, h, 28, '#fff6e2', '#8b5e34', 5);
    ctx.fillStyle = 'rgba(240, 138, 52, 0.16)';
    ctx.fillRect(x + 22, y + 20, w - 44, 6);
  }

  function drawScreens(state) {
    const { game, now, muted } = state;

    if (game.screen !== 'judul' && game.screen !== 'jeda' && game.screen !== 'selesai') return;

    ctx.fillStyle = 'rgba(74, 44, 23, 0.42)';
    ctx.fillRect(0, 92, WIDTH, HEIGHT - 92);

    if (game.screen === 'judul') {
      const x = 80;
      const y = 120;
      const w = 1120;
      const h = 536;
      drawPanel(x, y, w, h);

      for (const star of [[180, 176, 12], [1100, 178, 10], [150, 610, 8], [1130, 600, 9]]) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#f2c64b';
        starPath(ctx, star[0], star[1], star[2], star[2] * 0.45, 5, now * 0.0008);
        ctx.fill();
        ctx.restore();
      }

      label(ctx, 'Dapur Ceria Kiko', WIDTH / 2, y + 72, 50, COLORS.orangeDark, 'center', '800');
      label(ctx, 'Bantu Kiko si koki kucing memasak untuk pelanggan!', WIDTH / 2, y + 108, 18, COLORS.inkSoft, 'center', '600');

      drawTutorialStrip(x + 28, y + 132, w - 56, 196);

      label(
        ctx,
        'Capai target $120 sebelum waktu shift 3:00 habis. Jalan dengan WASD / panah atau klik lantai.',
        WIDTH / 2,
        y + 366,
        15,
        COLORS.ink,
        'center',
        '700',
      );
      label(
        ctx,
        'E untuk ambil / taruh bahan  ·  Spasi untuk menyajikan  ·  P untuk jeda  ·  M untuk suara',
        WIDTH / 2,
        y + 392,
        13.5,
        COLORS.inkSoft,
        'center',
        '600',
      );

      const pulse = 0.72 + Math.sin(now * 0.006) * 0.28;
      ctx.save();
      ctx.globalAlpha = pulse;
      label(ctx, 'Tekan Spasi atau klik untuk mulai', WIDTH / 2, y + h - 42, 25, COLORS.orangeDark, 'center', '800');
      ctx.restore();
      label(
        ctx,
        muted ? 'Suara: MATI (M)' : 'Suara: NYALA (M)',
        x + w - 24,
        y + h - 18,
        12,
        muted ? '#b04a3a' : COLORS.inkSoft,
        'right',
        '700',
      );
    } else if (game.screen === 'jeda') {
      const w = 520;
      const h = 250;
      const x = (WIDTH - w) / 2;
      const y = (HEIGHT - h) / 2;
      drawPanel(x, y, w, h);
      label(ctx, 'Jeda', WIDTH / 2, y + 78, 48, COLORS.orangeDark, 'center', '800');
      label(ctx, 'Dapur menunggu Kiko.', WIDTH / 2, y + 124, 20, COLORS.inkSoft, 'center', '600');
      label(
        ctx,
        'Tekan P atau Spasi untuk lanjut',
        WIDTH / 2,
        y + h - 42,
        23,
        COLORS.orangeDark,
        'center',
        '800',
      );
    } else if (game.screen === 'selesai') {
      const x = 250;
      const y = 140;
      const w = 780;
      const h = 480;
      drawPanel(x, y, w, h);

      const targetMet = game.coins >= game.target;
      label(ctx, 'Shift Selesai!', WIDTH / 2, y + 78, 50, COLORS.orangeDark, 'center', '800');
      label(
        ctx,
        targetMet ? 'Target tercapai! Dapur Ceria bangga pada Kiko.' : 'Belum mencapai target. Ayo coba lagi!',
        WIDTH / 2,
        y + 108,
        16,
        targetMet ? '#3f7a4f' : '#a9522f',
        'center',
        '700',
      );

      const stats = [
        { title: 'Masakan disajikan', value: String(game.served), unit: 'piring', color: COLORS.tealDark },
        { title: 'Koin didapat', value: `$${game.coins}`, unit: `target $${game.target}`, color: '#b7791f' },
        { title: 'Combo terbaik', value: `x${game.bestCombo}`, unit: 'beruntun', color: COLORS.orangeDark },
      ];
      const cardW = 218;
      const cardH = 128;
      const gap = 16;
      const totalW = cardW * stats.length + gap * (stats.length - 1);
      const startX = x + (w - totalW) / 2;
      stats.forEach((stat, index) => {
        const cardX = startX + index * (cardW + gap);
        const cardY = y + 132;
        fillRound(ctx, cardX + 3, cardY + 4, cardW, cardH, 16, 'rgba(74, 44, 23, 0.12)');
        fillRound(ctx, cardX, cardY, cardW, cardH, 16, '#fffaf0', '#e0c08c', 2.5);
        label(ctx, stat.title, cardX + cardW / 2, cardY + 34, 13, COLORS.inkSoft, 'center', '700');
        label(ctx, stat.value, cardX + cardW / 2, cardY + 82, 38, stat.color, 'center', '800');
        label(ctx, stat.unit, cardX + cardW / 2, cardY + 106, 12, COLORS.inkSoft, 'center', '600');
      });

      label(
        ctx,
        `Sisa waktu ${formatClock(game.shiftTime)}  ·  Streak terakhir ${game.streak}  ·  Kombo sekarang x${game.combo}`,
        WIDTH / 2,
        y + 296,
        14,
        COLORS.inkSoft,
        'center',
        '600',
      );

      const pulse = 0.86 + Math.sin(now * 0.007) * 0.14;
      ctx.save();
      ctx.globalAlpha = pulse;
      fillRound(ctx, END_BUTTON.x + 4, END_BUTTON.y + 5, END_BUTTON.w, END_BUTTON.h, 20, 'rgba(90, 45, 18, 0.24)');
      fillRound(ctx, END_BUTTON.x, END_BUTTON.y, END_BUTTON.w, END_BUTTON.h, 20, COLORS.orange, '#a94e1d', 3.5);
      fillRound(ctx, END_BUTTON.x + 8, END_BUTTON.y + 8, END_BUTTON.w - 16, 12, 6, 'rgba(255, 255, 255, 0.28)');
      ctx.restore();
      label(
        ctx,
        'PLAY AGAIN',
        END_BUTTON.x + END_BUTTON.w / 2,
        END_BUTTON.y + 45,
        27,
        '#fffdf7',
        'center',
        '800',
      );
      label(
        ctx,
        'Klik tombol atau tekan Spasi',
        WIDTH / 2,
        END_BUTTON.y + END_BUTTON.h + 26,
        14,
        COLORS.inkSoft,
        'center',
        '600',
      );
    }
  }

  function drawKitchen(state) {
    drawOrderBoard(state);
    drawFloor();

    for (const station of stations) {
      if (station.kind === 'pantry') drawPantry(station);
      else if (station.kind === 'serve') drawServeLane(station);
      else drawStation(station, state);
    }

    drawWalls();
    drawKiko(state);
    drawHints(state);
  }

  return {
    drawKitchen,
    drawScreens,
    drawIngredient,
    drawStationIcon,
    drawHud,
    drawOrderBoard,
    distanceToServe,
  };
}
