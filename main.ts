// Vice Coast Cover Studio — gta6-cover-art-01 entry (Node 22, stdlib only).
//
// The app is plain static files under app/: index.html plus its ES modules,
// no library and no network request, so it opens offline in desktop Chrome.
// This program hands the entry in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes /output/dossier.json
// with buildDossier from the vendored make.fun library.
//
// Try it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing; the entry has no app to hand in.');
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: at most 4 screenshots, each at most 256 KiB, and
// app/ at most 993 files and 48 MiB in all. Refuse early, with a plain
// message, rather than handing in an entry the scorer would refuse.
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotNames.length}.`);
}
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap.`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Confirm the handover actually landed: a dossier that is missing or
// empty would grade as nothing, so fail loudly instead of exiting 0.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
if (dossierBytes < 100) {
  throw new Error(`dossier.json is only ${dossierBytes} bytes; the handover failed.`);
}
console.log(`handed in ${shotNames.length} screenshots and app/ to ${out} (dossier ${dossierBytes} bytes).`);
