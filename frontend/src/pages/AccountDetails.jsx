import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { formatMoney, getAccount } from "../api";

export default function AccountDetails() {
  const { id } = useParams();
  const location = useLocation();
  const message = location.state?.message;
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccount(id).then(setAccount).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
        <Link to="/" className="back-link">Back to home</Link>
      </div>
    );
  }

  if (!account) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h1>Account Details</h1>
      {message && <div className="alert alert-success">{message}</div>}

      <dl className="details">
        <dt>Account ID</dt>
        <dd>{account.accountId}</dd>
        <dt>User Name</dt>
        <dd>{account.userName}</dd>
        <dt>Account Type</dt>
        <dd>{account.accountType}</dd>
      </dl>

      <div className="balance">
        <span className="muted">Balance</span>
        <strong>{formatMoney(account.balance)}</strong>
      </div>

      <div className="actions">
        <Link to={`/accounts/${id}/deposit`} className="btn btn-primary">Deposit</Link>
        <Link to={`/accounts/${id}/withdraw`} className="btn btn-primary">Withdraw</Link>
        <Link to={`/accounts/${id}/transactions`} className="btn">View Transactions</Link>
      </div>

      <Link to="/" className="back-link">Back to home</Link>
    </div>
  );
}