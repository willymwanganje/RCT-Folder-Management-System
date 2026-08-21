export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total <= meta.pageSize) return null;
  const pages = Math.ceil(meta.total / meta.pageSize);
  return (
    <div className="pagination">
      <button type="button" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </button>
      <span>
        Page {meta.page} of {pages} · {meta.total} records
      </span>
      <button type="button" disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
        Next
      </button>
    </div>
  );
}
