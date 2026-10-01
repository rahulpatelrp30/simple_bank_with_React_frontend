import { CirclePlus, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
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

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          Simple Bank
        </Link>

        {user ? (
          <>
            <nav className="nav-main">
              {isAdmin ? (
                <NavLink to="/admin" className="nav-item">
                  <ShieldCheck size={18} /> Admin Dashboard
                </NavLink>
              ) : (
                <>
                  <NavLink to="/dashboard" className="nav-item">
                    <LayoutDashboard size={18} /> Dashboard
                  </NavLink>
                  <NavLink to="/create" className="nav-item">
                    <CirclePlus size={18} /> Open Account
                  </NavLink>
                </>
              )}
            </nav>

            <div className="nav-user">
              <span className={`avatar ${isAdmin ? "avatar-admin" : ""}`}>
                {(user.firstName[0] + (user.lastName[0] || "")).toUpperCase()}
              </span>
              <span className="nav-user-text">
                <strong>{user.firstName} {user.lastName}</strong>
                <small>{isAdmin ? "Administrator" : `@${user.username}`}</small>
              </span>
              <button type="button" className="icon-button" onClick={handleLogout} title="Log out">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <nav className="nav-auth">
            <Link to="/login" className="nav-item">Log in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
          </nav>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>&copy; {new Date().getFullYear()} Simple Bank. All rights reserved.</span>
        <span>Built with React, FastAPI and MongoDB</span>
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
