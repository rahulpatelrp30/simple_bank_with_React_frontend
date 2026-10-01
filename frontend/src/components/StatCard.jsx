// One summary tile. All data comes in from the parent as props.
export default function StatCard({ icon: Icon, label, value, note, tone = "", main = false }) {
  return (
    <div className={`stat ${main ? "stat-main" : ""}`}>
      {Icon && (
        <span className={`stat-icon ${tone === "in" ? "icon-in" : tone === "out" ? "icon-out" : ""}`}>
          <Icon size={20} />
        </span>
      )}
      <span className="stat-label">{label}</span>
      <strong className={`stat-value ${tone === "in" ? "text-in" : tone === "out" ? "text-out" : ""}`}>
        {value}
      </strong>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}
