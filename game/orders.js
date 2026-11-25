import { RECIPES, RECIPE_BY_ID } from './kitchen.js';

export const CUSTOMERS = Object.freeze([
  'Milo',
  'Sari',
  'Bimo',
  'Nala',
  'Tami',
  'Dodi',
  'Rara',
  'Koko',
  'Lili',
  'Bima',
]);

export const ORDER_LIMIT = 3;
export const SPAWN_INTERVAL = 14;

export class OrderBoard {
  constructor({ seed = 1, limit = ORDER_LIMIT } = {}) {
    this.seed = (Number(seed) >>> 0) || 1;
    this.limit = limit;
    this.rngState = this.seed;
    this.orders = [];
    this.events = [];
    this.nextId = 1;
    this.spawnTimer = SPAWN_INTERVAL;
  }

  random() {
    this.rngState = (this.rngState + 0x6d2b79f5) >>> 0;
    let value = this.rngState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  resetRng() {
    this.rngState = this.seed;
  }

  reset({ initial = this.limit } = {}) {
    this.orders = [];
    this.events = [];
    this.nextId = 1;
    this.spawnTimer = SPAWN_INTERVAL;
    this.resetRng();

    const recipePool = RECIPES.slice();
    for (let index = recipePool.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.random() * (index + 1));
      [recipePool[index], recipePool[swap]] = [recipePool[swap], recipePool[index]];
    }

    const count = Math.min(initial, this.limit, recipePool.length);
    for (let index = 0; index < count; index += 1) {
      this.spawnOrder(recipePool[index].id);
    }
  }

  spawnOrder(recipeId = null, options = {}) {
    const recipe = recipeId ? RECIPE_BY_ID.get(recipeId) : RECIPES[Math.floor(this.random() * RECIPES.length)];
    if (!recipe) return null;

    let customer = options.customer;
    if (!customer) {
      const active = new Set(this.orders.map((order) => order.customer));
      const available = CUSTOMERS.filter((name) => !active.has(name));
      const pool = available.length ? available : CUSTOMERS;
      customer = pool[Math.floor(this.random() * pool.length)];
    }

    const baseTime = recipe.time + Math.floor(this.random() * 9) - 2;
    const timeLeft = Number.isFinite(options.timeLeft) ? options.timeLeft : baseTime;
    const order = {
      id: this.nextId,
      customer,
      recipeId: recipe.id,
      recipeName: recipe.name,
      price: recipe.price,
      ingredients: recipe.ingredients.slice(),
      totalTime: timeLeft,
      timeLeft,
      checked: new Set(),
    };

    this.nextId += 1;
    this.orders.push(order);
    return order;
  }

  stage(recipeIds, times = [], totals = []) {
    this.orders = [];
    this.events = [];
    this.nextId = 1;
    this.spawnTimer = SPAWN_INTERVAL;
    recipeIds.forEach((recipeId, index) => {
      const order = this.spawnOrder(recipeId, { timeLeft: times[index] });
      if (order && Number.isFinite(totals[index])) order.totalTime = totals[index];
    });
  }

  update(dt, kitchen) {
    this.events = [];

    for (let index = this.orders.length - 1; index >= 0; index -= 1) {
      const order = this.orders[index];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        this.orders.splice(index, 1);
        this.events.push({ type: 'expired', order });
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.orders.length < this.limit) {
        this.spawnOrder();
        this.spawnTimer = SPAWN_INTERVAL;
      } else {
        this.spawnTimer = 1.5;
      }
    }

    const ready = new Set();
    if (kitchen) {
      if (Array.isArray(kitchen.plate)) {
        for (const item of kitchen.plate) ready.add(item.id);
      }
      const carried = kitchen.carried;
      if (carried && carried.kind === 'dish') {
        for (const item of carried.ingredients) ready.add(item.id);
      }
    }

    for (const order of this.orders) {
      order.checked = new Set(order.ingredients.filter((id) => ready.has(id)));
    }
  }

  serve(recipeId) {
    const index = this.orders.findIndex((order) => order.recipeId === recipeId);
    if (index === -1) return null;
    return this.orders.splice(index, 1)[0];
  }

  next() {
    return this.orders[0] ?? null;
  }

  drainEvents() {
    const drained = this.events;
    this.events = [];
    return drained;
  }
}
