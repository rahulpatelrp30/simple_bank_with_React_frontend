import { AtSign, CalendarDays, Crown, Inbox, Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { deleteCustomer, getCustomerById } from "../api";
import Breadcrumbs from "../components/Breadcrumbs";
import { maskedNumber, money } from "../components/money";
import usePageTitle from "../components/usePageTitle";

// Admin view of one customer: GET /api/admin/customers/{id}
export default function AdminCustomer() {
  usePageTitle("Customer Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomerById(id).then(setCustomer).catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    const name = `${customer.firstName} ${customer.lastName}`;
    if (!window.confirm(`Delete ${name}? This also deletes their accounts and transactions.`)) return;
    try {
      await deleteCustomer(customer.customerId);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    }
  }

  const crumbs = [{ label: "Admin Dashboard", to: "/admin" }, { label: `Customer #${id}` }];

  if (error) {
    return (
      <div className="page">
        <Breadcrumbs items={crumbs} />
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }
  if (!customer) return <div className="page"><div className="loader" /></div>;

  return (
    <div className="page-wide">
      <Breadcrumbs items={crumbs} />

      <section className="panel profile">
        <span className="avatar avatar-lg">
          {(customer.firstName[0] + (customer.lastName[0] || "")).toUpperCase()}
        </span>
        <div className="profile-info">
          <h1>
            {customer.firstName} {customer.lastName}
            {customer.premium && <span className="badge badge-gold"><Crown size={12} /> Premium</span>}
          </h1>
          <div className="profile-meta">
            <span><AtSign size={15} /> {customer.username}</span>
            <span><Mail size={15} /> {customer.email}</span>
            <span><CalendarDays size={15} /> Joined {customer.joined}</span>
          </div>
        </div>
        <div className="profile-total">
          <small>Total balance</small>
          <strong>{money(customer.totalBalance)}</strong>
        </div>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <Trash2 size={16} /> Delete
        </button>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Accounts</h2>
          <span className="muted small">{customer.accountCount} accounts</span>
        </div>

        {customer.accounts.length === 0 ? (
          <div className="empty">
            <Inbox size={32} />
            <p>This customer has not opened any accounts yet.</p>
          </div>
        ) : (
          <div className="bank-cards">
            {customer.accounts.map((a) => (
              <Link key={a.accountId} to={`/accounts/${a.accountId}`}
                className={`bank-card ${a.accountType === "CURRENT" ? "bank-card-alt" : ""}`}>
                <div className="bank-card-top">
                  <span className="bank-card-type">{a.accountType}</span>
                  <span className="bank-card-chip" />
                </div>
                <span className="bank-card-number">{maskedNumber(a.accountId)}</span>
                <div className="bank-card-bottom">
                  <span>
                    <small>Balance</small>
                    <strong>{money(a.balance)}</strong>
                  </span>
                  <small>{a.userName}</small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
