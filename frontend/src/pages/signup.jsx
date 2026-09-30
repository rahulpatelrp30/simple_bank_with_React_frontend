import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../AuthContext";

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Sign up</h1>
      <p className="muted">Create your Simple Bank login.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Confirm Password
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>

      <p className="switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}