const fs = require('fs');

// Read all lines from build output to get unused vars
const filesToFix = [
  // Unused error variables - replace with _
  { file: 'src/app/components/AddToFolderModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/dashboard/ChangeFolderImageModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/UploadForm.tsx', find: '} catch (error) {', replace: '} catch {', all: true },
  { file: 'src/app/components/occasions/RenameOccasionModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/dashboard/RenameFolderModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/CreateOccasionModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/occasions/CreateOccasionModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/dashboard/CreateFolderModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/occasions/ChangeOccasionImageModal.tsx', find: '} catch (error) {', replace: '} catch {', all: true },
  { file: 'src/app/components/dashboard/SelectFromFolderModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/occasions/SelectFromOccasionModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/occasions/AddOutfitsToOccasionModal.tsx', find: '} catch (error) {', replace: '} catch {' },
  { file: 'src/app/components/ClothingGallery.tsx', find: '} catch (err) {', replace: '} catch {', all: true },
  { file: 'src/app/components/CreateOutfitModal.tsx', find: '} catch (error) {', replace: '} catch {' },

  // Unused imports
  { file: 'src/app/components/AddToFolderModal.tsx', find: "import { X, Folder, Loader2 } from \"lucide-react\"", replace: 'import { Folder, Loader2 } from "lucide-react"' },
  { file: 'src/app/components/ClothingDetailModal.tsx', find: "import { ChevronLeft, ChevronRight, Heart, Link, X } from \"lucide-react\"", replace: 'import { ChevronLeft, ChevronRight, Heart, Link } from "lucide-react"' },
  { file: 'src/app/components/ClothingGallery.tsx', find: "import { Trash2, Heart, MoveRight } from 'lucide-react'", replace: "import { Heart } from 'lucide-react'" },
  { file: 'src/app/components/ClothingModal.tsx', find: "import { Heart, ChevronLeft, ChevronRight, X } from \"lucide-react\"", replace: 'import { Heart, ChevronLeft, ChevronRight } from "lucide-react"' },
  { file: 'src/app/components/dashboard/CreateFolderModal.tsx', find: "import { X, Loader2 } from \"lucide-react\"", replace: 'import { Loader2 } from "lucide-react"' },
  { file: 'src/app/components/dashboard/RenameFolderModal.tsx', find: "import { X, Loader2 } from \"lucide-react\"", replace: 'import { Loader2 } from "lucide-react"' },
  { file: 'src/app/components/occasions/CreateOccasionModal.tsx', find: "import { X, Loader2 } from \"lucide-react\"", replace: 'import { Loader2 } from "lucide-react"' },
  { file: 'src/app/components/CreateOccasionModal.tsx', find: "import { X, Loader2 } from \"lucide-react\"", replace: 'import { Loader2 } from "lucide-react"' },

  // Remove useEffect from ClothingDetailModal if not used
  { file: 'src/app/components/ClothingDetailModal.tsx', find: "import { useState, useEffect } from \"react\"", replace: 'import { useState } from "react"' },
];

filesToFix.forEach(({ file, find, replace, all }) => {
  const filePath = `${__dirname}/${file}`;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (all) {
      content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
    } else {
      content = content.replace(find, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${file}`);
  } catch (e) {
    console.log(`✗ Could not fix ${file}: ${e.message}`);
  }
});

console.log('\nDone!');
