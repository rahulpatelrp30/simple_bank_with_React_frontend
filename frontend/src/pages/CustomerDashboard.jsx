import {
  ArrowDownLeft, ArrowUpRight, Briefcase, Crown, Inbox, PiggyBank, Plus, ReceiptText, ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCustomerDashboard } from "../api";
import { useAuth } from "../AuthContext";
import { accountName, maskedNumber, money, PREMIUM_THRESHOLD } from "../components/money";
import usePageTitle from "../components/usePageTitle";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Customer "Account Summary": one call to GET /api/customerDashboard/{id}
export default function CustomerDashboard() {
  usePageTitle("Account Summary");
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loadedAt] = useState(() => new Date());

  useEffect(() => {
    getCustomerDashboard(user.userId).then(setData).catch((err) => setError(err.message));
  }, [user.userId]);

  if (error) return <div className="page-wide"><div className="alert alert-error">{error}</div></div>;
  if (!data) return <div className="page-wide"><div className="loader" /></div>;

  const { accounts, recentTransactions } = data;
  const first = accounts[0];
  const isPremium = data.totalBalance >= PREMIUM_THRESHOLD;
  const progress = Math.min(100, (data.totalBalance / PREMIUM_THRESHOLD) * 100);
  const flow = Math.max(data.moneyIn, data.moneyOut, 1);
  const asOf = loadedAt.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div className="page-wide">
      {/* ---------- Welcome banner ---------- */}
      <section className="dash-banner">
        <div>
          <h1>{greeting()}, {user.firstName}</h1>
          <p>Here's your account summary as of {asOf}.</p>
        </div>
        <div className="dash-banner-total">
          <small>Total available balance</small>
          <strong>{money(data.totalBalance)}</strong>
          {isPremium && <span className="badge badge-gold"><Crown size={12} /> Premium customer</span>}
        </div>
      </section>

      <div className="dash-layout">
        <div className="dash-main">
          {/* ---------- Account summary ---------- */}
          <section className="panel">
            <div className="panel-head">
              <h2>Account Summary</h2>
              <Link to="/create" className="link"><Plus size={15} className="inline-svg" /> Open an account</Link>
            </div>

            {accounts.length === 0 ? (
              <div className="empty">
                <Inbox size={32} />
                <p>You don't have any accounts yet.</p>
                <Link to="/create" className="btn btn-primary">Open your first account</Link>
              </div>
            ) : (
              <div className="acct-list">
                {accounts.map((a) => {
                  const Icon = a.accountType === "CURRENT" ? Briefcase : PiggyBank;
                  return (
                    <div key={a.accountId} className="acct-row">
                      <span className={`acct-icon ${a.accountType === "CURRENT" ? "acct-icon-alt" : ""}`}><Icon size={20} /></span>
                      <Link to={`/accounts/${a.accountId}`} className="acct-name">
                        <strong>{accountName(a.accountType)}</strong>
                        <small>{maskedNumber(a.accountId)}</small>
                      </Link>
                      <div className="acct-balance">
                        <small>Available balance</small>
                        <strong>{money(a.balance)}</strong>
                      </div>
                      <div className="acct-actions">
                        <Link to={`/accounts/${a.accountId}/deposit`}>Deposit</Link>
                        <Link to={`/accounts/${a.accountId}/withdraw`}>Withdraw</Link>
                        <Link to={`/accounts/${a.accountId}/transactions`}>Activity</Link>
                      </div>
                    </div>
                  );
                })}
                <div className="acct-total">
                  <span>Total</span>
                  <strong>{money(data.totalBalance)}</strong>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Recent activity ---------- */}
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
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Account</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t) => {
                      const isIn = t.type === "DEPOSIT";
                      return (
                        <tr key={t.txnId}>
                          <td>{t.date}</td>
                          <td>
                            <span className={`type-cell ${isIn ? "text-in" : "text-out"}`}>
                              {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                              {isIn ? "Deposit" : "Withdrawal"}
                            </span>
                          </td>
                          <td className="mono">{maskedNumber(t.accountId)}</td>
                          <td className={`right amount ${isIn ? "text-in" : "text-out"}`}>
                            {isIn ? "+" : "-"}{money(t.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="dash-side">
          {/* ---------- Quick actions ---------- */}
          <section className="panel">
            <h2 className="side-title">Quick Actions</h2>
            <div className="quick-grid">
              <Link to="/create" className="quick"><Plus size={20} /> Open account</Link>
              {first ? (
                <>
                  <Link to={`/accounts/${first.accountId}/deposit`} className="quick"><ArrowDownLeft size={20} /> Deposit</Link>
                  <Link to={`/accounts/${first.accountId}/withdraw`} className="quick"><ArrowUpRight size={20} /> Withdraw</Link>
                  <Link to={`/accounts/${first.accountId}/transactions`} className="quick"><ReceiptText size={20} /> Activity</Link>
                </>
              ) : (
                <span className="quick quick-disabled">Open an account to deposit and withdraw</span>
              )}
            </div>
          </section>

          {/* ---------- Money in / out ---------- */}
          <section className="panel">
            <h2 className="side-title">Money In &amp; Out</h2>
            <div className="flow">
              <div className="flow-row">
                <span>Money in</span>
                <strong className="text-in">{data.moneyIn > 0 ? "+" : ""}{money(data.moneyIn)}</strong>
              </div>
              <div className="flow-bar"><span className="flow-in" style={{ width: `${(data.moneyIn / flow) * 100}%` }} /></div>
              <div className="flow-row">
                <span>Money out</span>
                <strong className="text-out">{data.moneyOut > 0 ? "-" : ""}{money(data.moneyOut)}</strong>
              </div>
              <div className="flow-bar"><span className="flow-out" style={{ width: `${(data.moneyOut / flow) * 100}%` }} /></div>
            </div>
          </section>

          {/* ---------- Premium status ---------- */}
          <section className={`panel premium-panel ${isPremium ? "is-premium" : ""}`}>
            <h2 className="side-title"><Crown size={17} /> Premium Status</h2>
            {isPremium ? (
              <p>You're a <strong>Premium</strong> customer. Thank you for banking with us.</p>
            ) : (
              <p>Keep <strong>{money(PREMIUM_THRESHOLD - data.totalBalance)}</strong> more across your accounts to become a Premium customer.</p>
            )}
            <div className="progress"><span style={{ width: `${progress}%` }} /></div>
            <small className="muted-text">{money(data.totalBalance)} of {money(PREMIUM_THRESHOLD)}</small>
          </section>

          {/* ---------- Security ---------- */}
          <section className="panel">
            <h2 className="side-title"><ShieldCheck size={17} /> Security Center</h2>
            <p className="side-text">Signed on as <strong>{user.email}</strong>.</p>
            <p className="side-text">Simple Bank will never ask for your password by phone or email.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
