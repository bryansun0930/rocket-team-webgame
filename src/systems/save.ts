import type { Campaign } from '../types/campaign';
import { validateSave } from './campaign';
const DB_NAME = 'rocket-team-save';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('存档数据库被其他页面占用'));
  });
}
export async function readSave(): Promise<Campaign | null> {
  await pending.catch(() => {});
  const db = await database();
  try {
    return await new Promise((resolve,reject) => {
      const tx = db.transaction('saves','readonly');
      const request = tx.objectStore('saves').get('main');
      request.onsuccess = () => { try { resolve(request.result ? validateSave(request.result) : null); } catch(e) { reject(e); } };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
let pending: Promise<void> = Promise.resolve();
export function writeSave(save: Campaign): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(save)) as Campaign;
  pending = pending.catch(() => {}).then(async () => {
    const db = await database();
    try {
      await new Promise<void>((resolve,reject) => {
        const tx = db.transaction('saves','readwrite');
        tx.objectStore('saves').put(snapshot, 'main');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  return pending;
}
