// Generates PNG app icons using Canvas API (via node-canvas if available,
// otherwise writes SVG files that can be converted manually)
// Run: node scripts/generate-icons.mjs

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background: dark green
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Eagle emoji rendered as text
  ctx.font = `${size * 0.6}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🦅', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

try {
  writeFileSync('public/icons/icon-192.png', generateIcon(192));
  writeFileSync('public/icons/icon-512.png', generateIcon(512));
  console.log('Icons generated successfully!');
} catch (e) {
  console.error('canvas package not available:', e.message);
  console.log('Falling back to SVG icons (rename to .png or use a converter).');
}
