import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";

import { postCustomer } from "../api";
import { Field, PasswordInput } from "./Field";

const EMPTY = { firstName: "", lastName: "", email: "", password: "" };

// Child -> parent: after a customer is created, onCreated(customer) tells the parent,
// so the parent can refresh its list. onCancel closes the form.
export default function AddCustomerForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const customer = await postCustomer(form);
      setForm(EMPTY);
      onCreated(customer);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h3>Add a new customer</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <Field label="First name" icon={User}>
          <input required value={form.firstName} onChange={update("firstName")} placeholder="Priya" />
        </Field>
        <Field label="Last name" icon={User}>
          <input required value={form.lastName} onChange={update("lastName")} placeholder="Shah" />
        </Field>
        <Field label="Email" icon={Mail}>
          <input type="email" required value={form.email} onChange={update("email")} placeholder="priya@example.com" />
        </Field>
        <Field label="Temporary password" icon={Lock} hint="At least 6 characters">
          <PasswordInput required minLength={6} value={form.password} onChange={update("password")} />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Create customer"}
        </button>
      </div>
    </form>
  );
}
