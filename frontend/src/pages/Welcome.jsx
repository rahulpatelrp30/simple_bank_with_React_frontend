import { ArrowRight, ChartColumn, ShieldCheck, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { homePath, useAuth } from "../AuthContext";
import usePageTitle from "../components/usePageTitle";

const FEATURES = [
  { icon: ShieldCheck, title: "Secure by design", text: "JWT login with separate admin and customer access, and BCrypt-hashed passwords." },
  { icon: Zap, title: "Instant transactions", text: "Deposits and withdrawals update your balance immediately." },
  { icon: ChartColumn, title: "Complete history", text: "Every transaction is recorded and easy to filter and review." },
  { icon: Users, title: "Admin tools", text: "Admins can search, filter, add and remove customers from one dashboard." },
];

// Public welcome page, shown before logging in
export default function Welcome() {
  usePageTitle("Welcome");
  const { user } = useAuth();

  return (
    <div className="welcome">
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow-pill">Full-stack banking demo</span>
          <h1>Banking made simple, secure and fast.</h1>
          <p>
            Open savings and current accounts, move money in seconds, and keep track of every
            transaction from one clean dashboard.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={homePath(user)} className="btn btn-primary btn-lg">
                Go to my dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-lg">
                  Open an account <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-lg">Log in</Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="bank-card hero-card">
            <div className="bank-card-top">
              <span className="bank-card-type">SAVINGS</span>
              <span className="bank-card-chip" />
            </div>
            <span className="bank-card-number">{"\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 0001"}</span>
            <div className="bank-card-bottom">
              <span>
                <small>Balance</small>
                <strong>$12,480.00</strong>
              </span>
              <small>Simple Bank</small>
            </div>
          </div>
          <div className="bank-card bank-card-alt hero-card hero-card-back" />
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="feature">
              <span className="feature-icon"><Icon size={22} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
