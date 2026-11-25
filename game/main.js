// Dapur Ceria Kiko - kerangka game memasak 2D untuk anak-anak.
// Satu canvas 1280x720, semua gambar dilukis dengan bentuk canvas, tanpa aset atau
// permintaan jaringan. Sesi ini menyiapkan dapur, Kiko, gerak, kamera tetap, state
// permainan, dan kait screenshot (?shot=start|play|end serta window.__kiko).

const WIDTH = 1280;
const HEIGHT = 720;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const SCREEN = Object.freeze({
  TITLE: 'judul',
  PLAY: 'bermain',
  PAUSE: 'jeda',
  END: 'selesai',
});

const COLORS = {
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

const PLAY = { left: 20, top: 112, right: 1260, bottom: 692 };
const KIKO_RADIUS = 22;
const KIKO_SPEED = 270;
const INTERACT_RADIUS = 118;
const STATION_RADIUS = 64;

const INGREDIENTS = [
  { id: 'roti', name: 'Roti' },
  { id: 'telur', name: 'Telur' },
  { id: 'tomat', name: 'Tomat' },
  { id: 'keju', name: 'Keju' },
  { id: 'selada', name: 'Selada' },
  { id: 'daging', name: 'Daging' },
];

const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

const STATIONS = [
  {
    id: 'pantry',
    kind: 'pantry',
    label: 'PANTRY',
    sub: 'Rak Bahan',
    x: 28,
    y: 132,
    w: 188,
    h: 536,
    fill: '#c98a4b',
    edge: '#8b5e34',
    ink: '#3f2613',
    solid: true,
  },
  {
    id: 'chop1',
    kind: 'chop',
    label: 'CHOP',
    sub: 'Potong',
    x: 320,
    y: 144,
    w: 190,
    h: 112,
    fill: '#e07a3f',
    edge: '#a94e1d',
    ink: '#fff7e6',
    solid: true,
    item: null,
  },
  {
    id: 'chop2',
    kind: 'chop',
    label: 'CHOP',
    sub: 'Potong',
    x: 530,
    y: 144,
    w: 190,
    h: 112,
    fill: '#e07a3f',
    edge: '#a94e1d',
    ink: '#fff7e6',
    solid: true,
    item: null,
  },
  {
    id: 'stove1',
    kind: 'stove',
    label: 'STOVE',
    sub: 'Masak',
    x: 320,
    y: 292,
    w: 190,
    h: 112,
    fill: '#c9543f',
    edge: '#8e3325',
    ink: '#fff7e6',
    solid: true,
    item: null,
  },
  {
    id: 'stove2',
    kind: 'stove',
    label: 'STOVE',
    sub: 'Masak',
    x: 530,
    y: 292,
    w: 190,
    h: 112,
    fill: '#c9543f',
    edge: '#8e3325',
    ink: '#fff7e6',
    solid: true,
    item: null,
  },
  {
    id: 'plating',
    kind: 'plating',
    label: 'PLATING',
    sub: 'Tata Sajian',
    x: 320,
    y: 440,
    w: 400,
    h: 150,
    fill: '#d6a33f',
    edge: '#9c7120',
    ink: '#4a2c17',
    solid: true,
    item: null,
  },
  {
    id: 'serve',
    kind: 'serve',
    label: 'SERVE PASS',
    sub: 'Jalur Antar',
    x: 800,
    y: 132,
    w: 200,
    h: 536,
    fill: '#4f9c97',
    edge: '#34706c',
    ink: '#fff7e6',
    solid: false,
  },
  {
    id: 'bin',
    kind: 'bin',
    label: 'BIN',
    sub: 'Sampah',
    x: 1050,
    y: 560,
    w: 170,
    h: 108,
    fill: '#8a7766',
    edge: '#5e4c3c',
    ink: '#fff7e6',
    solid: true,
  },
];

const PANTRY = STATIONS.find((station) => station.kind === 'pantry');
const PANTRY_SLOTS = [];

for (let row = 0; row < 3; row += 1) {
  for (let column = 0; column < 2; column += 1) {
    const innerX = PANTRY.x + 10;
    const innerW = PANTRY.w - 20;
    const gap = 8;
    const slotW = (innerW - gap) / 2;
    const slotH = (PANTRY.h - 64 - gap * 2) / 3;
    const x = innerX + column * (slotW + gap);
    const y = PANTRY.y + 54 + row * (slotH + gap);
    const ingredient = INGREDIENTS[row * 2 + column];
    PANTRY_SLOTS.push({
      x,
      y,
      w: slotW,
      h: slotH,
      cx: x + slotW / 2,
      cy: y + slotH / 2,
      ingredient,
    });
  }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const game = {
  screen: SCREEN.TITLE,
  elapsed: 0,
  served: 0,
  carried: null,
  message: '',
  messageTimer: 0,
  kiko: {
    x: 760,
    y: 360,
    r: KIKO_RADIUS,
    facingLeft: false,
    moving: false,
  },
};

const keys = new Set();
const moveKeys = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

let moveTarget = null;
let lastTime = performance.now();

// ---------------------------------------------------------------------------
// Alat gambar kecil
// ---------------------------------------------------------------------------

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function roundPath(x, y, w, h, radius) {
  const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(x, y, w, h, radius, fill, stroke, lineWidth) {
  roundPath(x, y, w, h, radius);
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

function label(str, x, y, size, color, align = 'left', weight = '700') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function distanceToRect(cx, cy, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return Math.hypot(cx - nx, cy - ny);
}

function circleHitsRect(cx, cy, radius, rect) {
  return distanceToRect(cx, cy, rect) < radius;
}

function ingredientName(id) {
  const ingredient = INGREDIENT_BY_ID.get(id);
  return ingredient ? ingredient.name : id;
}

// ---------------------------------------------------------------------------
// Menggambar bahan dengan bentuk canvas sederhana
// ---------------------------------------------------------------------------

function drawIngredient(id, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (id === 'roti') {
    ctx.fillStyle = '#d79a55';
    ctx.strokeStyle = '#9a642b';
    ctx.lineWidth = s * 0.06;
    roundPath(-s * 0.34, -s * 0.18, s * 0.68, s * 0.42, s * 0.14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f0c484';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.3, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b77b34';
    ctx.lineWidth = s * 0.04;
    for (let index = -1; index <= 1; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * s * 0.16 - s * 0.04, -s * 0.24);
      ctx.lineTo(index * s * 0.16 + s * 0.05, -s * 0.05);
      ctx.stroke();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#fffdf7';
    ctx.strokeStyle = '#d8cbb6';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.26, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f2b33d';
    ctx.strokeStyle = '#d29326';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.arc(s * 0.03, s * 0.03, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(-s * 0.01, -s * 0.01, s * 0.045, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tomat') {
    ctx.fillStyle = '#d8543f';
    ctx.strokeStyle = '#a9382a';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.29, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.1, s * 0.08, s * 0.05, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5e9a4e';
    for (let index = 0; index < 5; index += 1) {
      ctx.save();
      ctx.rotate(-Math.PI / 2 + index * ((Math.PI * 2) / 5));
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.27, s * 0.055, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#4c7f3f';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'keju') {
    ctx.fillStyle = '#f2c64b';
    ctx.strokeStyle = '#c99a2c';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, s * 0.2);
    ctx.lineTo(s * 0.32, s * 0.1);
    ctx.lineTo(s * 0.32, -s * 0.12);
    ctx.lineTo(-s * 0.32, -s * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffdf7e';
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, -s * 0.02);
    ctx.lineTo(s * 0.32, -s * 0.12);
    ctx.lineTo(s * 0.18, -s * 0.28);
    ctx.lineTo(-s * 0.22, -s * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d9a32f';
    const holes = [
      [-0.12, 0.06, 0.06],
      [0.1, 0.02, 0.045],
      [0.18, -0.04, 0.035],
      [-0.02, -0.18, 0.04],
    ];
    for (const hole of holes) {
      ctx.beginPath();
      ctx.arc(hole[0] * s, hole[1] * s, hole[2] * s, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'selada') {
    ctx.fillStyle = '#5e9a4e';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.04, s * 0.32, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    const leaves = [
      [-0.16, -0.04, 0.17],
      [0.14, -0.06, 0.16],
      [0, -0.16, 0.15],
      [0, 0.08, 0.14],
    ];
    ctx.fillStyle = '#7fbf63';
    for (const leaf of leaves) {
      ctx.beginPath();
      ctx.arc(leaf[0] * s, leaf[1] * s, leaf[2] * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#4c7f3f';
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.22);
    ctx.lineTo(s * 0.02, s * 0.02);
    ctx.stroke();
  } else if (id === 'daging') {
    ctx.fillStyle = '#c96a5a';
    ctx.strokeStyle = '#8e4536';
    ctx.lineWidth = s * 0.05;
    roundPath(-s * 0.32, -s * 0.22, s * 0.64, s * 0.44, s * 0.18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e08b78';
    roundPath(-s * 0.2, -s * 0.14, s * 0.3, s * 0.22, s * 0.1);
    ctx.fill();

    ctx.strokeStyle = '#f4c4b4';
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, s * 0.08);
    ctx.quadraticCurveTo(-s * 0.05, s * 0.02, s * 0.12, s * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.02, -s * 0.16);
    ctx.quadraticCurveTo(s * 0.12, -s * 0.1, s * 0.2, -s * 0.02);
    ctx.stroke();

    ctx.fillStyle = '#fffdf7';
    ctx.strokeStyle = '#d8cbb6';
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.arc(s * 0.29, -s * 0.18, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawStationIcon(kind, cx, cy, size) {
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'chop') {
    fillRound(-s * 0.45, -s * 0.18, s * 0.9, s * 0.42, s * 0.1, '#e9c48e', '#8b5e34', s * 0.06);

    ctx.strokeStyle = '#f5f2e8';
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.36);
    ctx.lineTo(s * 0.22, -s * 0.02);
    ctx.stroke();

    ctx.strokeStyle = '#b9bfc4';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.06);
    ctx.lineTo(s * 0.42, s * 0.06);
    ctx.stroke();
  } else if (kind === 'stove') {
    ctx.fillStyle = '#8a3a2c';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f6c7a8';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.quadraticCurveTo(s * 0.18, -s * 0.02, 0, s * 0.22);
    ctx.quadraticCurveTo(-s * 0.18, -s * 0.02, 0, -s * 0.3);
    ctx.fill();

    ctx.fillStyle = '#f08a34';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.13);
    ctx.quadraticCurveTo(s * 0.1, 0, 0, s * 0.14);
    ctx.quadraticCurveTo(-s * 0.1, 0, 0, -s * 0.13);
    ctx.fill();
  } else if (kind === 'plating') {
    ctx.fillStyle = '#fffdf7';
    ctx.strokeStyle = '#c7a477';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.44, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7fbf63';
    ctx.beginPath();
    ctx.arc(-s * 0.1, s * 0.02, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d8543f';
    ctx.beginPath();
    ctx.arc(s * 0.12, s * 0.06, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bin') {
    ctx.fillStyle = '#eae3d6';
    ctx.strokeStyle = '#6b4a2c';
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.22);
    ctx.lineTo(s * 0.28, -s * 0.22);
    ctx.lineTo(s * 0.2, s * 0.34);
    ctx.lineTo(-s * 0.2, s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    fillRound(-s * 0.36, -s * 0.34, s * 0.72, s * 0.12, s * 0.05, '#cfc3b0', '#6b4a2c', s * 0.04);

    ctx.strokeStyle = '#9b8a75';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.12);
    ctx.lineTo(-s * 0.06, s * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.08, -s * 0.12);
    ctx.lineTo(s * 0.06, s * 0.24);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Latar dapur, papan pesanan, stasiun
// ---------------------------------------------------------------------------

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

function drawOrderBoard() {
  ctx.fillStyle = COLORS.creamDeep;
  ctx.fillRect(0, 0, WIDTH, 92);

  ctx.fillStyle = 'rgba(139, 94, 52, 0.08)';
  for (let y = 18; y < 84; y += 22) ctx.fillRect(0, y, WIDTH, 2);

  label('PAPAN PESANAN', 26, 42, 28, COLORS.ink, 'left', '800');
  label('Pesanan pelanggan akan tampil di sini', 27, 66, 14, COLORS.inkSoft, 'left', '600');

  fillRound(408, 14, 464, 64, 14, 'rgba(255, 250, 238, 0.6)', '#c9a46b', 3);
  ctx.setLineDash([9, 7]);
  roundPath(408, 14, 464, 64, 14);
  ctx.strokeStyle = '#c9a46b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
  label('Belum ada pesanan', 640, 52, 20, '#a9865c', 'center', '700');

  drawStationIcon('plating', 1118, 45, 34);
  label(`Sajian: ${game.served}`, 1254, 56, 24, COLORS.ink, 'right', '800');
}

function drawStationBody(station) {
  fillRound(station.x + 5, station.y + 7, station.w, station.h, 16, COLORS.shadow);
  fillRound(station.x, station.y, station.w, station.h, 16, station.fill, station.edge, 4);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  roundPath(station.x + 8, station.y + 8, station.w - 16, 12, 6);
  ctx.fill();
}

function drawStation(station) {
  drawStationBody(station);

  const cx = station.x + station.w / 2;
  const iconY = station.y + (station.kind === 'plating' ? 38 : 32);
  const labelY = station.y + (station.kind === 'plating' ? 92 : 76);
  const subY = station.y + (station.kind === 'plating' ? 114 : 96);
  const labelSize = station.kind === 'plating' ? 32 : 30;

  drawStationIcon(station.kind, cx, iconY, station.kind === 'plating' ? 38 : 32);
  label(station.label, cx, labelY, labelSize, station.ink, 'center', '800');
  label(station.sub, cx, subY, 14, station.ink, 'center', '600');

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
    drawIngredient(station.item, badgeX, badgeY, 28);
  }
}

function drawPantry(station) {
  drawStationBody(station);

  const cx = station.x + station.w / 2;
  label('PANTRY', cx, station.y + 34, 25, station.ink, 'center', '800');
  label('Rak Bahan', cx, station.y + 51, 13, station.ink, 'center', '600');

  for (const slot of PANTRY_SLOTS) {
    fillRound(slot.x, slot.y, slot.w, slot.h, 12, '#fff6e2', '#d9b77e', 3);
    drawIngredient(slot.ingredient.id, slot.cx, slot.y + slot.h * 0.4, Math.min(slot.w, slot.h) * 0.62);
    label(slot.ingredient.name, slot.cx, slot.y + slot.h - 17, 14, '#5a3a1f', 'center', '700');
  }
}

function drawServeLane(station) {
  fillRound(station.x, station.y, station.w, station.h, 18, 'rgba(79, 156, 151, 0.18)', station.fill, 3);

  ctx.setLineDash([11, 9]);
  roundPath(station.x + 10, station.y + 10, station.w - 20, station.h - 20, 14);
  ctx.strokeStyle = 'rgba(79, 156, 151, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);

  const cx = station.x + station.w / 2;
  label('SERVE PASS', cx, station.y + 42, 24, COLORS.tealDark, 'center', '800');
  label('Jalur Antar', cx, station.y + 64, 14, '#4f8b86', 'center', '600');

  ctx.strokeStyle = 'rgba(79, 156, 151, 0.62)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let index = 0; index < 5; index += 1) {
    const y = station.y + 148 + index * 88;
    ctx.beginPath();
    ctx.moveTo(cx - 17, y + 12);
    ctx.lineTo(cx, y - 8);
    ctx.lineTo(cx + 17, y + 12);
    ctx.stroke();
  }
}

function drawKitchen(now) {
  drawOrderBoard();
  drawFloor();

  for (const station of STATIONS) {
    if (station.kind === 'pantry') drawPantry(station);
    else if (station.kind === 'serve') drawServeLane(station);
    else drawStation(station);
  }

  drawWalls();
  drawKiko(now);
  drawHints(now);
}

// ---------------------------------------------------------------------------
// Kiko, kucing koki
// ---------------------------------------------------------------------------

function drawKiko(now) {
  const kiko = game.kiko;
  const moving = kiko.moving && game.screen === SCREEN.PLAY;
  const bob = Math.sin(now * (moving ? 0.014 : 0.004)) * (moving ? 2.2 : 1);

  ctx.save();
  ctx.fillStyle = 'rgba(74, 44, 23, 0.22)';
  ctx.beginPath();
  ctx.ellipse(kiko.x, kiko.y + 30, 32, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(kiko.x, kiko.y + bob);
  if (kiko.facingLeft) ctx.scale(-1, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(20, 16);
  ctx.quadraticCurveTo(46, 12, 44, -6);
  ctx.stroke();
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(20, 16);
  ctx.quadraticCurveTo(46, 12, 44, -6);
  ctx.stroke();

  ctx.fillStyle = COLORS.orange;
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 12, 27, 29, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  fillRound(-18, 5, 36, 27, 10, '#fff2d6', '#d9b77e', 2.5);
  ctx.fillStyle = '#c96b1f';
  ctx.beginPath();
  ctx.arc(0, 15, 2.2, 0, Math.PI * 2);
  ctx.arc(0, 24, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.orange;
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-25, 16, 9, 0, Math.PI * 2);
  ctx.arc(25, 16, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(0, -22, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-26, -36);
  ctx.lineTo(-20, -58);
  ctx.lineTo(-4, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(26, -36);
  ctx.lineTo(20, -58);
  ctx.lineTo(4, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f7b6a6';
  ctx.beginPath();
  ctx.moveTo(-21, -40);
  ctx.lineTo(-18, -51);
  ctx.lineTo(-10, -44);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(21, -40);
  ctx.lineTo(18, -51);
  ctx.lineTo(10, -44);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fffdf7';
  ctx.strokeStyle = '#d9c9b0';
  ctx.lineWidth = 2;
  for (const puff of [[-13, -64, 13], [0, -72, 15], [13, -64, 13]]) {
    ctx.beginPath();
    ctx.arc(puff[0], puff[1], puff[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  fillRound(-22, -57, 44, 12, 5, '#fffdf7', '#d9c9b0', 2);

  ctx.fillStyle = '#d8543f';
  roundPath(-17, -8, 34, 7, 3);
  ctx.fill();

  ctx.fillStyle = '#3a2110';
  ctx.beginPath();
  ctx.arc(-9, -24, 3.6, 0, Math.PI * 2);
  ctx.arc(9, -24, 3.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(-8, -25, 1.2, 0, Math.PI * 2);
  ctx.arc(10, -25, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f3a1a1';
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(-4, -14);
  ctx.lineTo(4, -14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -10);
  ctx.quadraticCurveTo(-8, -6, -12, -9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, -10);
  ctx.quadraticCurveTo(8, -6, 12, -9);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(90, 58, 31, 0.65)';
  ctx.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    for (let index = -1; index <= 1; index += 1) {
      ctx.beginPath();
      ctx.moveTo(side * 20, -18 + index * 4);
      ctx.lineTo(side * 38, -22 + index * 7);
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(240, 138, 52, 0.28)';
  ctx.beginPath();
  ctx.arc(-17, -14, 5, 0, Math.PI * 2);
  ctx.arc(17, -14, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (game.carried) {
    const itemY = kiko.y - 104 + bob;
    ctx.fillStyle = 'rgba(255, 253, 247, 0.78)';
    ctx.beginPath();
    ctx.arc(kiko.x, itemY, 24, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(game.carried, kiko.x, itemY, 36);
  }
}

// ---------------------------------------------------------------------------
// Petunjuk, pesan, dan panel layar
// ---------------------------------------------------------------------------

function distanceToServe() {
  const serve = STATIONS.find((station) => station.kind === 'serve');
  return distanceToRect(game.kiko.x, game.kiko.y, serve);
}

function nearestInteraction() {
  let best = null;
  let bestDistance = Infinity;

  for (const slot of PANTRY_SLOTS) {
    const distance = Math.hypot(game.kiko.x - slot.cx, game.kiko.y - slot.cy);
    if (distance < INTERACT_RADIUS && distance < bestDistance) {
      bestDistance = distance;
      best = { type: 'ingredient', ingredient: slot.ingredient };
    }
  }

  for (const station of STATIONS) {
    if (station.kind === 'pantry' || station.kind === 'serve') continue;
    const distance = distanceToRect(game.kiko.x, game.kiko.y, station);
    if (distance < STATION_RADIUS && distance < bestDistance) {
      bestDistance = distance;
      best = {
        type: station.kind === 'bin' ? 'bin' : 'station',
        station,
      };
    }
  }

  return best;
}

function promptForInteraction() {
  if (game.screen !== SCREEN.PLAY) return null;

  if (distanceToServe() < 8) {
    return game.carried ? 'Spasi - Sajikan' : 'Jalur SERVE PASS';
  }

  const hit = nearestInteraction();
  if (!hit) return null;

  if (hit.type === 'ingredient') {
    return game.carried ? 'Tangan Kiko penuh' : `E - Ambil ${hit.ingredient.name}`;
  }

  if (hit.type === 'bin') {
    return game.carried ? 'E - Buang ke BIN' : 'BIN kosong';
  }

  const station = hit.station;
  if (game.carried) return `E - Taruh di ${station.label}`;
  if (station.item) return `E - Ambil ${ingredientName(station.item)}`;
  return `${station.label} kosong`;
}

function drawTooltip(text, x, y) {
  ctx.font = `700 16px ${FONT}`;
  const width = ctx.measureText(text).width + 30;
  const height = 34;
  const boxX = clamp(x - width / 2, 10, WIDTH - width - 10);
  const boxY = clamp(y + 52, 10, HEIGHT - height - 10);

  fillRound(boxX, boxY, width, height, 12, '#fff6e2', '#8b5e34', 2.5);
  label(text, boxX + width / 2, boxY + 23, 16, COLORS.ink, 'center', '700');
}

function drawHints(now) {
  if (game.screen === SCREEN.PLAY) {
    const prompt = promptForInteraction();
    if (prompt) drawTooltip(prompt, game.kiko.x, game.kiko.y);
  }

  label(
    'WASD / Panah: jalan  -  Klik: jalan ke titik  -  E: ambil/taruh  -  Spasi: sajikan  -  P: jeda',
    WIDTH / 2,
    713,
    14,
    '#fdf3dc',
    'center',
    '600',
  );

  if (game.messageTimer > 0 && game.message) {
    ctx.font = `700 18px ${FONT}`;
    const width = ctx.measureText(game.message).width + 44;
    const x = (WIDTH - width) / 2;
    const y = 638;
    fillRound(x, y, width, 38, 19, 'rgba(255, 246, 226, 0.96)', '#8b5e34', 2.5);
    label(game.message, WIDTH / 2, y + 25, 18, COLORS.ink, 'center', '700');
  }
}

function drawOverlayPanel(width, height, title, lines, prompt, promptPulse) {
  ctx.fillStyle = 'rgba(74, 44, 23, 0.38)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const x = (WIDTH - width) / 2;
  const y = (HEIGHT - height) / 2;
  fillRound(x + 6, y + 8, width, height, 26, 'rgba(58, 33, 16, 0.28)');
  fillRound(x, y, width, height, 26, '#fff6e2', '#8b5e34', 5);

  ctx.fillStyle = 'rgba(240, 138, 52, 0.14)';
  ctx.fillRect(x + 20, y + 20, width - 40, 6);

  label(title, WIDTH / 2, y + 88, 52, COLORS.orangeDark, 'center', '800');

  let lineY = y + 140;
  for (const line of lines) {
    label(line, WIDTH / 2, lineY, 20, COLORS.inkSoft, 'center', '600');
    lineY += 32;
  }

  const pulse = promptPulse ? 0.72 + Math.sin(performance.now() * 0.006) * 0.28 : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  label(prompt, WIDTH / 2, y + height - 42, 24, COLORS.orangeDark, 'center', '800');
  ctx.restore();
}

function drawScreens(now) {
  if (game.screen === SCREEN.TITLE) {
    drawOverlayPanel(
      780,
      430,
      'Dapur Ceria Kiko',
      [
        'Bantu Kiko si kucing koki memasak di dapur!',
        'Jalan dengan WASD atau panah, atau klik lantai.',
        'Ambil dan taruh bahan dengan E, sajikan dengan Spasi.',
        'Tekan P untuk jeda saat bermain.',
      ],
      'Tekan Spasi atau klik untuk mulai',
      true,
    );
  } else if (game.screen === SCREEN.PAUSE) {
    drawOverlayPanel(540, 270, 'Jeda', ['Dapur menunggu Kiko.'], 'Tekan P untuk lanjut', false);
  } else if (game.screen === SCREEN.END) {
    drawOverlayPanel(
      660,
      330,
      'Selesai!',
      [`Sajian diantar: ${game.served}`, 'Terima kasih sudah memasak bersama Kiko.'],
      'Tekan Spasi atau klik untuk main lagi',
      true,
    );
  }
}

// ---------------------------------------------------------------------------
// Loop dan aturan permainan
// ---------------------------------------------------------------------------

function render(now = performance.now()) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawKitchen(now);
  drawScreens(now);
}

function announce(message) {
  if (statusLine) statusLine.textContent = message;
}

function showMessage(message) {
  game.message = message;
  game.messageTimer = 2.6;
  announce(message);
}

function resetGame() {
  game.elapsed = 0;
  game.served = 0;
  game.carried = null;
  game.message = '';
  game.messageTimer = 0;
  game.kiko.x = 760;
  game.kiko.y = 360;
  game.kiko.facingLeft = false;
  game.kiko.moving = false;
  moveTarget = null;
  for (const station of STATIONS) {
    if (station.kind === 'chop' || station.kind === 'stove' || station.kind === 'plating') {
      station.item = null;
    }
  }
}

function startGame() {
  resetGame();
  game.screen = SCREEN.PLAY;
  game.message = 'Bantu Kiko memasak, ya!';
  game.messageTimer = 2.6;
  announce('Bermain. Bantu Kiko memasak.');
}

function pauseGame() {
  if (game.screen !== SCREEN.PLAY) return;
  game.screen = SCREEN.PAUSE;
  announce('Jeda. Tekan P untuk lanjut.');
}

function resumeGame() {
  if (game.screen !== SCREEN.PAUSE) return;
  game.screen = SCREEN.PLAY;
  announce('Bermain lagi.');
}

function endGame() {
  game.screen = SCREEN.END;
  announce(`Selesai. Sajian diantar ${game.served}.`);
}

function togglePause() {
  if (game.screen === SCREEN.PLAY) pauseGame();
  else if (game.screen === SCREEN.PAUSE) resumeGame();
}

function moveWithCollision(dx, dy) {
  const kiko = game.kiko;

  if (dx !== 0) {
    const nextX = kiko.x + dx;
    let blocked = false;
    for (const station of STATIONS) {
      if (station.solid && circleHitsRect(nextX, kiko.y, kiko.r, station)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) kiko.x = nextX;
  }

  if (dy !== 0) {
    const nextY = kiko.y + dy;
    let blocked = false;
    for (const station of STATIONS) {
      if (station.solid && circleHitsRect(kiko.x, nextY, kiko.r, station)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) kiko.y = nextY;
  }

  kiko.x = clamp(kiko.x, PLAY.left + kiko.r, PLAY.right - kiko.r);
  kiko.y = clamp(kiko.y, PLAY.top + kiko.r, PLAY.bottom - kiko.r);
}

function moveKiko(dt) {
  const kiko = game.kiko;
  let dx = 0;
  let dy = 0;

  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;

  kiko.moving = false;

  if (dx !== 0 || dy !== 0) {
    moveTarget = null;
    const length = Math.hypot(dx, dy);
    const stepX = (dx / length) * KIKO_SPEED * dt;
    const stepY = (dy / length) * KIKO_SPEED * dt;
    moveWithCollision(stepX, stepY);
    if (Math.abs(dx) > 0.01) kiko.facingLeft = dx < 0;
    kiko.moving = true;
    return;
  }

  if (moveTarget) {
    const toX = moveTarget.x - kiko.x;
    const toY = moveTarget.y - kiko.y;
    const distance = Math.hypot(toX, toY);

    if (distance < 4) {
      moveTarget = null;
      return;
    }

    const step = Math.min(distance, KIKO_SPEED * dt);
    moveWithCollision((toX / distance) * step, (toY / distance) * step);
    if (Math.abs(toX) > 0.5) kiko.facingLeft = toX < 0;
    kiko.moving = true;
  }
}

function interact() {
  if (game.screen !== SCREEN.PLAY) return;

  const hit = nearestInteraction();
  if (!hit) {
    showMessage('Tidak ada yang bisa diambil di sini.');
    return;
  }

  if (hit.type === 'ingredient') {
    if (game.carried) {
      showMessage('Tangan Kiko sudah penuh. Taruh dulu, ya.');
      return;
    }
    game.carried = hit.ingredient.id;
    showMessage(`Kiko mengambil ${hit.ingredient.name}.`);
    return;
  }

  if (hit.type === 'bin') {
    if (game.carried) {
      showMessage(`${ingredientName(game.carried)} dibuang ke BIN.`);
      game.carried = null;
    } else {
      showMessage('BIN masih kosong.');
    }
    return;
  }

  const station = hit.station;
  if (game.carried) {
    if (station.item) {
      showMessage(`${station.label} sudah terisi.`);
      return;
    }
    station.item = game.carried;
    showMessage(`${ingredientName(game.carried)} ditaruh di ${station.label}.`);
    game.carried = null;
    return;
  }

  if (station.item) {
    game.carried = station.item;
    station.item = null;
    showMessage(`Kiko mengambil ${ingredientName(game.carried)} dari ${station.label}.`);
    return;
  }

  showMessage(`${station.label} masih kosong.`);
}

function serve() {
  if (distanceToServe() > 8) {
    showMessage('Dekati jalur SERVE PASS untuk menyajikan.');
    return;
  }

  if (!game.carried) {
    showMessage('Kiko belum membawa sajian.');
    return;
  }

  game.served += 1;
  showMessage(`Sajian diantar! Total sajian: ${game.served}.`);
  game.carried = null;
}

function primaryAction() {
  if (game.screen === SCREEN.TITLE || game.screen === SCREEN.END) startGame();
  else if (game.screen === SCREEN.PAUSE) resumeGame();
  else if (game.screen === SCREEN.PLAY) serve();
}

function update(dt) {
  if (game.messageTimer > 0) {
    game.messageTimer = Math.max(0, game.messageTimer - dt);
  }

  if (game.screen !== SCREEN.PLAY) return;

  game.elapsed += dt;
  moveKiko(dt);
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  render(now);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Masukan
// ---------------------------------------------------------------------------

window.addEventListener('keydown', (event) => {
  if (moveKeys.has(event.code)) {
    keys.add(event.code);
    event.preventDefault();
    return;
  }

  if (event.code === 'KeyE') {
    if (!event.repeat) interact();
    event.preventDefault();
    return;
  }

  if (event.code === 'Space' || event.code === 'Enter') {
    if (!event.repeat) primaryAction();
    event.preventDefault();
    return;
  }

  if (event.code === 'KeyP') {
    if (!event.repeat) togglePause();
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

window.addEventListener('blur', () => {
  keys.clear();
});

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;

  if (game.screen === SCREEN.TITLE || game.screen === SCREEN.END) {
    startGame();
    return;
  }

  if (game.screen === SCREEN.PAUSE) {
    resumeGame();
    return;
  }

  moveTarget = { x, y };
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.screen === SCREEN.PLAY) pauseGame();
});

// ---------------------------------------------------------------------------
// Kait screenshot dan sesi berikutnya
// ---------------------------------------------------------------------------

function setScreen(name) {
  if (Object.values(SCREEN).includes(name)) game.screen = name;
}

function setKiko(x, y) {
  if (Number.isFinite(x)) game.kiko.x = clamp(x, PLAY.left + game.kiko.r, PLAY.right - game.kiko.r);
  if (Number.isFinite(y)) game.kiko.y = clamp(y, PLAY.top + game.kiko.r, PLAY.bottom - game.kiko.r);
}

function setCarried(id) {
  game.carried = id && INGREDIENT_BY_ID.has(id) ? id : null;
}

function setServed(value) {
  game.served = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function stageShot(name) {
  resetGame();

  if (name === 'play') {
    game.screen = SCREEN.PLAY;
    game.kiko.x = 760;
    game.kiko.y = 370;
    game.carried = 'keju';
    game.served = 3;
    const chop = STATIONS.find((station) => station.id === 'chop1');
    const stove = STATIONS.find((station) => station.id === 'stove1');
    if (chop) chop.item = 'tomat';
    if (stove) stove.item = 'daging';
    showMessage('Kiko siap memasak!');
  } else if (name === 'end') {
    game.screen = SCREEN.END;
    game.served = 7;
    game.kiko.x = 900;
    game.kiko.y = 400;
  } else {
    game.screen = SCREEN.TITLE;
  }

  render();
  requestAnimationFrame(() => {
    render();
    window.__shotReady = true;
  });
}

window.__kiko = {
  status: game,
  screenNames: SCREEN,
  ingredients: INGREDIENTS,
  stations: STATIONS,
  width: WIDTH,
  height: HEIGHT,
  start: startGame,
  pause: pauseGame,
  resume: resumeGame,
  end: endGame,
  reset: resetGame,
  setScreen,
  setKiko,
  setCarried,
  setServed,
  stage: stageShot,
  message: showMessage,
  render,
};

const shot = new URLSearchParams(window.location.search).get('shot');
window.__shotReady = false;

if (shot) stageShot(shot);
else requestAnimationFrame(frame);
