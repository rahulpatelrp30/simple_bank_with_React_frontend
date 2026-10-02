import {
  ArrowRight, Briefcase, CircleCheck, Clock, CreditCard, House, KeyRound, Lock, Mail,
  PiggyBank, ShieldCheck, UserPlus, Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { homePath, useAuth } from "../AuthContext";
import { Field, PasswordInput } from "../components/Field";
import usePageTitle from "../components/usePageTitle";

const RATES = [
  { value: "4.00%", unit: "APY*", label: "Simple Savings" },
  { value: "$0", unit: "", label: "Monthly maintenance fee*" },
  { value: "24/7", unit: "", label: "Online account access" },
  { value: "Instant", unit: "", label: "Deposits and withdrawals" },
];

const PRODUCTS = [
  {
    icon: PiggyBank, title: "Simple Savings", tag: "Popular",
    text: "Grow your money with a savings account built for your goals.",
    points: ["Earn interest on every dollar", "No minimum opening deposit", "Track every deposit"],
    available: true,
  },
  {
    icon: Briefcase, title: "Simple Current", tag: "",
    text: "An everyday account for spending, bills and frequent transactions.",
    points: ["Unlimited deposits and withdrawals", "No monthly maintenance fee", "Real-time balance"],
    available: true,
  },
  {
    icon: CreditCard, title: "Credit Cards", tag: "Coming soon",
    text: "Rewards and cash back on the purchases you already make.",
    points: ["Cash back on every purchase", "No annual fee options", "Fraud monitoring"],
    available: false,
  },
  {
    icon: House, title: "Home Loans", tag: "Coming soon",
    text: "Competitive mortgage options to help you buy or refinance.",
    points: ["Fixed and adjustable rates", "Online pre-qualification", "Dedicated loan officers"],
    available: false,
  },
];

const STEPS = [
  { icon: UserPlus, title: "Enroll online", text: "Create your username and password in about a minute." },
  { icon: Wallet, title: "Open an account", text: "Choose Simple Savings or Simple Current. No paperwork needed." },
  { icon: Clock, title: "Bank any time", text: "Deposit, withdraw and review your activity 24/7." },
];

// The sign-on box on the homepage, like on most bank websites
function SignOnCard() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <div className="signon-card">
        <h2>Welcome back, {user.firstName}</h2>
        <p className="muted">You're signed on securely.</p>
        <Link to={homePath(user)} className="btn btn-primary btn-block btn-lg">
          Go to my accounts <ArrowRight size={18} />
        </Link>
        <button type="button" className="btn btn-block signon-secondary" onClick={logout}>Sign Off</button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedIn = await login(username, password);
      navigate(homePath(loggedIn));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form className="signon-card" onSubmit={handleSubmit}>
      <h2><Lock size={18} /> Sign On</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <Field label="Email" icon={Mail}>
        <input type="email" required autoComplete="email" placeholder="you@example.com"
          value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Password" icon={KeyRound}>
        <PasswordInput required autoComplete="current-password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? "Signing on..." : "Sign On"}
      </button>
      <div className="signon-links">
        <span>Forgot your password?</span>
        <Link to="/signup">Enroll now</Link>
      </div>
    </form>
  );
}

// Public homepage
export default function Welcome() {
  usePageTitle("Personal Banking");
  const { user } = useAuth();

  return (
    <div className="home">
      {/* ---------- Hero with sign-on ---------- */}
      <section className="home-hero full-bleed">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <span className="hero-eyebrow">Personal Banking</span>
            <h1>Banking that moves at your pace.</h1>
            <p>
              Open a savings or current account in minutes, move money instantly, and see every
              transaction in one secure place.
            </p>
            <div className="hero-actions">
              <Link to={user ? "/create" : "/signup"} className="btn btn-light btn-lg">
                Open an account <ArrowRight size={18} />
              </Link>
              <a href="#products" className="btn btn-ghost-light btn-lg">Explore accounts</a>
            </div>
            <ul className="hero-trust">
              <li><CircleCheck size={16} /> No monthly fees*</li>
              <li><CircleCheck size={16} /> 24/7 online access</li>
              <li><CircleCheck size={16} /> Secure sign-on</li>
            </ul>
          </div>
          <SignOnCard />
        </div>
      </section>

      {/* ---------- Rates strip ---------- */}
      <section id="rates" className="rates full-bleed">
        <div className="rates-inner">
          {RATES.map((r) => (
            <div key={r.label} className="rate">
              <strong>{r.value}<small>{r.unit}</small></strong>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Products ---------- */}
      <section id="products" className="home-section">
        <div className="section-head">
          <span className="section-eyebrow">Banking products</span>
          <h2>Find the right account for you</h2>
          <p>Simple, transparent accounts with no hidden fees.</p>
        </div>
        <div className="products">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className={`product ${p.available ? "" : "product-soon"}`}>
                <div className="product-top">
                  <span className="product-icon"><Icon size={24} /></span>
                  {p.tag && <span className={`product-tag ${p.available ? "" : "tag-soon"}`}>{p.tag}</span>}
                </div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul>
                  {p.points.map((pt) => <li key={pt}><CircleCheck size={15} /> {pt}</li>)}
                </ul>
                {p.available ? (
                  <Link to={user ? "/create" : "/signup"} className="btn btn-primary btn-block">Open account</Link>
                ) : (
                  <button type="button" className="btn btn-block" disabled>Coming soon</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="home-section how full-bleed">
        <div className="how-inner">
          <div className="section-head">
            <span className="section-eyebrow">Getting started</span>
            <h2>Start banking in three easy steps</h2>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="step">
                  <span className="step-number">{i + 1}</span>
                  <span className="step-icon"><Icon size={24} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Security ---------- */}
      <section id="security" className="security full-bleed">
        <div className="security-inner">
          <div>
            <span className="section-eyebrow light">Security Center</span>
            <h2>Your security is our priority</h2>
            <p>We protect your accounts at every step, from the moment you sign on.</p>
            <ul className="security-list">
              <li><ShieldCheck size={20} /><span><strong>Secure sign-on</strong> Every session uses a signed token that expires automatically.</span></li>
              <li><KeyRound size={20} /><span><strong>Protected passwords</strong> Passwords are hashed with BCrypt and never stored as plain text.</span></li>
              <li><Lock size={20} /><span><strong>Private accounts</strong> Only you can see and use your accounts.</span></li>
            </ul>
          </div>
          <div className="security-visual" aria-hidden="true">
            <div className="shield"><ShieldCheck size={72} /></div>
          </div>
        </div>
      </section>

      {/* ---------- Call to action ---------- */}
      <section className="cta">
        <div>
          <h2>Ready to start banking with Simple Bank?</h2>
          <p>Enroll online in minutes and open your first account today.</p>
        </div>
        <Link to={user ? homePath(user) : "/signup"} className="btn btn-primary btn-lg">
          {user ? "Go to my accounts" : "Enroll now"} <ArrowRight size={18} />
        </Link>
      </section>

      <p className="fine-print">
        *Rates and fees shown are illustrative for this training project. Simple Bank is not a real bank.
      </p>
    </div>
  );
}
