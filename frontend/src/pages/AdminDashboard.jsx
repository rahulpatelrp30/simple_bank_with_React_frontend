import { Crown, CreditCard, ReceiptText, UserPlus, Users, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { deleteCustomer, getAdminDashboard, getAllCustomers } from "../api";
import AddCustomerForm from "../components/AddCustomerForm";
import CustomerTable from "../components/CustomerTable";
import FilterTabs from "../components/FilterTabs";
import { money } from "../components/money";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import usePageTitle from "../components/usePageTitle";

const FILTERS = [
  { value: "ALL", label: "All customers" },
  { value: "PREMIUM", label: "Premium" },
  { value: "STANDARD", label: "Standard" },
];

// Admin dashboard: GET /api/admin plus customer CRUD, search and filter
export default function AdminDashboard() {
  usePageTitle("Admin Dashboard");
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState("");      // set by the SearchBar child
  const [filter, setFilter] = useState("ALL");   // set by the FilterTabs child
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStats = useCallback(() => {
    getAdminDashboard().then(setStats).catch((err) => setError(err.message));
  }, []);

  // Reload the customer list whenever the search text or the filter changes
  const loadCustomers = useCallback(() => {
    const premium = filter === "ALL" ? null : filter === "PREMIUM";
    return getAllCustomers({ firstName: search, premium })
      .then(setCustomers)
      .catch((err) => setError(err.message));
  }, [search, filter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Called by AddCustomerForm (child -> parent) after a customer is created
  function handleCreated(customer) {
    setShowForm(false);
    setMessage(`Customer ${customer.firstName} ${customer.lastName} was created.`);
    loadCustomers();
    loadStats();
  }

  // Called by CustomerTable (child -> parent) when Delete is clicked
  async function handleDelete(customer) {
    const name = `${customer.firstName} ${customer.lastName}`;
    if (!window.confirm(`Delete ${name}? This also deletes their accounts and transactions.`)) return;
    setDeletingId(customer.customerId);
    setError("");
    try {
      await deleteCustomer(customer.customerId);
      setMessage(`Customer ${name} was deleted.`);
      loadCustomers();
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Admin Dashboard</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          <UserPlus size={18} /> Add Customer
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {!stats ? <div className="loader" /> : (
        <div className="stats">
          <StatCard main icon={Wallet} label="Total Deposits Held" value={money(stats.totalBalance)} note="Across every customer account" />
          <StatCard icon={Users} label="Customers" value={stats.totalCustomers} note={`${stats.premiumCustomers} premium`} />
          <StatCard icon={CreditCard} label="Accounts" value={stats.totalAccounts} note="Savings and current" />
          <StatCard icon={ReceiptText} label="Transactions" value={stats.totalTransactions} note="Deposits and withdrawals" />
        </div>
      )}

      {showForm && (
        <section className="panel">
          <AddCustomerForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Customers</h2>
          <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        <div className="toolbar">
          <SearchBar placeholder="Find customer by first name..." onSearch={setSearch} />
          {stats && (
            <span className="muted small">
              <Crown size={14} className="inline-icon" /> Premium = total balance of {money(stats.premiumThreshold)} or more
            </span>
          )}
        </div>

        {!customers ? <div className="loader" /> : customers.length === 0 ? (
          <div className="empty">
            <Users size={32} />
            <p>{search || filter !== "ALL" ? "No customers match your search." : "No customers yet."}</p>
          </div>
        ) : (
          <CustomerTable customers={customers} onDelete={handleDelete} deletingId={deletingId} />
        )}
      </section>
    </div>
  );
}
