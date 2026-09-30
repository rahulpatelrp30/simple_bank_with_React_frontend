import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { formatMoney, getTransactions } from "../api";

export default function Transactions() {
  const { id } = useParams();
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTransactions(id).then(setTransactions).catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="card card-wide">
      <h1>Transaction History</h1>
      <p className="muted">Account {id}</p>

      {error && <div className="alert alert-error">{error}</div>}
      {!error && !transactions && <p>Loading...</p>}
      {transactions && transactions.length === 0 && <p className="muted">No transactions yet.</p>}

      {transactions && transactions.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.txnId}>
                  <td>{t.txnId}</td>
                  <td>
                    <span className={t.type === "DEPOSIT" ? "tag tag-in" : "tag tag-out"}>{t.type}</span>
                  </td>
                  <td className="amount">{formatMoney(t.amount)}</td>
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link to={`/accounts/${id}`} className="back-link">Back to account</Link>
    </div>
  );
}