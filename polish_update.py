# Simple Bank update: email + password sign on (no username on screens),
# Sign Off fix, bank wording, and the centered / smooth design polish.
# Run from the Project folder:  python polish_update.py
import os

EDITS = {
    # ---------------- Backend ----------------
    "restapi/schemas.py": [
        ("from typing import Literal\n", "from typing import Literal, Optional\n"),
        ('    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")\n',
         '    username: Optional[str] = Field(None, min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")  # optional: made from the email\n'),
        ("class LoginRequest(BaseModel):\n    username: str  # username or email\n    password: str\n",
         "class LoginRequest(BaseModel):\n    email: Optional[str] = None\n    username: Optional[str] = None  # still accepted, for Swagger and Postman\n    password: str\n"),
    ],
    "restapi/services.py": [
        ("import os\nfrom datetime", "import os\nimport re\nfrom datetime"),
        ("    def register_customer(self, first_name, last_name, username, email, password):\n"
         "        username = username.strip().lower()\n"
         "        email = email.strip().lower()\n",
         "    def _username_from_email(self, email: str) -> str:\n"
         "        \"\"\"Builds a username from the email, e.g. rahul.patel@x.com -> rahul.patel (or rahul.patel2).\"\"\"\n"
         "        base = re.sub(r\"[^a-z0-9_.]\", \"\", email.split(\"@\")[0].lower())[:24] or \"user\"\n"
         "        if len(base) < 3:\n"
         "            base += \"user\"\n"
         "        candidate, n = base, 1\n"
         "        while candidate == ADMIN_USERNAME or self.user_repo.find_by_username(candidate):\n"
         "            n += 1\n"
         "            candidate = f\"{base}{n}\"\n"
         "        return candidate\n"
         "\n"
         "    def register_customer(self, first_name, last_name, username, email, password):\n"
         "        email = email.strip().lower()\n"
         "        # Customers sign up with email only; a username is created for them automatically\n"
         "        username = username.strip().lower() if username else self._username_from_email(email)\n"),
        ('raise UnauthorizedError("Invalid username or password")', 'raise UnauthorizedError("Invalid email or password")'),
    ],
    "restapi/controllers.py": [
        ("    token, user = auth_service.login(body.username, body.password)\n",
         "    token, user = auth_service.login(body.email or body.username or \"\", body.password)\n"),
    ],
    "restapi/Simple_Bank_API_JWT.postman_collection.json": [
        ("Invalid username or password", "Invalid email or password"),
    ],
    # ---------------- Frontend ----------------
    "frontend/src/api.js": [
        ('export const loginRequest = (username, password) => post("/auth/login", { username, password });',
         'export const loginRequest = (email, password) => post("/auth/login", { email, password });'),
    ],
    "frontend/src/App.jsx": [
        ('<small>{isAdmin ? "Administrator" : `@${user.username}`}</small>',
         '<small>{isAdmin ? "Administrator" : user.email}</small>'),
        ("  async function handleLogout() {\n    await logout();\n    navigate(\"/\");\n  }\n",
         "  async function handleLogout() {\n    navigate(\"/\", { replace: true }); // go to the homepage first, then sign off\n    await logout();\n  }\n"),
    ],
    "frontend/src/pages/CustomerDashboard.jsx": [
        ("Signed on as <strong>@{user.username}</strong>.", "Signed on as <strong>{user.email}</strong>."),
        ('<strong className="text-in">+{money(data.moneyIn)}</strong>',
         '<strong className="text-in">{data.moneyIn > 0 ? "+" : ""}{money(data.moneyIn)}</strong>'),
        ('<strong className="text-out">-{money(data.moneyOut)}</strong>',
         '<strong className="text-out">{data.moneyOut > 0 ? "-" : ""}{money(data.moneyOut)}</strong>'),
    ],
    "frontend/src/pages/Welcome.jsx": [
        ("  ArrowRight, Briefcase, CircleCheck, Clock, CreditCard, House, KeyRound, Lock,\n"
         "  PiggyBank, ShieldCheck, User, UserPlus, Wallet,\n",
         "  ArrowRight, Briefcase, CircleCheck, Clock, CreditCard, House, KeyRound, Lock, Mail,\n"
         "  PiggyBank, ShieldCheck, UserPlus, Wallet,\n"),
        ('      <Field label="Username" icon={User}>\n'
         '        <input type="text" required autoComplete="username" placeholder="Username or email"\n',
         '      <Field label="Email" icon={Mail}>\n'
         '        <input type="email" required autoComplete="email" placeholder="you@example.com"\n'),
        ("<span>Forgot username or password?</span>", "<span>Forgot your password?</span>"),
    ],
    "frontend/src/pages/Login.jsx": [
        ('import { Lock, User } from "lucide-react";', 'import { Lock, Mail } from "lucide-react";'),
        ('usePageTitle("Log in");', 'usePageTitle("Sign On");'),
        ('subtitle="Log in with your username and password."', 'subtitle="Sign on with your email and password."'),
        ('        <Field label="Username" icon={User} hint="You can also use your email address">\n'
         '          <input type="text" required autoComplete="username" placeholder="your username"\n',
         '        <Field label="Email" icon={Mail}>\n'
         '          <input type="email" required autoComplete="email" placeholder="you@example.com"\n'),
        ('{loading ? "Logging in..." : "Log in"}', '{loading ? "Signing on..." : "Sign On"}'),
    ],
    "frontend/src/pages/Signup.jsx": [
        ('import { AtSign, Lock, Mail, User } from "lucide-react";', 'import { Lock, Mail, User } from "lucide-react";'),
        ('const EMPTY = { firstName: "", lastName: "", username: "", email: "", password: "" };',
         'const EMPTY = { firstName: "", lastName: "", email: "", password: "" };'),
        ("    if (form.username.trim().toLowerCase() === \"admin\") {\n"
         "      setError('The username \"admin\" is reserved');\n"
         "      return;\n"
         "    }\n", ""),
        ('        <Field label="Username" icon={AtSign} hint="Letters, numbers, dots and underscores">\n'
         '          <input required minLength={3} autoComplete="username" placeholder="rahul"\n'
         '            value={form.username} onChange={update("username")} />\n'
         '        </Field>\n', ""),
        ('Already have an account? <Link to="/login">Log in</Link>', 'Already have an account? <Link to="/login">Sign on</Link>'),
    ],
    "frontend/src/components/AddCustomerForm.jsx": [
        ('import { AtSign, Lock, Mail, User } from "lucide-react";', 'import { Lock, Mail, User } from "lucide-react";'),
        ('const EMPTY = { firstName: "", lastName: "", username: "", email: "", password: "" };',
         'const EMPTY = { firstName: "", lastName: "", email: "", password: "" };'),
        ("    if (form.username.trim().toLowerCase() === \"admin\") {\n"
         "      setError('The username \"admin\" is reserved');\n"
         "      return;\n"
         "    }\n", ""),
        ('        <Field label="Username" icon={AtSign}>\n'
         '          <input required minLength={3} value={form.username} onChange={update("username")} placeholder="priya" />\n'
         '        </Field>\n', ""),
    ],
    "frontend/src/components/CustomerTable.jsx": [
        ("            <th>Username</th>\n", ""),
        ("              <td>{c.username}</td>\n", ""),
    ],
    "frontend/src/pages/AdminCustomer.jsx": [
        ('import { AtSign, CalendarDays, Crown, Inbox, Mail, Trash2 } from "lucide-react";',
         'import { CalendarDays, Crown, Inbox, Mail, Trash2 } from "lucide-react";'),
        ("            <span><AtSign size={15} /> {customer.username}</span>\n", ""),
    ],
    "frontend/src/pages/Transactions.jsx": [
        ('<strong className="stat-value text-in">+{money(totalIn)}</strong>',
         '<strong className="stat-value text-in">{totalIn > 0 ? "+" : ""}{money(totalIn)}</strong>'),
        ('<strong className="stat-value text-out">-{money(totalOut)}</strong>',
         '<strong className="stat-value text-out">{totalOut > 0 ? "-" : ""}{money(totalOut)}</strong>'),
    ],
}

