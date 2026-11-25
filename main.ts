import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Resolve the repository root from this module's own location, then decide where
// the packaged result should land.
const projectDir = dirname(fileURLToPath(import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Build the output tree: the game is mandatory, the screenshot collection optional.
mkdirSync(destination, { recursive: true });

const gameDir = join(projectDir, 'game');
cpSync(gameDir, join(destination, 'game'), { recursive: true });

const screenshotDir = join(projectDir, 'screenshots');
const copiedScreenshots = join(destination, 'screenshots');
mkdirSync(copiedScreenshots, { recursive: true });
if (existsSync(screenshotDir)) {
  cpSync(screenshotDir, copiedScreenshots, { recursive: true });
}

// Thresholds mirror the grader's gate so an over-budget entry is rejected here first.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const summary = buildDossier(destination, dossierLimits);
writeFileSync(join(destination, 'dossier.json'), summary);
