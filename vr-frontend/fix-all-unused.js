const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix catch (error) -> catch
  const errorCatchPattern = /} catch \((error|err)\) \{/g;
  if (errorCatchPattern.test(content)) {
    content = content.replace(errorCatchPattern, '} catch {');
    modified = true;
  }

  // Fix unused X imports from lucide-react
  if (content.includes('from "lucide-react"') || content.includes("from 'lucide-react'")) {
    // Remove X from imports
    content = content.replace(/import \{ ([^}]*), X([^}]*)\} from ["']lucide-react["']/g, 'import { $1$2} from "lucide-react"');
    content = content.replace(/import \{ X, ([^}]*)\} from ["']lucide-react["']/g, 'import { $1} from "lucide-react"');
    content = content.replace(/import \{ X \} from ["']lucide-react["']/g, '');

    // Remove Trash2, MoveRight from ClothingGallery
    content = content.replace(/import \{ Trash2, Heart, MoveRight \} from ['"]lucide-react['"]/g, "import { Heart } from 'lucide-react'");

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
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

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

console.log('Fixing all unused variables...\n');

walkDir(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(__dirname, filePath)}`);
  }
});

console.log(`\n✓ Fixed ${fixedCount} files`);
console.log('\nNow fixing specific files with unique issues...');

// Fix specific unused variables in specific files
const specificFixes = [
  {
    file: 'src/app/components/ClothingGallery.tsx',
    fixes: [
      {
        find: 'const outfitsUsingSingleItem = itemsInUse.filter(',
        replace: '// const outfitsUsingSingleItem = itemsInUse.filter(',
      }
    ]
  },
  {
    file: 'src/app/components/occasions/ChangeOccasionImageModal.tsx',
    fixes: [
      {
        find: 'const [editingRect, setEditingRect] = useState<string | null>(null);',
        replace: 'const [, setEditingRect] = useState<string | null>(null);',
      },
      {
        find: 'const [uploadingRect, setUploadingRect] = useState(false);',
        replace: 'const [, setUploadingRect] = useState(false);',
      }
    ]
  },
  {
    file: 'src/app/components/dashboard/ChangeFolderImageModal.tsx',
    fixes: [
      {
        find: 'const [uploadingRect, setUploadingRect] = useState(false);',
        replace: 'const [, setUploadingRect] = useState(false);',
      },
      {
        find: 'const [uploadPreview, setUploadPreview] = useState<string | null>(null);',
        replace: 'const [, setUploadPreview] = useState<string | null>(null);',
      }
    ]
  },
  {
    file: 'src/app/components/occasions/AddOutfitsToOccasionModal.tsx',
    fixes: [
      {
        find: 'const isInOccasion = occasionOutfits?.some(',
        replace: '// const isInOccasion = occasionOutfits?.some(',
      }
    ]
  },
  {
    file: 'src/app/components/CustomCheckbox.tsx',
    fixes: [
      {
        find: 'onCheckedChange,',
        replace: '// onCheckedChange,',
      }
    ]
  },
  {
    file: 'src/app/components/FilterSection.tsx',
    fixes: [
      {
        find: 'clothingItems,',
        replace: '// clothingItems,',
      },
      {
        find: 'filterAttributes,',
        replace: '// filterAttributes,',
      },
      {
        find: 'uniqueAttributeValues,',
        replace: '// uniqueAttributeValues,',
      },
      {
        find: 'setPriceRange,',
        replace: '// setPriceRange,',
      }
    ]
  },
  {
    file: 'src/app/components/dashboard/FoldersView.tsx',
    fixes: [
      {
        find: ', viewMode',
        replace: '//, viewMode',
      }
    ]
  }
];

specificFixes.forEach(({ file, fixes }) => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(({ find, replace }) => {
      if (content.includes(find)) {
        content = content.replace(find, replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${file}`);
    }
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

console.log('\nDone!');
