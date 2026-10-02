import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { homePath, useAuth } from "../AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Field, PasswordInput } from "../components/Field";
import usePageTitle from "../components/usePageTitle";

const EMPTY = { firstName: "", lastName: "", email: "", password: "" };

export default function Signup() {
  usePageTitle("Sign up");
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homePath(user)} replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It only takes a minute to get started.">
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="First name" icon={User}>
            <input required autoComplete="given-name" placeholder="Rahul"
              value={form.firstName} onChange={update("firstName")} />
          </Field>
          <Field label="Last name" icon={User}>
            <input required autoComplete="family-name" placeholder="Patel"
              value={form.lastName} onChange={update("lastName")} />
          </Field>
        </div>
        <Field label="Email" icon={Mail}>
          <input type="email" required autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Password" icon={Lock} hint="At least 6 characters">
          <PasswordInput required autoComplete="new-password" placeholder="Create a password"
            value={form.password} onChange={update("password")} />
        </Field>
        <Field label="Confirm password" icon={Lock}>
          <PasswordInput required autoComplete="new-password" placeholder="Repeat your password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="switch">
        Already have an account? <Link to="/login">Sign on</Link>
      </p>
    </AuthLayout>
  );
}
