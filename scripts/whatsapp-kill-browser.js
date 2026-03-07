/**
 * Cierra procesos de Chrome/Chromium huérfanos del WhatsApp Bridge.
 * Útil cuando aparece "The browser is already running".
 *
 * Uso: node scripts/whatsapp-kill-browser.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Agentia] Cerrando navegador huérfano del WhatsApp Bridge...');
console.log('');

try {
  if (process.platform === 'win32') {
    const ps1 = path.join(__dirname, '..', '.whatsapp-kill.ps1');
    fs.writeFileSync(ps1, `
$procs = Get-CimInstance Win32_Process -Filter "name='chrome.exe'" -ErrorAction SilentlyContinue
$killed = 0
foreach ($p in $procs) {
  if ($p.CommandLine -and ($p.CommandLine -like '*wwebjs*')) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    $killed++
  }
}
Write-Host "Procesos cerrados: $killed"
`.trim());
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}"`, { stdio: 'inherit' });
    try { fs.unlinkSync(ps1); } catch (_) {}
  } else {
    execSync('pkill -f "wwebjs_auth" 2>/dev/null || true', { stdio: 'inherit' });
  }
  console.log('');
  console.log('[Agentia] Ejecuta "npm run whatsapp" de nuevo.');
} catch (err) {
  console.log('  Prueba manualmente:');
  console.log('  1. Ctrl+Shift+Esc → Administrador de tareas');
  console.log('  2. Busca "Chrome" o "Chromium"');
  console.log('  3. Finaliza esos procesos (o cierra Chrome por completo)');
  console.log('  4. npm run whatsapp');
}
