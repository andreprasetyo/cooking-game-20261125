// Dapur Ceria Kiko - suara kecil dari WebAudio, tanpa file eksternal.
// AudioContext baru dibuat setelah pemain menyentuh tombol/klik supaya browser
// tidak memblokirnya. Semua pemutaran dibungkus try/catch: kalau audio tidak
// tersedia atau diblokir, game tetap berjalan tanpa error.

export class GameSound {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.failed = false;
  }

  unlock() {
    if (this.failed) return false;
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          this.failed = true;
          return false;
        }
        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') {
        const resumed = this.context.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
      }
      return true;
    } catch {
      this.failed = true;
      return false;
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.master) {
      try {
        this.master.gain.value = this.muted ? 0 : 0.24;
      } catch {
        // Abaikan: audio hanya pelengkap.
      }
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  tone(frequency, duration = 0.12, options = {}) {
    if (this.muted || !this.unlock() || !this.context || !this.master) return;
    try {
      const now = this.context.currentTime + (options.delay ?? 0);
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = options.type ?? 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      if (options.slide) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, options.slide), now + duration);
      }
      const volume = options.volume ?? 0.18;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    } catch {
      // Abaikan kegagalan audio.
    }
  }

  noise(duration = 0.09, volume = 0.12, frequency = 1400) {
    if (this.muted || !this.unlock() || !this.context || !this.master) return;
    try {
      const sampleRate = this.context.sampleRate;
      const length = Math.max(1, Math.floor(sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / length);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = frequency;
      filter.Q.value = 0.9;
      const gain = this.context.createGain();
      gain.gain.value = volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start();
    } catch {
      // Abaikan kegagalan audio.
    }
  }

  pickup() {
    this.tone(520, 0.09, { type: 'triangle', volume: 0.16 });
    this.tone(780, 0.1, { type: 'triangle', volume: 0.14, delay: 0.06 });
  }

  chop() {
    this.noise(0.07, 0.16, 1900);
    this.tone(190, 0.08, { type: 'square', volume: 0.07, slide: 120 });
  }

  cooked() {
    this.tone(659, 0.12, { type: 'sine', volume: 0.17 });
    this.tone(880, 0.14, { type: 'sine', volume: 0.16, delay: 0.1 });
    this.tone(1175, 0.2, { type: 'sine', volume: 0.14, delay: 0.22 });
  }

  success() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((frequency, index) => {
      this.tone(frequency, 0.16, { type: 'triangle', volume: 0.2, delay: index * 0.09 });
    });
  }

  fail() {
    this.tone(300, 0.16, { type: 'sawtooth', volume: 0.1, slide: 180 });
    this.tone(210, 0.22, { type: 'sawtooth', volume: 0.09, delay: 0.12, slide: 140 });
  }

  combo(level = 2) {
    const base = 620 + Math.min(3, Math.max(0, level - 2)) * 80;
    this.tone(base, 0.1, { type: 'square', volume: 0.1 });
    this.tone(base * 1.25, 0.1, { type: 'square', volume: 0.1, delay: 0.08 });
    this.tone(base * 1.5, 0.16, { type: 'square', volume: 0.09, delay: 0.16 });
  }
}

export const sound = new GameSound();
