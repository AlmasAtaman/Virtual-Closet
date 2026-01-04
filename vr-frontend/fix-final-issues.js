const fs = require('fs');
const path = require('path');

// Files that use X and need the import
const filesNeedingX = [
  'src/app/components/OccasionCard.tsx',
  'src/app/components/occasions/AddOutfitsToOccasionModal.tsx',
  'src/app/components/occasions/ChangeOccasionImageModal.tsx',
  'src/app/components/occasions/SelectFromOccasionModal.tsx',
  'src/app/components/OutfitCard.tsx',
];

filesNeedingX.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('<X ') && content.includes('from "lucide-react"')) {
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
      console.log(`✓ Added X import to: ${file}`);
    }
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

// Fix specific unused variables
const specificFixes = {
  'src/app/components/occasions/SelectFromOccasionModal.tsx': [
    {
      find: 'import { Card, CardContent } from "@/components/ui/card";',
      replace: '// import { Card, CardContent } from "@/components/ui/card";',
    }
  ],
  'src/app/components/occasions/OutfitPreviewHorizontal.tsx': [
    {
      find: 'import Image from "next/image";',
      replace: '// import Image from "next/image";',
    }
  ],
  'src/app/components/occasions/ChangeOccasionImageModal.tsx': [
    {
      find: 'occasionName,',
      replace: '// occasionName,',
    },
    {
      find: 'currentImageLayout,',
      replace: '// currentImageLayout,',
    },
    {
      find: 'const [editingRect',
      replace: 'const [/* editingRect */',
    }
  ],
  'src/app/components/OccasionCard.tsx': [
    {
      find: 'const handleCheckboxClick = (e: React.MouseEvent) => {',
      replace: '// const handleCheckboxClick = (e: React.MouseEvent) => {',
    },
    {
      find: '    e.stopPropagation();',
      replace: '//     e.stopPropagation();',
    },
    {
      find: '    onToggleSelect?.(outfit.id);',
      replace: '//     onToggleSelect?.(outfit.id);',
    },
    {
      find: '  };',
      replace: '//   };',
    }
  ],
  'src/app/components/OutfitCard.tsx': [
    {
      find: 'const handleCheckboxClick = (e: React.MouseEvent) => {',
      replace: '// const handleCheckboxClick = (e: React.MouseEvent) => {',
    }
  ],
  'src/app/components/ClothingGallery.tsx': [
    {
      find: 'const outfitsUsingSingleItem',
      replace: '// const outfitsUsingSingleItem',
    }
  ],
  'src/app/components/dashboard/FoldersView.tsx': [
    {
      find: ', viewMode',
      replace: ', /* viewMode */',
    }
  ]
};

Object.entries(specificFixes).forEach(([file, fixes]) => {
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
      console.log(`✓ Fixed unused vars in: ${file}`);
    }
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

console.log('\nDone!');
