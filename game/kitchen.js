export const INGREDIENTS = Object.freeze([
  { id: 'roti', name: 'Roti', needsChop: false, needsCook: false },
  { id: 'telur', name: 'Telur', needsChop: false, needsCook: true },
  { id: 'tomat', name: 'Tomat', needsChop: true, needsCook: false },
  { id: 'keju', name: 'Keju', needsChop: false, needsCook: false },
  { id: 'selada', name: 'Selada', needsChop: true, needsCook: false },
  { id: 'daging', name: 'Daging', needsChop: true, needsCook: true },
]);

export const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));

export const RECIPES = Object.freeze([
  {
    id: 'sandwich',
    name: 'Sandwich Keju',
    price: 20,
    time: 58,
    ingredients: Object.freeze(['roti', 'keju', 'selada']),
  },
  {
    id: 'omelet',
    name: 'Omelet Tomat',
    price: 24,
    time: 62,
    ingredients: Object.freeze(['telur', 'tomat', 'keju']),
  },
  {
    id: 'burger',
    name: 'Burger Ceria',
    price: 30,
    time: 72,
    ingredients: Object.freeze(['roti', 'daging', 'selada', 'tomat']),
  },
]);

export const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export const CHOP_TIME = 1.7;
export const COOK_TIME = 2.4;
export const PLATE_CAPACITY = 4;

export function makeItem(id) {
  return { kind: 'ingredient', id, chopped: false, cooked: false };
}

export function ingredientName(id) {
  const ingredient = INGREDIENT_BY_ID.get(id);
  return ingredient ? ingredient.name : id;
}

export function itemReady(item) {
  if (!item || item.kind === 'dish') return false;
  const ingredient = INGREDIENT_BY_ID.get(item.id);
  if (!ingredient) return false;
  if (ingredient.needsChop && !item.chopped) return false;
  if (ingredient.needsCook && !item.cooked) return false;
  return true;
}

function itemText(item) {
  const ingredient = INGREDIENT_BY_ID.get(item.id);
  if (!ingredient) return item.id;
  if (ingredient.needsCook && item.cooked) return `${ingredient.name} matang`;
  if (ingredient.needsChop && item.chopped) return `${ingredient.name} potong`;
  return ingredient.name;
}

export class Kitchen {
  constructor(stations) {
    this.stations = stations;
    this.carried = null;
    this.plate = [];
    this.events = [];
    this.reset();
  }

  reset() {
    this.carried = null;
    this.plate = [];
    this.events.length = 0;
    for (const station of this.stations) {
      if (station.kind === 'chop' || station.kind === 'stove' || station.kind === 'plating') {
        station.item = null;
        station.progress = 0;
        station.working = false;
        station.duration = station.kind === 'chop' ? CHOP_TIME : COOK_TIME;
      }
    }
  }

  ok(message, extra = {}) {
    return { ok: true, message, ...extra };
  }

  fail(message) {
    return { ok: false, message };
  }

  emit(message, type = 'info') {
    this.events.push({ message, type });
  }

  drainEvents() {
    const drained = this.events.slice();
    this.events.length = 0;
    return drained;
  }

  setCarried(value) {
    if (!value) {
      this.carried = null;
      return;
    }
    if (typeof value === 'string') {
      this.carried = INGREDIENT_BY_ID.has(value) ? makeItem(value) : null;
      return;
    }
    this.carried = value;
  }

  takeIngredient(id) {
    if (!INGREDIENT_BY_ID.has(id)) return this.fail('Bahan itu tidak ada di pantry.');
    if (this.carried) return this.fail('Tangan Kiko sudah penuh. Taruh dulu, ya.');
    this.carried = makeItem(id);
    return this.ok(`Kiko mengambil ${ingredientName(id)}.`);
  }

  placeAtChop(station) {
    if (!this.carried) return this.fail('Kiko belum membawa bahan.');
    if (this.carried.kind === 'dish') return this.fail('Simpan piring dulu sebelum memotong.');
    if (station.item) return this.fail(`${station.label} sedang dipakai.`);
    const ingredient = INGREDIENT_BY_ID.get(this.carried.id);
    if (!ingredient.needsChop) return this.fail(`${ingredient.name} tidak perlu dipotong.`);
    if (this.carried.chopped) return this.fail(`${ingredient.name} sudah dipotong.`);

    station.item = this.carried;
    station.progress = 0;
    station.working = true;
    station.duration = CHOP_TIME;
    this.carried = null;
    return this.ok(`Kiko mulai memotong ${ingredient.name}.`);
  }

  placeAtStove(station) {
    if (!this.carried) return this.fail('Kiko belum membawa bahan.');
    if (this.carried.kind === 'dish') return this.fail('Simpan piring dulu sebelum memasak.');
    if (station.item) return this.fail(`${station.label} sedang dipakai.`);
    const ingredient = INGREDIENT_BY_ID.get(this.carried.id);
    if (!ingredient.needsCook) return this.fail(`${ingredient.name} tidak perlu dimasak.`);
    if (this.carried.cooked) return this.fail(`${ingredient.name} sudah matang.`);
    if (ingredient.needsChop && !this.carried.chopped) {
      return this.fail(`Potong ${ingredient.name} di CHOP terlebih dahulu.`);
    }

    station.item = this.carried;
    station.progress = 0;
    station.working = true;
    station.duration = COOK_TIME;
    this.carried = null;
    return this.ok(`Kiko mulai memasak ${ingredient.name}.`);
  }

