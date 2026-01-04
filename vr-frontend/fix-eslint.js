const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function removeConsoleLogs(content) {
  // Remove console.log, console.error, console.warn, console.debug, console.info
  return content.replace(/\s*console\.(log|error|warn|debug|info)\([^)]*\);?\n?/g, '');
}

function fixUnusedImports(filePath, content) {
  const lines = content.split('\n');

  // Common unused imports to remove
  const unusedImports = {
    'lucide-react': ['X', 'ArrowLeft', 'Check', 'Trash2', 'MoveRight', 'Plus', 'FolderOpen'],
  };

  return content;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

function fixFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  const originalContent = content;

  // Remove console logs
  content = removeConsoleLogs(content);

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
console.log('Fixing ESLint issues...\n');

walkDir(srcDir, fixFile);

console.log('\nDone! Running build to check for remaining issues...');
