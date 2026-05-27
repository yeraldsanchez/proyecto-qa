const { execSync } = require('child_process');
const { readdirSync } = require('fs');
const { join } = require('path');

const dir = join(__dirname, '..', 'tests', 'performance');

// Descubre todos los archivos *.k6.ts automáticamente, ordenados por nombre
const files = readdirSync(dir)
  .filter(f => f.endsWith('.k6.ts'))
  .sort();

if (files.length === 0) {
  console.error('No se encontraron archivos *.k6.ts en tests/performance/');
  process.exit(1);
}

const passed = [];
const failed = [];

for (const file of files) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶  Ejecutando: ${file}`);
  console.log(`${'─'.repeat(60)}\n`);

  try {
    execSync(`k6 run ${join(dir, file)}`, { stdio: 'inherit' });
    passed.push(file);
  } catch {
    failed.push(file);
  }
}

// ── Resumen final ─────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('  RESUMEN DE RENDIMIENTO');
console.log(`${'═'.repeat(60)}`);

passed.forEach(f => console.log(`  ✅  ${f}`));
failed.forEach(f => console.log(`  ❌  ${f}`));

console.log(`${'═'.repeat(60)}\n`);

if (failed.length > 0) {
  console.error(`${failed.length} test(s) fallaron: ${failed.join(', ')}`);
  process.exit(1);
}
