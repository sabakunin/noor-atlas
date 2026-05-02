export const cities = [
  { id: "makhachkala", title: "Махачкала", country: "Россия", lat: 42.9849, lon: 47.5047, tz: "Europe/Moscow" },
  { id: "grozny", title: "Грозный", country: "Россия", lat: 43.3168, lon: 45.6986, tz: "Europe/Moscow" },
  { id: "nazran", title: "Назрань", country: "Россия", lat: 43.2257, lon: 44.7642, tz: "Europe/Moscow" },
  { id: "nalchik", title: "Нальчик", country: "Россия", lat: 43.4846, lon: 43.6074, tz: "Europe/Moscow" },
  { id: "vladikavkaz", title: "Владикавказ", country: "Россия", lat: 43.0241, lon: 44.6818, tz: "Europe/Moscow" },
  { id: "cherkessk", title: "Черкесск", country: "Россия", lat: 44.2266, lon: 42.0464, tz: "Europe/Moscow" },
  { id: "maykop", title: "Майкоп", country: "Россия", lat: 44.6098, lon: 40.1006, tz: "Europe/Moscow" },
  { id: "moscow", title: "Москва", country: "Россия", lat: 55.7558, lon: 37.6173, tz: "Europe/Moscow" },
  { id: "spb", title: "Санкт-Петербург", country: "Россия", lat: 59.9311, lon: 30.3609, tz: "Europe/Moscow" },
  { id: "kazan", title: "Казань", country: "Россия", lat: 55.8304, lon: 49.0661, tz: "Europe/Moscow" },
  { id: "ufa", title: "Уфа", country: "Россия", lat: 54.7388, lon: 55.9721, tz: "Asia/Yekaterinburg" },
  { id: "ekb", title: "Екатеринбург", country: "Россия", lat: 56.8389, lon: 60.6057, tz: "Asia/Yekaterinburg" },
  { id: "novosibirsk", title: "Новосибирск", country: "Россия", lat: 55.0084, lon: 82.9357, tz: "Asia/Novosibirsk" },
  { id: "krasnodar", title: "Краснодар", country: "Россия", lat: 45.0355, lon: 38.9753, tz: "Europe/Moscow" },
  { id: "rostov", title: "Ростов-на-Дону", country: "Россия", lat: 47.2357, lon: 39.7015, tz: "Europe/Moscow" },
  { id: "stavropol", title: "Ставрополь", country: "Россия", lat: 45.0428, lon: 41.969, tz: "Europe/Moscow" },
  { id: "astana", title: "Астана", country: "Казахстан", lat: 51.1605, lon: 71.4704, tz: "Asia/Almaty" },
  { id: "almaty", title: "Алматы", country: "Казахстан", lat: 43.222, lon: 76.8512, tz: "Asia/Almaty" },
  { id: "tashkent", title: "Ташкент", country: "Узбекистан", lat: 41.2995, lon: 69.2401, tz: "Asia/Tashkent" },
  { id: "bishkek", title: "Бишкек", country: "Кыргызстан", lat: 42.8746, lon: 74.5698, tz: "Asia/Bishkek" },
  { id: "dushanbe", title: "Душанбе", country: "Таджикистан", lat: 38.5598, lon: 68.787, tz: "Asia/Dushanbe" },
  { id: "baku", title: "Баку", country: "Азербайджан", lat: 40.4093, lon: 49.8671, tz: "Asia/Baku" },
  { id: "istanbul", title: "Стамбул", country: "Турция", lat: 41.0082, lon: 28.9784, tz: "Europe/Istanbul" },
  { id: "dubai", title: "Дубай", country: "ОАЭ", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { id: "mecca", title: "Мекка", country: "Саудовская Аравия", lat: 21.3891, lon: 39.8579, tz: "Asia/Riyadh" },
  { id: "medina", title: "Медина", country: "Саудовская Аравия", lat: 24.4672, lon: 39.6111, tz: "Asia/Riyadh" },
];

export const defaultCity = cities[0];

export function findCityByCoords(lat, lon, threshold = 0.5) {
  let nearest = null;
  let minDist = Infinity;
  for (const city of cities) {
    const dist = Math.hypot(city.lat - lat, city.lon - lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  if (minDist <= threshold) return nearest;
  return null;
}
