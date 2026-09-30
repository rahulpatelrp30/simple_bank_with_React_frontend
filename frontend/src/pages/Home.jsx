import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { formatMoney, getMyAccounts, getTransactions } from "../api";
import { useAuth } from "../AuthContext";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

// Dashboard: summary of the logged-in user's money
export default function Home() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const myAccounts = await getMyAccounts();
        // Load every account's transactions at the same time
        const lists = await Promise.all(
          myAccounts.map((a) =>
            getTransactions(a.accountId).then((txns) => txns.map((t) => ({ ...t, accountId: a.accountId })))
          )
        );
        setAccounts(myAccounts);
        setTransactions(lists.flat().sort((x, y) => y.txnId - x.txnId));
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="dashboard">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!accounts) return <div className="dashboard"><p className="muted">Loading your dashboard...</p></div>;

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const moneyIn = transactions.filter((t) => t.type === "DEPOSIT").reduce((sum, t) => sum + t.amount, 0);
  const moneyOut = transactions.filter((t) => t.type === "WITHDRAW").reduce((sum, t) => sum + t.amount, 0);
  const recent = transactions.slice(0, 8);

  return (
    <div className="dashboard">
      {/* ---------- Greeting ---------- */}
      <div className="dash-head">
        <div>
          <p className="dash-date">{today}</p>
          <h1>{greeting()}, {user.name}</h1>
        </div>
        <Link to="/create" className="btn btn-primary">+ New Account</Link>
      </div>

      {/* ---------- Summary tiles ---------- */}
      <div className="stats">
        <div className="stat stat-main">
          <span className="stat-label">Total Balance</span>
          <strong className="stat-value">{formatMoney(totalBalance)}</strong>
          <span className="stat-note">Across all your accounts</span>
        </div>
        <div className="stat">
          <span className="stat-label">Accounts</span>
          <strong className="stat-value">{accounts.length}</strong>
          <span className="stat-note">Savings and current</span>
        </div>
        <div className="stat">
          <span className="stat-label">Money In</span>
          <strong className="stat-value text-in">+{formatMoney(moneyIn)}</strong>
          <span className="stat-note">Total deposits</span>
        </div>
        <div className="stat">
          <span className="stat-label">Money Out</span>
          <strong className="stat-value text-out">-{formatMoney(moneyOut)}</strong>
          <span className="stat-note">Total withdrawals</span>
        </div>
      </div>

      {/* ---------- Account cards ---------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Your Accounts</h2>
        </div>

        <div className="bank-cards">
          {accounts.map((a) => (
            <div key={a.accountId} className="bank-card-wrap">
              <Link to={`/accounts/${a.accountId}`} className={`bank-card ${a.accountType === "CURRENT" ? "bank-card-alt" : ""}`}>
                <div className="bank-card-top">
                  <span className="bank-card-type">{a.accountType}</span>
                  <span className="bank-card-chip" />
                </div>
                <span className="bank-card-number">
                  {"\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 "}{String(a.accountId).padStart(4, "0")}
                </span>
                <div className="bank-card-bottom">
                  <span>
                    <small>Balance</small>
                    <strong>{formatMoney(a.balance)}</strong>
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
            <span className="plus">+</span>
            Open a new account
          </Link>
        </div>
      </section>

      {/* ---------- Recent activity ---------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Recent Activity</h2>
          <span className="muted small">Last {recent.length} transactions</span>
        </div>

        {recent.length === 0 ? (
          <p className="empty">No transactions yet. Make a deposit to get started.</p>
        ) : (
          <ul className="activity">
            {recent.map((t) => {
              const isIn = t.type === "DEPOSIT";
              return (
                <li key={t.txnId}>
                  <span className={`activity-icon ${isIn ? "icon-in" : "icon-out"}`}>{isIn ? "+" : "-"}</span>
                  <span className="activity-info">
                    <strong>{isIn ? "Deposit" : "Withdrawal"}</strong>
                    <small>Account {t.accountId} &middot; {t.date}</small>
                  </span>
                  <span className={`activity-amount ${isIn ? "text-in" : "text-out"}`}>
                    {isIn ? "+" : "-"}{formatMoney(t.amount)}
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