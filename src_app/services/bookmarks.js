import { getItem, setItem, StorageKeys } from "./storage";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listBookmarks() {
  const raw = await getItem(StorageKeys.bookmarks, []);
  return Array.isArray(raw) ? raw : [];
}

export async function addBookmark({ suraNumber, ayahNumber, suraName, label, preview }) {
  const list = await listBookmarks();
  const item = {
    id: uid(),
    suraNumber,
    ayahNumber,
    suraName: suraName ?? "",
    label: (label ?? "").trim() || `${suraName ?? "Сура"} ${suraNumber}:${ayahNumber}`,
    preview: preview ?? "",
    createdAt: Date.now(),
  };
  const next = [item, ...list];
  await setItem(StorageKeys.bookmarks, next);
  return item;
}

export async function removeBookmark(id) {
  const list = await listBookmarks();
  const next = list.filter((b) => b.id !== id);
  await setItem(StorageKeys.bookmarks, next);
  return next;
}

export async function renameBookmark(id, label) {
  const list = await listBookmarks();
  const next = list.map((b) => (b.id === id ? { ...b, label: label.trim() || b.label } : b));
  await setItem(StorageKeys.bookmarks, next);
  return next;
}
