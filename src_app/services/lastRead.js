import { getItem, setItem, StorageKeys } from "./storage";

let cache = null;

export async function getLastRead() {
  if (cache !== undefined && cache !== null) return cache;
  const v = await getItem(StorageKeys.lastRead, null);
  cache = v;
  return v;
}

export async function saveLastRead({ suraNumber, ayahNumber, suraName, preview }) {
  const v = {
    suraNumber,
    ayahNumber,
    suraName: suraName ?? "",
    preview: preview ?? "",
    at: Date.now(),
  };
  cache = v;
  await setItem(StorageKeys.lastRead, v);
  return v;
}

export function getLastReadCached() {
  return cache;
}
