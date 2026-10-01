import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getTransactions } from "../api";
import { homePath, useAuth } from "../AuthContext";
import Breadcrumbs from "../components/Breadcrumbs";
import FilterTabs from "../components/FilterTabs";
import { maskedNumber, money } from "../components/money";
import usePageTitle from "../components/usePageTitle";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "DEPOSIT", label: "Deposits" },
  { value: "WITHDRAW", label: "Withdrawals" },
];

export default function Transactions() {
  usePageTitle("Transaction History");
  const { user } = useAuth();
  const { id } = useParams();
  const [transactions, setTransactions] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    getTransactions(id)
      .then((txns) => setTransactions([...txns].reverse()))
      .catch((err) => setError(err.message));
  }, [id]);

  const list = transactions ?? [];
  const shown = filter === "ALL" ? list : list.filter((t) => t.type === filter);
  const totalIn = list.filter((t) => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0);
  const totalOut = list.filter((t) => t.type === "WITHDRAW").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="page-wide">
      <Breadcrumbs items={[
        { label: "Dashboard", to: homePath(user) },
        { label: `Account ${maskedNumber(id)}`, to: `/accounts/${id}` },
        { label: "Transactions" },
      ]} />

      <div className="page-head">
        <div>
          <p className="eyebrow">Account {maskedNumber(id)}</p>
          <h1>Transaction History</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!error && !transactions && <div className="loader" />}

      {transactions && (
        <>
          <div className="stats stats-3">
            <div className="stat">
              <span className="stat-label">Transactions</span>
              <strong className="stat-value">{list.length}</strong>
            </div>
            <div className="stat">
              <span className="stat-label">Money In</span>
              <strong className="stat-value text-in">+{money(totalIn)}</strong>
            </div>
            <div className="stat">
              <span className="stat-label">Money Out</span>
              <strong className="stat-value text-out">-{money(totalOut)}</strong>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>All Transactions</h2>
              <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
            </div>

            {shown.length === 0 ? (
              <div className="empty">
                <Inbox size={32} />
                <p>No transactions to show.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((t) => {
                      const isIn = t.type === "DEPOSIT";
                      return (
                        <tr key={t.txnId}>
                          <td className="mono">#{t.txnId}</td>
                          <td>
                            <span className={`type-cell ${isIn ? "text-in" : "text-out"}`}>
                              {isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                              {isIn ? "Deposit" : "Withdrawal"}
                            </span>
                          </td>
                          <td>{t.date}</td>
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
        </>
      )}
    </div>
  );
}
