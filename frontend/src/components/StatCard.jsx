export default function StatCard({ label, value, tone = "green", icon }) {
  const toneStyles = {
    green: "border-success",
    gold: "border-warning",
    slate: "border-secondary",
  };

  const iconStyles = {
    green: "bg-success-subtle text-success",
    gold: "bg-warning-subtle text-warning",
    slate: "bg-secondary-subtle text-secondary",
  };

  return (
    <div className="col">
      <div
        className={`card h-100 border-0 border-start border-4 ${
          toneStyles[tone] || toneStyles.green
        } shadow-sm`}
      >
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="text-body-secondary mb-2 small fw-semibold text-uppercase">
                {label}
              </p>

              <h3 className="mb-0 fw-bold">
                {value ?? "—"}
              </h3>
            </div>

            {icon && (
              <div
                className={`rounded-3 d-flex align-items-center justify-content-center ${iconStyles[tone] || iconStyles.green}`}
                style={{
                  width: "48px",
                  height: "48px",
                  fontSize: "1.25rem",
                }}
              >
                <i className={`bi ${icon}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}