const DB_NAME = 'CivicPulseOfflineDB';
const DB_VERSION = 2;

export interface OutboxItem<T = Record<string, unknown>> {
    id?: IDBValidKey;
    type: string;
    payload: T;
    timestamp: string;
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            const target = event.target as IDBOpenDBRequest;
            console.error('IndexedDB error:', target.error);
            reject(target.error);
        };

        request.onsuccess = (event) => {
            const target = event.target as IDBOpenDBRequest;
            resolve(target.result);
        };

        request.onupgradeneeded = (event) => {
            const target = event.target as IDBOpenDBRequest;
            const db = target.result;
            if (!db.objectStoreNames.contains('outbox')) {
                const store = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }

            if (!db.objectStoreNames.contains('local_cache')) {
                db.createObjectStore('local_cache', { keyPath: 'key' });
            }
        };
    });
};

export const saveToOutbox = async <T = Record<string, unknown>>(
    type: string,
    payload: T
): Promise<OutboxItem<T>> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readwrite');
        const store = transaction.objectStore('outbox');

        const item: OutboxItem<T> = {
            type,
            payload,
            timestamp: new Date().toISOString()
        };

        const request = store.add(item);

        request.onsuccess = (event) => {
            const target = event.target as IDBRequest<IDBValidKey>;
            resolve({ ...item, id: target.result });
        };

        request.onerror = (event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
        };
    });
};

export const getOutboxItems = async <T = Record<string, unknown>>(): Promise<OutboxItem<T>[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readonly');
        const store = transaction.objectStore('outbox');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as OutboxItem<T>[]);
        request.onerror = (event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
        };
    });
};

export const removeFromOutbox = async (id: IDBValidKey): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['outbox'], 'readwrite');
        const store = transaction.objectStore('outbox');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
        };
    });
};

export const setCachedData = async <T = unknown>(key: string, data: T): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['local_cache'], 'readwrite');
        const store = transaction.objectStore('local_cache');
        const request = store.put({ key, data, timestamp: Date.now() });

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
        };
    });
};

export const getCachedData = async <T = unknown>(key: string): Promise<T | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['local_cache'], 'readonly');
        const store = transaction.objectStore('local_cache');
        const request = store.get(key);

        request.onsuccess = () => {
            const result = request.result as { data: T } | undefined;
            resolve(result ? result.data : null);
        };
        request.onerror = (event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
        };
    });
};
