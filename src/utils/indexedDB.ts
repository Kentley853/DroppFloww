// Simple, robust promise-based wrapper around browser IndexedDB API for file storage
const DB_NAME = 'DrawingScannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'drawing_blobs';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message || 'Unknown error'}`));
    };
  });
}

export async function saveBlobToIndexedDB(fileId: string, blob: Blob): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, fileId);

    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(new Error(`Failed to store blob: ${event.target.error?.message}`));
  });
}

export async function getBlobFromIndexedDB(fileId: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(fileId);

    request.onsuccess = (event: any) => {
      resolve(event.target.result || null);
    };
    request.onerror = (event: any) => {
      reject(new Error(`Failed to retrieve blob: ${event.target.error?.message}`));
    };
  });
}

export async function deleteBlobFromIndexedDB(fileId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(fileId);

    request.onsuccess = () => resolve();
    request.onerror = (event: any) => reject(new Error(`Failed to delete blob: ${event.target.error?.message}`));
  });
}

export async function resolveDrawingBlob(targetFile: any): Promise<Blob> {
  const candidate =
    targetFile?.file ??
    targetFile?.blob ??
    targetFile?.rawFile ??
    targetFile;

  if (candidate instanceof Blob) {
    return candidate;
  }

  // Check different possible properties for file ID or file Hash
  const idToTry = targetFile?.fileId || targetFile?.id || targetFile?.fingerprint?.fileHash;
  if (idToTry) {
    try {
      const storedBlob = await getBlobFromIndexedDB(idToTry);
      if (storedBlob instanceof Blob) {
        return storedBlob;
      }
    } catch (e) {
      console.warn("IndexedDB error retrieving key:", idToTry, e);
    }
    
    // Also try checking by fingerprint fileHash if distinct
    if (targetFile?.fingerprint?.fileHash && targetFile.fingerprint.fileHash !== idToTry) {
      try {
        const storedBlobByHash = await getBlobFromIndexedDB(targetFile.fingerprint.fileHash);
        if (storedBlobByHash instanceof Blob) {
          return storedBlobByHash;
        }
      } catch (e) {
        console.warn("IndexedDB error retrieving hash:", targetFile.fingerprint.fileHash, e);
      }
    }
  }

  throw new Error(
    "Drawing file data is unavailable. Please re-upload the drawing before analysis."
  );
}

