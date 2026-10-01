import { ShieldAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { homePath, useAuth } from "./AuthContext";

// Wrap a page in this to make it "login required".
// Pass role="ADMIN" or role="CUSTOMER" to also limit it to one kind of user.
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader" />;
  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return (
      <div className="page">
        <div className="card forbidden">
          <span className="forbidden-icon"><ShieldAlert size={30} /></span>
          <h1>403 Forbidden</h1>
          <p className="muted">
            Your account doesn't have permission to view this page.
          </p>
          <Link to={homePath(user)} className="btn btn-primary">Go to my dashboard</Link>
        </div>
      </div>
    );
  }

  return children;
}
