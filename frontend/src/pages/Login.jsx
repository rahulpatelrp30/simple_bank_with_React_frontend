import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { homePath, useAuth } from "../AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Field, PasswordInput } from "../components/Field";
import usePageTitle from "../components/usePageTitle";

export default function Login() {
  usePageTitle("Sign On");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homePath(user)} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedIn = await login(username, password);
      navigate(homePath(loggedIn)); // admin -> /admin, customer -> /dashboard
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign on with your email and password.">
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Field label="Email" icon={Mail}>
          <input type="email" required autoComplete="email" placeholder="you@example.com"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Password" icon={Lock}>
          <PasswordInput required autoComplete="current-password" placeholder="Enter your password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? "Signing on..." : "Sign On"}
        </button>
      </form>

      <p className="switch">
        New to Simple Bank? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
