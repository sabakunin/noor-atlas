import ru from "./ru";

const dictionaries = { ru };
const fallbackLang = "ru";

export function t(path, ...rest) {
  let lang = fallbackLang;
  let args = rest;
  if (rest.length > 0) {
    const first = rest[0];
    if (typeof first === "string" && dictionaries[first]) {
      lang = first;
      args = rest.slice(1);
    } else if (first === undefined || first === null) {
      args = rest.slice(1);
    }
  }
  const dict = dictionaries[lang] ?? dictionaries[fallbackLang];
  const segments = path.split(".");
  let node = dict;
  for (const seg of segments) {
    if (node && typeof node === "object" && seg in node) {
      node = node[seg];
    } else {
      return path;
    }
  }
  if (typeof node === "function") return node(...args);
  return node;
}

export { ru };