problems = 0
for path, edits in EDITS.items():
    if not os.path.exists(path):
        print(f"MISSING  {path}")
        problems += 1
        continue
    text = open(path, encoding="utf-8-sig").read()
    original = text
    for old, new in edits:
        if old in text:
            text = text.replace(old, new)
        elif new and new in text:
            pass  # this edit was already made
        elif not new and old not in text:
            pass  # already removed
        else:
            print(f"CHECK    {path}: could not find -> {old.strip()[:60]}")
            problems += 1
    if text != original:
        open(path, "w", encoding="utf-8", newline="\n").write(text)
        print(f"UPDATED  {path}")
    else:
        print(f"OK       {path} (nothing to change)")

POLISH = """

/* ============================================================
   POLISH LAYER: centered layout and smooth interactions
   ============================================================ */
html { scroll-behavior: smooth; scroll-padding-top: 130px; }
::selection { background: rgba(11, 92, 171, 0.18); }
a, button, input, select { transition: color 0.18s, background-color 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.18s; }
:focus-visible { outline: 3px solid rgba(11, 92, 171, 0.35); outline-offset: 2px; }
input:focus-visible, select:focus-visible { outline: none; }

/* Header: navigation centered between the logo and the buttons */
.main-nav { justify-content: center; }

/* Main area: short pages sit in the middle of the screen */
.container { display: flex; flex-direction: column; }
.page { width: 100%; margin: auto; }
.page-wide, .home { width: 100%; }
.auth { width: 100%; margin: auto; }

/* Form pages: centered titles, breadcrumbs and quick amounts */
.page .crumbs { justify-content: center; }
.page > .card { padding: 40px; }
.page > .card > h1, .page > .card > h1 + .muted, .page > .card > h1 + p { text-align: center; }
.page .chips { justify-content: center; }
.page .forbidden .btn { margin: 0 auto; }

/* Smooth page entrance */
.page, .page-wide, .auth, .home { animation: fadeUp 0.45s cubic-bezier(0.2, 0.7, 0.2, 1); }

/* Wide pages: clean title area */
.page-head { padding-bottom: 18px; border-bottom: 1px solid var(--border); }

/* Panels and tables */
.panel { border-radius: 16px; transition: box-shadow 0.25s; }
.panel:hover { box-shadow: 0 10px 28px rgba(10, 42, 79, 0.08); }
tbody tr:nth-child(even) { background: #fafbfd; }
.loader { margin: 120px auto; }

/* Footer: centered legal text */
.footer-legal { text-align: center; }
"""

css_path = "frontend/src/index.css"
if os.path.exists(css_path):
    css = open(css_path, encoding="utf-8-sig").read()
    if "POLISH LAYER" in css:
        print(f"OK       {css_path} (polish styles already added)")
    elif "BANK THEME" not in css:
        print(f"CHECK    {css_path}: the bank design styles are missing. Run the 5 bank design blocks first.")
        problems += 1
    else:
        open(css_path, "a", encoding="utf-8", newline="\n").write(POLISH)
        print(f"UPDATED  {css_path} (polish styles added)")

print()
print("All done!" if problems == 0 else f"Finished with {problems} item(s) to check. Paste this output to get help.")
