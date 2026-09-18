const DB_NAME = 'CivicPulseOfflineDB';
const DB_VERSION = 2; // Bumped version for new cache stores

export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Store for pending outbox items (complaints, chat messages, etc.)
            if (!db.objectStoreNames.contains('outbox')) {
                const store = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            // Key-value store for Local-First data caching
            if (!db.objectStoreNames.contains('local_cache')) {
                db.createObjectStore('local_cache', { keyPath: 'key' });
            }
        };
    });
};

export const saveToOutbox = async (type, payload) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readwrite');
        const store = transaction.objectStore('outbox');
        
        const item = {
            type,         // e.g. 'complaint', 'chat'
            payload,      // the data to send to the server
            timestamp: new Date().toISOString()
        };
        
        const request = store.add(item);
        
        request.onsuccess = (event) => {
            resolve({ ...item, id: event.target.result });
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
};

export const getOutboxItems = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readonly');
        const store = transaction.objectStore('outbox');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

export const removeFromOutbox = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readwrite');
        const store = transaction.objectStore('outbox');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

// Local-First Caching Helpers
export const setCachedData = async (key, data) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['local_cache'], 'readwrite');
        const store = transaction.objectStore('local_cache');
        const request = store.put({ key, data, timestamp: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

export const getCachedData = async (key) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['local_cache'], 'readonly');
        const store = transaction.objectStore('local_cache');
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = (event) => reject(event.target.error);
    });
};
