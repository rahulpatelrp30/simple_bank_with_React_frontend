import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { deposit, getAccount, withdraw } from "../api";
import { homePath, useAuth } from "../AuthContext";
import Breadcrumbs from "../components/Breadcrumbs";
import { Field } from "../components/Field";
import { maskedNumber, money } from "../components/money";
import usePageTitle from "../components/usePageTitle";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

// Used for both the Deposit page and the Withdraw page
export default function AmountForm({ type }) {
  const isDeposit = type === "deposit";
  const title = isDeposit ? "Deposit Money" : "Withdraw Money";
  usePageTitle(title);

  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccount(id).then(setAccount).catch((err) => setError(err.message));
  }, [id]);

  const value = Number(amount);
  const isValid = value > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValid) {
      setError("Please enter an amount greater than 0");
      return;
    }

    setLoading(true);
    try {
      const action = isDeposit ? deposit : withdraw;
      await action(id, value);
      const verb = isDeposit ? "Deposited" : "Withdrew";
      navigate(`/accounts/${id}`, { state: { message: `${verb} ${money(value)} successfully.` } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Breadcrumbs items={[
        { label: "Dashboard", to: homePath(user) },
        { label: `Account ${maskedNumber(id)}`, to: `/accounts/${id}` },
        { label: isDeposit ? "Deposit" : "Withdraw" },
      ]} />

      <div className="card">
        <h1>{title}</h1>
        <p className="muted">
          {isDeposit ? "Add money to" : "Take money out of"} account {maskedNumber(id)}
        </p>

        {account && (
          <div className="balance-strip">
            <span>Available balance</span>
            <strong>{money(account.balance)}</strong>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Amount" prefix="$">
            <input type="number" step="0.01" placeholder="0.00" className="input-amount"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>

          <div className="chips">
            {QUICK_AMOUNTS.map((q) => (
              <button key={q} type="button" className={`chip ${value === q ? "chip-active" : ""}`}
                onClick={() => setAmount(String(q))}>
                {money(q)}
              </button>
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? "Processing..." : `${isDeposit ? "Deposit" : "Withdraw"}${isValid ? " " + money(value) : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}
