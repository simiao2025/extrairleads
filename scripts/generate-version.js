const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../public/version.json');
// Gera uma versão única baseada no timestamp atual
const newVersion = Date.now().toString();

fs.writeFileSync(versionFilePath, JSON.stringify({ version: newVersion }, null, 2));
console.log(`[Build] version.json atualizado para a versão: ${newVersion}`);
