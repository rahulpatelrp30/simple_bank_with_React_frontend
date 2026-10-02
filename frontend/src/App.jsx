import { CircleHelp, CirclePlus, Landmark, LayoutDashboard, Lock, LogOut, MapPin, ShieldCheck } from "lucide-react";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";

import { AuthProvider, homePath, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AccountDetails from "./pages/AccountDetails";
import AdminCustomer from "./pages/AdminCustomer";
import AdminDashboard from "./pages/AdminDashboard";
import AmountForm from "./pages/AmountForm";
import CreateAccount from "./pages/CreateAccount";
import CustomerDashboard from "./pages/CustomerDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Transactions from "./pages/Transactions";
import Welcome from "./pages/Welcome";

// Thin dark bar at the very top, like most bank websites
function UtilityBar() {
  return (
    <div className="utility-bar">
      <div className="utility-inner">
        <nav className="utility-left" aria-label="Segments">
          <span className="active">Personal</span>
          <span>Small Business</span>
          <span>Commercial</span>
        </nav>
        <div className="utility-right">
          <span><MapPin size={14} /> ATM &amp; Branch</span>
          <span><CircleHelp size={14} /> Help &amp; Support</span>
          <span className="secure"><Lock size={13} /> Secure site</span>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    navigate("/", { replace: true }); // go to the homepage first, then sign off
    await logout();
  }

  return (
    <header className="site-header">
      <UtilityBar />
      <div className="site-header-inner">
        <Link to={user ? homePath(user) : "/"} className="brand">
          <span className="brand-mark"><Landmark size={20} /></span>
          <span className="brand-text">Simple<strong>Bank</strong></span>
        </Link>

        {user ? (
          <nav className="main-nav">
            {isAdmin ? (
              <NavLink to="/admin" className="main-nav-item">
                <ShieldCheck size={17} /> Admin Dashboard
              </NavLink>
            ) : (
              <>
                <NavLink to="/dashboard" className="main-nav-item">
                  <LayoutDashboard size={17} /> Accounts
                </NavLink>
                <NavLink to="/create" className="main-nav-item">
                  <CirclePlus size={17} /> Open an Account
                </NavLink>
              </>
            )}
          </nav>
        ) : (
          <nav className="main-nav">
            <a href="/#products" className="main-nav-item">Banking</a>
            <a href="/#rates" className="main-nav-item">Rates</a>
            <a href="/#how" className="main-nav-item">How It Works</a>
            <a href="/#security" className="main-nav-item">Security</a>
          </nav>
        )}

        <div className="header-actions">
          {user ? (
            <>
              <span className={`avatar ${isAdmin ? "avatar-admin" : ""}`}>
                {(user.firstName[0] + (user.lastName[0] || "")).toUpperCase()}
              </span>
              <span className="header-user">
                <strong>{user.firstName} {user.lastName}</strong>
                <small>{isAdmin ? "Administrator" : user.email}</small>
              </span>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                <LogOut size={15} /> Sign Off
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="btn btn-outline btn-sm hide-sm">Open an Account</Link>
              <Link to="/login" className="btn btn-primary btn-sm"><Lock size={15} /> Sign On</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="brand brand-light">
            <span className="brand-mark"><Landmark size={20} /></span>
            <span className="brand-text">Simple<strong>Bank</strong></span>
          </span>
          <p>Everyday banking made simple: open accounts, move money and track every transaction from one secure place.</p>
        </div>
        <div className="footer-col">
          <h4>Banking</h4>
          <span>Simple Savings</span>
          <span>Simple Current</span>
          <span>Credit Cards</span>
          <span>Home Loans</span>
        </div>
        <div className="footer-col">
          <h4>Help &amp; Support</h4>
          <span>Contact Us</span>
          <span>ATM &amp; Branch Locator</span>
          <span>FAQs</span>
          <span>Report Fraud</span>
        </div>
        <div className="footer-col">
          <h4>About</h4>
          <span>About Simple Bank</span>
          <span>Security Center</span>
          <span>Privacy</span>
          <span>Terms of Use</span>
        </div>
      </div>
      <div className="footer-legal">
        <p>
          Simple Bank is a training project built with React, FastAPI and MongoDB. It is not a real bank:
          no real money is held, deposits are not insured, and rates shown are for illustration only.
        </p>
        <p>&copy; {new Date().getFullYear()} Simple Bank. All rights reserved.</p>
      </div>
    </footer>
  );
}

function NotFound() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div className="card forbidden">
        <h1>404</h1>
        <p className="muted">We couldn't find that page.</p>
        <Link to={user ? homePath(user) : "/"} className="btn btn-primary">Back to safety</Link>
      </div>
    </div>
  );
}

// Any logged-in user
const loggedIn = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
// Only customers
const customerOnly = (page) => <ProtectedRoute role="CUSTOMER">{page}</ProtectedRoute>;
// Only the admin
const adminOnly = (page) => <ProtectedRoute role="ADMIN">{page}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="container">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Customer */}
            <Route path="/dashboard" element={customerOnly(<CustomerDashboard />)} />
            <Route path="/create" element={customerOnly(<CreateAccount />)} />

            {/* Customer (own accounts) or admin (any account) */}
            <Route path="/accounts/:id" element={loggedIn(<AccountDetails />)} />
            <Route path="/accounts/:id/deposit" element={loggedIn(<AmountForm key="deposit" type="deposit" />)} />
            <Route path="/accounts/:id/withdraw" element={loggedIn(<AmountForm key="withdraw" type="withdraw" />)} />
            <Route path="/accounts/:id/transactions" element={loggedIn(<Transactions />)} />

            {/* Admin */}
            <Route path="/admin" element={adminOnly(<AdminDashboard />)} />
            <Route path="/admin/customers/:id" element={adminOnly(<AdminCustomer />)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
