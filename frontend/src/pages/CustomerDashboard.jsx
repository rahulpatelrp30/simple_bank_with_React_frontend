import { ArrowDownLeft, ArrowUpRight, CreditCard, Inbox, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCustomerDashboard } from "../api";
import { useAuth } from "../AuthContext";
import { maskedNumber, money } from "../components/money";
import StatCard from "../components/StatCard";
import usePageTitle from "../components/usePageTitle";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

// Customer dashboard: one call to GET /api/customerDashboard/{id}
export default function CustomerDashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomerDashboard(user.userId).then(setData).catch((err) => setError(err.message));
  }, [user.userId]);

  if (error) return <div className="page-wide"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <div className="page-wide"><div className="loader" /></div>;

  const { accounts, recentTransactions } = data;

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>{greeting()}, {user.firstName}</h1>
        </div>
        <Link to="/create" className="btn btn-primary"><Plus size={18} /> New Account</Link>
      </div>

      {/* Parent -> child props: each StatCard gets its label and value from here */}
      <div className="stats">
        <StatCard main icon={Wallet} label="Total Balance" value={money(data.totalBalance)} note="Across all your accounts" />
        <StatCard icon={CreditCard} label="Accounts" value={accounts.length} note="Savings and current" />
        <StatCard icon={ArrowDownLeft} tone="in" label="Money In" value={`+${money(data.moneyIn)}`} note="Total deposits" />
        <StatCard icon={ArrowUpRight} tone="out" label="Money Out" value={`-${money(data.moneyOut)}`} note="Total withdrawals" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Your Accounts</h2>
          <span className="muted small">{accounts.length} {accounts.length === 1 ? "account" : "accounts"}</span>
        </div>

        <div className="bank-cards">
          {accounts.map((a) => (
            <div key={a.accountId}>
              <Link to={`/accounts/${a.accountId}`} className={`bank-card ${a.accountType === "CURRENT" ? "bank-card-alt" : ""}`}>
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
              <div className="bank-card-actions">
                <Link to={`/accounts/${a.accountId}/deposit`}>Deposit</Link>
                <Link to={`/accounts/${a.accountId}/withdraw`}>Withdraw</Link>
                <Link to={`/accounts/${a.accountId}/transactions`}>History</Link>
              </div>
            </div>
          ))}

          <Link to="/create" className="bank-card-add">
            <span className="plus"><Plus size={24} /></span>
            Open a new account
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Recent Activity</h2>
          <span className="muted small">{data.transactionCount} transactions in total</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty">
            <Inbox size={32} />
            <p>No transactions yet. Make a deposit to get started.</p>
          </div>
        ) : (
          <ul className="activity">
            {recentTransactions.map((t) => {
              const isIn = t.type === "DEPOSIT";
              return (
                <li key={t.txnId}>
                  <span className={`activity-icon ${isIn ? "icon-in" : "icon-out"}`}>
                    {isIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                  <span className="activity-info">
                    <strong>{isIn ? "Deposit" : "Withdrawal"}</strong>
                    <small>Account {maskedNumber(t.accountId)} &middot; {t.date}</small>
                  </span>
                  <span className={`activity-amount ${isIn ? "text-in" : "text-out"}`}>
                    {isIn ? "+" : "-"}{money(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
