import { ArrowDownLeft, ArrowUpRight, Inbox, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { getAccount, getTransactions } from "../api";
import { homePath, useAuth } from "../AuthContext";
import Breadcrumbs from "../components/Breadcrumbs";
import { maskedNumber, money } from "../components/money";
import usePageTitle from "../components/usePageTitle";

export default function AccountDetails() {
  usePageTitle("Account Details");
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const message = location.state?.message;
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAccount(id), getTransactions(id)])
      .then(([acc, txns]) => {
        setAccount(acc);
        setTransactions([...txns].reverse());
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const crumbs = [{ label: "Dashboard", to: homePath(user) }, { label: `Account ${maskedNumber(id)}` }];

  if (error) {
    return (
      <div className="page">
        <Breadcrumbs items={crumbs} />
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!account) return <div className="page"><div className="loader" /></div>;

  const isCurrent = account.accountType === "CURRENT";

  return (
    <div className="page-wide">
      <Breadcrumbs items={crumbs} />
      {message && <div className="alert alert-success">{message}</div>}

      <div className="details-grid">
        {/* Balance card and actions */}
        <section className="panel">
          <div className={`bank-card bank-card-lg ${isCurrent ? "bank-card-alt" : ""}`}>
            <div className="bank-card-top">
              <span className="bank-card-type">{account.accountType} ACCOUNT</span>
              <span className="bank-card-chip" />
            </div>
            <span className="bank-card-number">{maskedNumber(account.accountId)}</span>
            <div className="bank-card-bottom">
              <span>
                <small>Available balance</small>
                <strong>{money(account.balance)}</strong>
              </span>
              <small>{account.userName}</small>
            </div>
          </div>

          <div className="action-grid">
            <Link to={`/accounts/${id}/deposit`} className="action">
              <span className="action-icon icon-in"><ArrowDownLeft size={20} /></span>
              Deposit
            </Link>
            <Link to={`/accounts/${id}/withdraw`} className="action">
              <span className="action-icon icon-out"><ArrowUpRight size={20} /></span>
              Withdraw
            </Link>
            <Link to={`/accounts/${id}/transactions`} className="action">
              <span className="action-icon"><ReceiptText size={20} /></span>
              View Transactions
            </Link>
          </div>
        </section>

        {/* Account information */}
        <section className="panel">
          <div className="panel-head">
            <h2>Account Information</h2>
          </div>
          <dl className="info-list">
            <div>
              <dt>Account ID</dt>
              <dd>{account.accountId}</dd>
            </div>
            <div>
              <dt>Account holder</dt>
              <dd>{account.userName}</dd>
            </div>
            <div>
              <dt>Account type</dt>
              <dd><span className={`badge ${isCurrent ? "badge-purple" : "badge-blue"}`}>{account.accountType}</span></dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd>{money(account.balance)}</dd>
            </div>
            <div>
              <dt>Transactions</dt>
              <dd>{transactions.length}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Recent transactions */}
      <section className="panel">
        <div className="panel-head">
          <h2>Recent Transactions</h2>
          {transactions.length > 0 && <Link to={`/accounts/${id}/transactions`} className="link">View all</Link>}
        </div>

        {transactions.length === 0 ? (
          <div className="empty">
            <Inbox size={32} />
            <p>No transactions yet. Make your first deposit.</p>
          </div>
        ) : (
          <ul className="activity">
            {transactions.slice(0, 5).map((t) => {
              const isIn = t.type === "DEPOSIT";
              return (
                <li key={t.txnId}>
                  <span className={`activity-icon ${isIn ? "icon-in" : "icon-out"}`}>
                    {isIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </span>
                  <span className="activity-info">
                    <strong>{isIn ? "Deposit" : "Withdrawal"}</strong>
                    <small>Transaction #{t.txnId} &middot; {t.date}</small>
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
