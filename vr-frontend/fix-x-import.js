const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/(webapp)/dashboard/page.tsx',
  'src/app/components/ClothingItemSelectModal.tsx',
  'src/app/components/CreateOccasionModal.tsx',
  'src/app/components/CreateOutfitModal.tsx',
  'src/app/components/dashboard/AddItemsToFolderModal.tsx',
  'src/app/components/OccasionOutfits.tsx',
  'src/app/components/UploadForm.tsx',
  'src/components/ui/dialog.tsx',
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if X is used in JSX
    if (content.includes('<X ') && content.includes('from "lucide-react"')) {
      // Add X back to imports
      content = content.replace(
        /import \{ ([^}]+)\} from ["']lucide-react["']/,
        (match, imports) => {
          if (!imports.includes('X')) {
            return `import { X, ${imports}} from "lucide-react"`;
          }
          return match;
        }
      );

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Re-added X import to: ${file}`);
    }
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

console.log('\nDone!');
