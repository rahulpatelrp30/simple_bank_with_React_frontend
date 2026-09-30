import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { deposit, formatMoney, withdraw } from "../api";

// Used for both the Deposit page and the Withdraw page
export default function AmountForm({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDeposit = type === "deposit";
  const title = isDeposit ? "Deposit Money" : "Withdraw Money";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Please enter an amount greater than 0");
      return;
    }

    setLoading(true);
    try {
      const action = isDeposit ? deposit : withdraw;
      await action(id, value);
      const verb = isDeposit ? "Deposited" : "Withdrew";
      navigate(`/accounts/${id}`, { state: { message: `${verb} ${formatMoney(value)} successfully.` } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>{title}</h1>
      <p className="muted">Account {id}</p>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>
          Amount
          <input type="number" step="0.01" placeholder="e.g. 500"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>

      <Link to={`/accounts/${id}`} className="back-link">Back to account</Link>
    </div>
  );
}