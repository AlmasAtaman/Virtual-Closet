const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(webapp)/folders/[folderId]/page.tsx',
  'src/app/components/dashboard/ChangeFolderImageModal.tsx',
  'src/app/components/dashboard/SelectFromFolderModal.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if X is used in JSX but not imported
    if (content.includes('<X ') || content.includes('<X>')) {
      // Check if lucide-react import exists
      if (content.includes('from "lucide-react"') || content.includes("from 'lucide-react'")) {
        // Add X to existing import
        content = content.replace(
          /import \{ ([^}]+)\} from ["']lucide-react["']/,
          (match, imports) => {
            if (!imports.includes('X')) {
              return `import { X, ${imports}} from "lucide-react"`;
            }
            return match;
          }
        );
      } else {
        // Add new import
        const importInsertPoint = content.indexOf('import');
        if (importInsertPoint >= 0) {
          content = content.slice(0, importInsertPoint) +
            'import { X } from "lucide-react"\n' +
            content.slice(importInsertPoint);
        }
      }

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed X import in: ${file}`);
    }
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

console.log('\nDone!');
