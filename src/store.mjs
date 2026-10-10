const DB_NAME = 'dive-ledger';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('equipment')) db.createObjectStore('equipment', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('services')) {
        const s = db.createObjectStore('services', { keyPath: 'id' });
        s.createIndex('equipmentId', 'equipmentId', { unique: false });
      }
      if (!db.objectStoreNames.contains('checklist')) db.createObjectStore('checklist', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const out = fn(s);
        t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
        t.onerror = () => { db.close(); reject(t.error); };
      }),
  );
}

export const store = {
  listEquipment: () => tx('equipment', 'readonly', (s) => s.getAll()),
  putEquipment: (item) => tx('equipment', 'readwrite', (s) => s.put(item)),
  deleteEquipment: (id) => tx('equipment', 'readwrite', (s) => s.delete(id)),
  listServices: () => tx('services', 'readonly', (s) => s.getAll()),
  servicesFor: (equipmentId) =>
    openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const t = db.transaction('services', 'readonly');
          const idx = t.objectStore('services').index('equipmentId');
          const req = idx.getAll(equipmentId);
          req.onsuccess = () => { db.close(); resolve(req.result); };
          req.onerror = () => { db.close(); reject(req.error); };
        }),
    ),
  putService: (entry) => tx('services', 'readwrite', (s) => s.put(entry)),
  listChecklist: () => tx('checklist', 'readonly', (s) => s.getAll()),
  putCheck: (item) => tx('checklist', 'readwrite', (s) => s.put(item)),
  clearChecklist: () => tx('checklist', 'readwrite', (s) => s.clear()),
  getMeta: (key) => tx('meta', 'readonly', (s) => s.get(key)).then((r) => r?.value),
  setMeta: (key, value) => tx('meta', 'readwrite', (s) => s.put({ key, value })),
  replaceAll: (data) =>
    openDb().then(
      (db) =>
        new Promise((resolve, reject) => {
          const t = db.transaction(['equipment', 'services', 'checklist'], 'readwrite');
          t.objectStore('equipment').clear();
          t.objectStore('services').clear();
          t.objectStore('checklist').clear();
          for (const e of data.equipment) t.objectStore('equipment').put(e);
          for (const e of data.serviceEntries) t.objectStore('services').put(e);
          for (const e of data.checklist) t.objectStore('checklist').put(e);
          t.oncomplete = () => { db.close(); resolve(true); };
          t.onerror = () => { db.close(); reject(t.error); };
        }),
    ),
};

export function newId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
