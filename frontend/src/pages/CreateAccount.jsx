import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createAccount } from "../api";
import { useAuth } from "../AuthContext";

export default function CreateAccount() {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState("SAVINGS");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account = await createAccount(accountType);
      navigate(`/accounts/${account.accountId}`, {
        state: { message: `Account ${account.accountId} created successfully!` },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Create Account</h1>
      <p className="muted">Account holder: {user.name} ({user.email})</p>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>
          Account Type
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating..." : "Submit"}
        </button>
      </form>

      <Link to="/" className="back-link">Back to my accounts</Link>
    </div>
  );
}