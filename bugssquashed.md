# Bugs Squashed

- **Enhanced images now persist:** Fixed `App.tsx:136` to use `addToGallery()` instead of `updateGalleryItem()`, so enhanced items are added as new gallery entries rather than attempting to update non-existent IDs.

- **Persistence no longer freezes/crashes immediately:** Added debounced saves (2s delay) in `App.tsx:29-52` and quota error handling in `services/secureStorage.ts:97-108` that throws a user-friendly error message when localStorage is full.

- **Pre-existing lint errors fixed:** Removed 14 unused imports/variables across `ControlPanel.tsx`, `GalleryItem.tsx`, `ImageGenScreen.tsx`, `ImageViewer.tsx`, `ChatScreen.tsx`, `firebaseService.ts`, `geminiService.ts`, and `crypto.ts`.
