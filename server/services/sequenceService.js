import Counter from '../models/Counter.js';

export async function nextNumber(key, prefix) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  return `${prefix}-${String(counter.seq).padStart(5, '0')}`;
}
