export default function Pagination({ meta, onPage }) {
  if (!meta) return null;
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.total, meta.page * meta.limit);
  const pages = [];
  const windowStart = Math.max(1, meta.page - 2);
  const windowEnd = Math.min(meta.pages, windowStart + 4);
  for (let page = windowStart; page <= windowEnd; page += 1) pages.push(page);

  return (
    <div className="pagination">
      <span className="muted">Showing {start}–{end} of {meta.total}</span>
      <div className="pager">
        <button className="btn" type="button" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1}>Previous</button>
        {pages.map((page) => (
          <button className={`btn ${page === meta.page ? 'btn-primary' : ''}`} type="button" key={page} onClick={() => onPage(page)}>{page}</button>
        ))}
        <button className="btn" type="button" onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.pages}>Next</button>
      </div>
    </div>
  );
}
