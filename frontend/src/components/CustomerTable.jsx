import { Crown, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { money } from "./money";

// Parent -> child: the list of customers arrives as a prop.
// Child -> parent: clicking "Delete" calls the parent's onDelete function.
export default function CustomerTable({ customers, onDelete, deletingId }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Username</th>
            <th>Accounts</th>
            <th className="right">Total Balance</th>
            <th>Joined</th>
            <th className="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customerId}>
              <td className="mono">#{c.customerId}</td>
              <td>
                <div className="cell-person">
                  <span className="avatar avatar-sm">{(c.firstName[0] + (c.lastName[0] || "")).toUpperCase()}</span>
                  <span>
                    <strong>{c.firstName} {c.lastName}</strong>
                    {c.premium && <span className="badge badge-gold"><Crown size={12} /> Premium</span>}
                    <small className="block muted-text">{c.email}</small>
                  </span>
                </div>
              </td>
              <td>{c.username}</td>
              <td>{c.accountCount}</td>
              <td className="right amount">{money(c.totalBalance)}</td>
              <td>{c.joined}</td>
              <td className="right">
                <div className="row-actions">
                  <Link to={`/admin/customers/${c.customerId}`} className="icon-button" title="View customer">
                    <Eye size={16} />
                  </Link>
                  <button type="button" className="icon-button danger" title="Delete customer"
                    disabled={deletingId === c.customerId} onClick={() => onDelete(c)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
