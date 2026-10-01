import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

// A form field with a label, an optional icon and an optional hint below it
export function Field({ label, icon: Icon, prefix, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={`field-control ${Icon || prefix ? "has-icon" : ""}`}>
        {Icon && <Icon size={18} className="field-icon" />}
        {prefix && <span className="field-prefix">{prefix}</span>}
        {children}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

// Password box with a show/hide eye button
export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="field-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </>
  );
}
