import { Briefcase, PiggyBank } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createAccount } from "../api";
import { homePath, useAuth } from "../AuthContext";
import Breadcrumbs from "../components/Breadcrumbs";
import usePageTitle from "../components/usePageTitle";

const ACCOUNT_TYPES = [
  { value: "SAVINGS", title: "Savings Account", text: "Grow your money and save toward your goals.", icon: PiggyBank },
  { value: "CURRENT", title: "Current Account", text: "For everyday spending and frequent transactions.", icon: Briefcase },
];

export default function CreateAccount() {
  usePageTitle("Open Account");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("SAVINGS");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account = await createAccount(accountType);
      navigate(`/accounts/${account.accountId}`, {
        state: { message: `Your new ${accountType.toLowerCase()} account is ready.` },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Breadcrumbs items={[{ label: "Dashboard", to: homePath(user) }, { label: "Open Account" }]} />

      <div className="card">
        <h1>Open a new account</h1>
        <p className="muted">Account holder: <strong>{user.firstName} {user.lastName}</strong> ({user.email})</p>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <span className="field-label">Account type</span>
          <div className="type-options">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <label key={t.value} className={`type-option ${accountType === t.value ? "selected" : ""}`}>
                  <input type="radio" name="accountType" value={t.value} className="sr-only"
                    checked={accountType === t.value} onChange={() => setAccountType(t.value)} />
                  <span className="type-icon"><Icon size={22} /></span>
                  <strong>{t.title}</strong>
                  <small>{t.text}</small>
                </label>
              );
            })}
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? "Opening account..." : "Open account"}
          </button>
        </form>
      </div>
    </div>
  );
}
