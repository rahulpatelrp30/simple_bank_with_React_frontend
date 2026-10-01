import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// items: [{ label: "Dashboard", to: "/" }, { label: "Deposit" }]
export default function Breadcrumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="crumb">
          {i > 0 && <ChevronRight size={14} />}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
