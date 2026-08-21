export default function Spinner({ label = "Loading" }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p>{label}…</p>
    </div>
  );
}
