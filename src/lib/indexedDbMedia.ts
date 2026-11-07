// Persistent IndexedDB Media Storage for local offline / fallback media files
// Prevents QuotaExceededError in localStorage when dealing with videos and high-res photos

const DB_NAME = "auraglass_media_db";
const STORE_NAME = "media_files";

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaFileToDb(id: string, file: Blob): Promise<string> {
  try {
    const db = await openMediaDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, file, type: file.type, timestamp: Date.now() });
      tx.oncomplete = () => {
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      };
      tx.onerror = () => {
        resolve(URL.createObjectURL(file));
      };
    });
  } catch {
    return URL.createObjectURL(file);
  }
}

export async function loadMediaFileFromDb(id: string): Promise<string | null> {
  try {
    const db = await openMediaDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result?.file) {
          resolve(URL.createObjectURL(req.result.file));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

