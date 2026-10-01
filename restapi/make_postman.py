import json

def req(name, method, path, body=None, tests=None, desc="", auth="customer", prereq=None):
    r = {"name": name, "request": {
        "method": method,
        "header": [{"key": "Content-Type", "value": "application/json"}] if body is not None else [],
        "url": {"raw": "{{baseUrl}}" + path, "host": ["{{baseUrl}}"],
                "path": path.split("?")[0].strip("/").split("/")},
        "description": desc}}
    if "?" in path:
        q = path.split("?", 1)[1]
        r["request"]["url"]["query"] = [{"key": kv.split("=")[0], "value": kv.split("=")[1]} for kv in q.split("&")]
    tokens = {"customer": "{{customerToken}}", "admin": "{{adminToken}}", "bad": "not-a-real-token"}
    if auth == "none":
        r["request"]["auth"] = {"type": "noauth"}
    else:
        r["request"]["auth"] = {"type": "bearer", "bearer": [{"key": "token", "value": tokens[auth], "type": "string"}]}
    if body is not None:
        r["request"]["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2), "options": {"raw": {"language": "json"}}}
    ev = []
    if prereq: ev.append({"listen": "prerequest", "script": {"type": "text/javascript", "exec": prereq}})
    if tests: ev.append({"listen": "test", "script": {"type": "text/javascript", "exec": ["(function () {"] + ["    " + t for t in tests] + ["})();"]}})
    if ev: r["event"] = ev
    return r

def st(code, text): return f'pm.test("Status is {code} {text}", () => pm.response.to.have.status({code}));'
def detail(msg): return f'pm.test("Message: {msg}", () => pm.expect(pm.response.json().detail).to.eql("{msg}"));'
J = 'const data = pm.response.json();'

auth = [
    req("1. Customer Sign Up", "POST", "/api/auth/signup",
        {"firstName": "Postman", "lastName": "Tester", "username": "{{username}}", "email": "{{username}}@example.com", "password": "secret123"},
        [st(201, "Created"), J,
         'pm.test("Server returns a CustomerToken", () => pm.expect(data.tokenType).to.eql("CustomerToken"));',
         'pm.test("Role is CUSTOMER", () => pm.expect(data.role).to.eql("CUSTOMER"));',
         'pm.collectionVariables.set("customerToken", data.token);',
         'pm.collectionVariables.set("customerId", data.user.userId);'],
        "Registers a new customer. The server generates a JWT (CustomerToken).", auth="none",
        prereq=['// New username every run so signup never clashes',
                'pm.collectionVariables.set("username", "cust" + Date.now());']),
    req("2. Sign Up With Username admin (should fail)", "POST", "/api/auth/signup",
        {"firstName": "Fake", "lastName": "Admin", "username": "admin", "email": "fake{{$timestamp}}@example.com", "password": "secret123"},
        [st(400, "Bad Request"), detail('The username \\"admin\\" is reserved')],
        'Business rule: only the admin can have the username "admin".', auth="none"),
    req("3. Customer Login", "POST", "/api/auth/login",
        {"username": "{{username}}", "password": "secret123"},
        [st(200, "OK"), J,
         'pm.test("CustomerToken returned", () => pm.expect(data.tokenType).to.eql("CustomerToken"));',
         'pm.collectionVariables.set("customerToken", data.token);'],
        "Logs in with username and password.", auth="none"),
    req("4. Login With Wrong Password (should fail)", "POST", "/api/auth/login",
        {"username": "{{username}}", "password": "wrong-password"},
        [st(401, "Unauthorized"), detail("Invalid username or password")], auth="none"),
    req("5. Admin Login", "POST", "/api/auth/login",
        {"username": "admin", "password": "{{adminPassword}}"},
        [st(200, "OK"), J,
         'pm.test("Server returns an AdminToken", () => pm.expect(data.tokenType).to.eql("AdminToken"));',
         'pm.test("Role is ADMIN", () => pm.expect(data.role).to.eql("ADMIN"));',
         'pm.collectionVariables.set("adminToken", data.token);'],
        "The admin user is created automatically when the API starts.", auth="none"),
    req("6. Get Current User", "GET", "/api/auth/me", None,
        [st(200, "OK"), 'pm.test("Logged in as the customer", () => pm.expect(pm.response.json().role).to.eql("CUSTOMER"));']),
]

customer = [
    req("7. Customer Dashboard (own)", "GET", "/api/customerDashboard/{{customerId}}", None,
        [st(200, "OK"), J, 'pm.test("Dashboard belongs to this customer", () => pm.expect(data.customer.userId).to.eql(Number(pm.collectionVariables.get("customerId"))));']),
    req("8. Create Account", "POST", "/api/accounts", {"accountType": "SAVINGS"},
        [st(201, "Created"), J, 'pm.test("Starts with 0 balance", () => pm.expect(data.balance).to.eql(0));',
         'pm.collectionVariables.set("accountId", data.accountId);']),
    req("9. List My Accounts", "GET", "/api/accounts", None,
        [st(200, "OK"), 'pm.test("Has one account", () => pm.expect(pm.response.json().length).to.eql(1));']),
    req("10. Get Account Details", "GET", "/api/accounts/{{accountId}}", None, [st(200, "OK")]),
    req("11. Deposit Money", "POST", "/api/accounts/{{accountId}}/deposit", {"amount": 15000},
        [st(200, "OK"), 'pm.test("Balance is 15000", () => pm.expect(pm.response.json().balance).to.eql(15000));']),
    req("12. Withdraw Money", "POST", "/api/accounts/{{accountId}}/withdraw", {"amount": 200},
        [st(200, "OK"), 'pm.test("Balance is 14800", () => pm.expect(pm.response.json().balance).to.eql(14800));']),
    req("13. Transaction History", "GET", "/api/accounts/{{accountId}}/transactions", None,
        [st(200, "OK"), 'pm.test("Two transactions", () => pm.expect(pm.response.json().length).to.eql(2));']),
    req("14. Withdraw More Than Balance (should fail)", "POST", "/api/accounts/{{accountId}}/withdraw", {"amount": 999999},
        [st(400, "Bad Request"), detail("Insufficient balance")]),
    req("15. Deposit Negative Amount (should fail)", "POST", "/api/accounts/{{accountId}}/deposit", {"amount": -50},
        [st(400, "Bad Request"), detail("Deposit amount must be positive")]),
]

admin = [
    req("16. Admin Dashboard (AdminToken)", "GET", "/api/admin", None,
        [st(200, "OK"), 'pm.test("Has totals", () => pm.expect(pm.response.json()).to.have.property("totalCustomers"));'],
        "Admin can access /api/admin.", auth="admin"),
    req("17. Admin Dashboard With CustomerToken (should fail)", "GET", "/api/admin", None,
        [st(403, "Forbidden"), detail("Forbidden: admin access only")],
        "A customer cannot access /api/admin and gets 403 Forbidden."),
    req("18. Post Customer", "POST", "/api/admin/customers",
        {"firstName": "Neha", "lastName": "Verma", "username": "{{newUsername}}", "email": "{{newUsername}}@example.com", "password": "secret123"},
        [st(201, "Created"), 'pm.collectionVariables.set("newCustomerId", pm.response.json().customerId);'],
        "Admin creates a customer.", auth="admin",
        prereq=['pm.collectionVariables.set("newUsername", "neha" + Date.now());']),
    req("19. Get All Customers", "GET", "/api/admin/customers", None,
        [st(200, "OK"), J, 'const ids = data.map((c) => c.customerId);',
         'pm.test("Contains both customers", () => {',
         '    pm.expect(ids).to.include(Number(pm.collectionVariables.get("customerId")));',
         '    pm.expect(ids).to.include(Number(pm.collectionVariables.get("newCustomerId")));',
         '});',
         'pm.test("Admin is not listed as a customer", () => pm.expect(data.map((c) => c.username)).to.not.include("admin"));'],
        auth="admin"),
    req("20. Find Customer By First Name", "GET", "/api/admin/customers?firstName=neh", None,
        [st(200, "OK"), J,
         'pm.test("Every result matches the search", () => data.forEach((c) => pm.expect(c.firstName.toLowerCase()).to.include("neh")));',
         'pm.test("Finds the new customer", () => pm.expect(data.map((c) => c.customerId)).to.include(Number(pm.collectionVariables.get("newCustomerId"))));'],
        auth="admin"),
    req("21. Premium Customers", "GET", "/api/admin/customers?premium=true", None,
        [st(200, "OK"), J,
         'pm.test("Every result is premium", () => data.forEach((c) => pm.expect(c.premium).to.be.true));',
         'pm.test("Customer with 14800 is premium", () => pm.expect(data.map((c) => c.customerId)).to.include(Number(pm.collectionVariables.get("customerId"))));'],
        "Premium = total balance of 10,000 or more.", auth="admin"),
    req("22. Get Customer By Id", "GET", "/api/admin/customers/{{customerId}}", None,
        [st(200, "OK"), 'pm.test("Includes accounts", () => pm.expect(pm.response.json().accounts.length).to.eql(1));'],
        auth="admin"),
    req("23. Customer Opens Another Customer's Dashboard (should fail)", "GET", "/api/customerDashboard/{{newCustomerId}}", None,
        [st(403, "Forbidden"), detail("You can only view your own dashboard")]),
    req("24. Admin Opens A Customer's Dashboard", "GET", "/api/customerDashboard/{{customerId}}", None,
        [st(200, "OK")], auth="admin"),
    req("25. Delete Customer", "DELETE", "/api/admin/customers/{{newCustomerId}}", None,
        [st(204, "No Content")], auth="admin"),
    req("26. Get Deleted Customer (should fail)", "GET", "/api/admin/customers/{{newCustomerId}}", None,
        [st(404, "Not Found")], auth="admin"),
]

security = [
    req("27. No Token (should fail)", "GET", "/api/accounts", None,
        [st(401, "Unauthorized"), detail("Please log in")], auth="none"),
    req("28. Invalid Token (should fail)", "GET", "/api/accounts", None,
        [st(401, "Unauthorized")], auth="bad"),
]

collection = {
    "info": {
        "name": "Simple Bank API (JWT + roles)",
        "description": "Start the API with `python -m uvicorn main:app --reload`, then run the whole collection with the Collection Runner.\n\n"
                       "The server generates a JWT on login. The token contains the user's role, so there are two kinds: "
                       "AdminToken and CustomerToken. Requests save them automatically into {{adminToken}} and {{customerToken}}.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "item": [
        {"name": "1. Auth", "item": auth},
        {"name": "2. Customer", "item": customer},
        {"name": "3. Admin (CRUD, search, filter)", "item": admin},
        {"name": "4. Security", "item": security},
    ],
    "variable": [{"key": k, "value": v} for k, v in [
        ("baseUrl", "http://127.0.0.1:8000"), ("adminPassword", "admin123"), ("username", ""),
        ("customerToken", ""), ("adminToken", ""), ("customerId", ""), ("accountId", ""),
        ("newUsername", ""), ("newCustomerId", "")]],
}
json.dump(collection, open("Simple_Bank_API_JWT.postman_collection.json", "w"), indent=2)
print("Created Simple_Bank_API_JWT.postman_collection.json")
