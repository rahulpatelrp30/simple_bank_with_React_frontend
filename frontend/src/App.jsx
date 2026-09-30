import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import AccountDetails from "./pages/AccountDetails";
import AmountForm from "./pages/AmountForm";
import CreateAccount from "./pages/CreateAccount";
import Home from "./pages/Home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Transactions from "./pages/Transactions";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <Link to="/" className="logo">Simple Bank</Link>
      <nav className="nav">
        {user ? (
          <>
            <span className="nav-user">Hi, {user.name}</span>
            <button type="button" className="nav-button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/signup" className="nav-link">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}

const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={protect(<Home />)} />
            <Route path="/create" element={protect(<CreateAccount />)} />
            <Route path="/accounts/:id" element={protect(<AccountDetails />)} />
            <Route path="/accounts/:id/deposit" element={protect(<AmountForm key="deposit" type="deposit" />)} />
            <Route path="/accounts/:id/withdraw" element={protect(<AmountForm key="withdraw" type="withdraw" />)} />
            <Route path="/accounts/:id/transactions" element={protect(<Transactions />)} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}