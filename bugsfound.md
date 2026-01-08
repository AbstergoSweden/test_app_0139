# Bugs Found

- ~~Enhanced images never persist:~~ **FIXED** - `App.tsx:136` now uses `addToGallery()` instead of `updateGalleryItem()`.

- ~~Persistence will stall/crash after a few assets:~~ **MITIGATED** - Added 2s debounce and quota error handling. Full fix (IndexedDB + Web Worker) deferred.

- Veo video polling: **Investigated** - SDK docs confirm `{operation: operation}` is correct. Original code matches documentation, no issue found.

## Remaining Concerns (Low Priority)

- **Full localStorage quota still possible:** Current fix handles the error gracefully but doesn't prevent it. Future work: move base64 blobs to IndexedDB.

- **Heavy crypto on main thread:** Debouncing helps but 310k PBKDF2 iterations still blocks UI during save. Future work: offload to Web Worker.
