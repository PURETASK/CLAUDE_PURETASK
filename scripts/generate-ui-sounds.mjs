#!/usr/bin/env node
/**
 * Generates short UI WAV files for Howler (run: pnpm sounds:generate).
 * Replace with mastered assets later — see docs/sound-system-guide.md.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/sounds/ui');

const SAMPLE_RATE = 44100;

const writeWav = (filePath, samples) => {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }

  writeFileSync(filePath, buffer);
};

const tone = (freq, durationSec, volume = 0.35, type = 'sine') => {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8);
    let v = 0;
    if (type === 'sine') v = Math.sin(2 * Math.PI * freq * t);
    if (type === 'noise') v = Math.random() * 2 - 1;
    out[i] = v * volume * env;
  }
  return out;
};

const mix = (...parts) => {
  const len = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(len);
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i];
  }
  return Array.from(out);
};

mkdirSync(outDir, { recursive: true });

const sounds = {
  pop: mix(tone(520, 0.05, 0.25), tone(880, 0.08, 0.15), tone(0, 0.04, 0.2, 'noise')),
  tab: tone(640, 0.06, 0.3),
  click: tone(420, 0.04, 0.25),
  modal_open: mix(tone(380, 0.1, 0.2), tone(760, 0.14, 0.15)),
  modal_close: tone(300, 0.12, 0.2),
  nav_forward: mix(tone(400, 0.08, 0.15), tone(600, 0.12, 0.2)),
  success: mix(tone(523, 0.08, 0.2), tone(784, 0.12, 0.18)),
};

for (const [name, samples] of Object.entries(sounds)) {
  writeWav(resolve(outDir, `${name}.wav`), samples);
  console.log(`Wrote ${name}.wav`);
}

console.log(`\nGenerated ${Object.keys(sounds).length} sounds in public/sounds/ui/`);