  takeFromStation(station) {
    if (!station.item) return this.fail(`${station.label} masih kosong.`);
    if (station.working) {
      const action = station.kind === 'chop' ? 'memotong' : 'memasak';
      return this.fail(`Masih ${action}. Tunggu sampai selesai, ya.`);
    }
    if (this.carried) return this.fail('Tangan Kiko sudah penuh. Taruh dulu, ya.');

    const item = station.item;
    station.item = null;
    station.progress = 0;
    this.carried = item;
    return this.ok(`Kiko mengambil ${itemText(item)} dari ${station.label}.`);
  }

  canAddToPlate(id) {
    const ids = this.plate.map((item) => item.id);
    if (ids.includes(id)) return false;
    const next = [...ids, id];
    return RECIPES.some((recipe) => next.every((ingredientId) => recipe.ingredients.includes(ingredientId)));
  }

  addToPlate() {
    if (!this.carried) return this.fail('Kiko belum membawa bahan.');
    if (this.carried.kind === 'dish') return this.fail('Piring sudah lengkap. Antar ke SERVE PASS.');
    if (this.plate.length >= PLATE_CAPACITY) return this.fail('Piring sudah penuh. Kosongkan dulu di BIN.');
    if (!itemReady(this.carried)) {
      const ingredient = INGREDIENT_BY_ID.get(this.carried.id);
      const place = ingredient.needsChop && !this.carried.chopped ? 'CHOP' : 'STOVE';
      return this.fail(`${ingredient.name} belum siap. Selesaikan di ${place}.`);
    }
    if (!this.canAddToPlate(this.carried.id)) {
      return this.fail(`${ingredientName(this.carried.id)} tidak cocok dengan bahan di piring.`);
    }

    const item = this.carried;
    this.plate.push(item);
    this.carried = null;
    const status = this.plateStatus();
    if (status.complete) {
      return this.ok(`${status.complete.name} lengkap! Tekan E untuk mengambil piring.`);
    }
    if (status.candidate) {
      return this.ok(
        `${ingredientName(item.id)} ditata (${this.plate.length}/${status.candidate.ingredients.length}) untuk ${status.candidate.name}.`,
      );
    }
    return this.ok(`${ingredientName(item.id)} ditata di piring.`);
  }

  plateRecipe() {
    if (!this.plate.length) return null;
    const ids = this.plate.map((item) => item.id).slice().sort();
    for (const recipe of RECIPES) {
      if (recipe.ingredients.length !== ids.length) continue;
      const recipeIds = recipe.ingredients.slice().sort();
      if (recipeIds.every((id, index) => id === ids[index])) return recipe;
    }
    return null;
  }

  plateCandidate() {
    if (!this.plate.length) return null;
    const ids = new Set(this.plate.map((item) => item.id));
    const candidates = RECIPES.filter((recipe) => {
      if (ids.size > recipe.ingredients.length) return false;
      return [...ids].every((id) => recipe.ingredients.includes(id));
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.ingredients.length - b.ingredients.length);
    return candidates[0];
  }

  plateStatus() {
    const candidate = this.plateCandidate();
    const complete = this.plateRecipe();
    return {
      items: this.plate,
      count: this.plate.length,
      candidate,
      complete,
      total: candidate ? candidate.ingredients.length : this.plate.length,
      missing: candidate
        ? candidate.ingredients.filter((id) => !this.plate.some((item) => item.id === id))
        : [],
    };
  }

  pickupPlate() {
    if (this.carried) return this.fail('Tangan Kiko sudah penuh.');
    if (!this.plate.length) return this.fail('Piring masih kosong.');
    const recipe = this.plateRecipe();
    if (!recipe) {
      const status = this.plateStatus();
      if (status.candidate) {
        return this.fail(
          `Rakitan belum lengkap (${this.plate.length}/${status.candidate.ingredients.length}). Tambah ${status.missing
            .map((id) => ingredientName(id))
            .join(', ')}.`,
        );
      }
      return this.fail('Rakitan belum cocok dengan resep mana pun.');
    }

    this.carried = {
      kind: 'dish',
      recipeId: recipe.id,
      name: recipe.name,
      price: recipe.price,
      ingredients: this.plate.map((item) => ({ ...item })),
    };
    this.plate = [];
    return this.ok(`Piring ${recipe.name} siap diantar ke SERVE PASS!`);
  }

  discardCarried() {
    if (!this.carried) return this.fail('Tidak ada yang dibawa.');
    const what = this.carried.kind === 'dish' ? `piring ${this.carried.name}` : ingredientName(this.carried.id);
    this.carried = null;
    return this.ok(`${what} dibuang ke BIN.`);
  }

  clearPlate() {
    if (!this.plate.length) return this.fail('Piring sudah kosong.');
    const count = this.plate.length;
    this.plate = [];
    return this.ok(`Piring dikosongkan (${count} bahan dibuang ke BIN).`);
  }

  update(dt) {
    for (const station of this.stations) {
      if ((station.kind !== 'chop' && station.kind !== 'stove') || !station.working || !station.item) continue;
      const duration = station.duration || (station.kind === 'chop' ? CHOP_TIME : COOK_TIME);
      station.progress = Math.min(1, station.progress + dt / duration);
      if (station.progress < 1) continue;

      station.working = false;
      if (station.kind === 'chop') {
        station.item.chopped = true;
        this.emit(`${ingredientName(station.item.id)} sudah dipotong.`);
      } else {
        station.item.cooked = true;
        this.emit(`${ingredientName(station.item.id)} sudah matang!`);
      }
    }
  }
}
