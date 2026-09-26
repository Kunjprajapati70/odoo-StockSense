export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function resolveRange(query) {
  const now = new Date();
  if (query.from || query.to) {
    const from = startOfDay(query.from || query.to || now);
    const to = endOfDay(query.to || query.from || now);
    return { from, to };
  }

  const range = query.range || '30d';
  const to = endOfDay(now);
  if (range === 'today') return { from: startOfDay(now), to };
  const days = range === '7d' ? 6 : 29;
  const from = startOfDay(now);
  from.setDate(from.getDate() - days);
  return { from, to };
}

export function eachDay(from, to) {
  const days = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
