import { ChartColumn, ShieldCheck, Zap } from "lucide-react";

// Two-column layout used by the Log in and Sign up pages
// Parent -> child: title, subtitle and the form (children) come from the parent page
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div>
          <span className="auth-badge">Simple Bank</span>
          <h2>Banking made simple.</h2>
          <p>Open accounts, move money and track every transaction from one secure dashboard.</p>
        </div>

        <ul className="auth-features">
          <li>
            <ShieldCheck size={22} />
            <span>
              <strong>Secure by design</strong>
              <small>JWT login, and passwords hashed with BCrypt</small>
            </span>
          </li>
          <li>
            <Zap size={22} />
            <span>
              <strong>Instant transactions</strong>
              <small>Deposits and withdrawals update your balance right away</small>
            </span>
          </li>
          <li>
            <ChartColumn size={22} />
            <span>
              <strong>Complete history</strong>
              <small>Every transaction is recorded and easy to review</small>
            </span>
          </li>
        </ul>
      </aside>

      <section className="auth-form">
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}
