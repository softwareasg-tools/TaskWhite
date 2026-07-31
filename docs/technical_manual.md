# TaskWhite.com Technical Manual

## 1. System Architecture
### Objective
To define the high-level design and structural components of the TaskWhite application.
### Description
TaskWhite is built on a monolithic Node.js architecture utilizing Express for routing and HTTP request handling. The frontend is server-rendered using EJS templating and styled with Bootstrap 5. It interfaces with a local SQLite database using the Sequelize Object-Relational Mapper (ORM).
### Procedures
Review system architecture diagrams for integration touchpoints. Developers must understand the monolithic flow before implementing new features.
### Examples
User Request -> Nginx (Reverse Proxy) -> PM2 (Process Manager) -> Node.js/Express App -> Sequelize ORM -> SQLite Database.
### Expected Results
A clear, maintainable data flow from client request to the database layer, ensuring high cohesion and low coupling where possible.
### Troubleshooting
Check Nginx and PM2 logs if architectural components fail to communicate or if 502 Bad Gateway errors appear.
### References
- [Express Architecture Guide](#)

## 2. Platform Overview
### Objective
To provide a comprehensive summary of the TaskWhite platform's capabilities and business purpose.
### Description
TaskWhite is a robust task management platform featuring task tracking, team collaboration, and client management. It also features advanced AI task generation capabilities to streamline workflow creation.
### Procedures
Navigate to the platform root URL to access the main dashboard and verify core modules (Tasks, Team, Clients).
### Examples
A dashboard displaying ongoing tasks, assigned team members, client details, and available workflow templates.
### Expected Results
Users can efficiently manage tasks, allocate team resources, and track client deliverables from a centralized interface.
### Troubleshooting
If the platform dashboard is inaccessible or fails to render, verify the server deployment status and template syntax.
### References
- Internal Product Wiki (**Assumption**)

## 3. Technology Stack
### Objective
To explicitly detail the software stack used in both development and production environments.
### Description
- **Backend:** Node.js, Express
- **Database:** SQLite (with `connect-sqlite3` for session storage), Sequelize ORM
- **Frontend:** EJS templating, Bootstrap 5
### Procedures
Ensure all developers install the specified Node.js version and synchronize their local environment with `package.json`.
### Examples
```bash
npm install express sequelize sqlite3 ejs passport
```
### Expected Results
A uniform development and production environment minimizing "works on my machine" issues.
### Troubleshooting
Resolve version conflicts by wiping `node_modules` and utilizing `package-lock.json` for deterministic installs.
### References
- `package.json` file in the project root.

## 4. Infrastructure Overview
### Objective
To describe the hosting, proxying, and process management environment.
### Description
The application is hosted on a server utilizing Nginx as a reverse proxy. Express is configured with `trust proxy=1` to correctly parse IP addresses and protocols. PM2 is used for robust Node.js process management and daemonization.
### Procedures
Deploy the app using PM2 ecosystem configuration files and standard Nginx server blocks.
### Examples
```bash
pm2 start ecosystem.config.js
```
### Expected Results
High availability, automatic process restarts on failure, and efficient static asset routing via Nginx.
### Troubleshooting
Run `pm2 status` and `pm2 logs` to check infrastructure health. Verify Nginx configuration with `nginx -t`.
### References
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

## 5. Security Architecture
### Objective
To outline the security measures protecting the platform from common web vulnerabilities.
### Description
Application security is enforced via Helmet (Note: Content Security Policy is explicitly disabled), `express-rate-limit` to prevent brute-force attacks, and secure session cookies configured for 30 days, `httpOnly`, and `SameSite=Lax`.
### Procedures
Review Helmet middleware and rate limiter configurations within the Express initialization file.
### Examples
```javascript
app.use(helmet({ contentSecurityPolicy: false }));
```
### Expected Results
Protection against cross-site scripting (XSS), cross-site request forgery (CSRF), and denial of service (DoS) attempts.
### Troubleshooting
If legitimate API requests are blocked, tune rate limiter thresholds or IP whitelists.
### References
- [Helmet.js Documentation](https://helmetjs.github.io/)

## 6. Authentication
### Objective
To securely manage user identity verification and login processes.
### Description
Authentication is handled by Passport.js supporting three main strategies: Local authentication using bcrypt for password hashing, Google OAuth, and Microsoft OAuth for SSO.
### Procedures
Configure Passport strategies with respective API keys and client secrets securely stored in environment variables.
### Examples
Login initiation via endpoints like `/auth/google`, `/auth/microsoft`, or `POST /auth/local`.
### Expected Results
Users are securely authenticated, and a cryptographic session is established and stored in the SQLite session table.
### Troubleshooting
If OAuth fails, check redirect URIs in the Google Cloud or Microsoft Azure developer consoles to ensure they match the production domain.
### References
- [Passport.js Documentation](http://www.passportjs.org/)

## 7. Authorization
### Objective
To enforce access control based on the verified user identity.
### Description
Ensures authenticated users can only access resources they are permitted to view or modify. Route-level middleware intercepts requests to validate session state.
### Procedures
Apply authentication middleware to protected routes to check session validity before route controller execution.
### Examples
```javascript
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}
```
### Expected Results
Unauthorized users are swiftly redirected to the login page without exposing sensitive data.
### Troubleshooting
Clear cookies and session storage in the database if authorization states become stale or corrupted.
### References
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

## 8. Roles & Permissions (**Assumption**)
### Objective
To define granular actions that different user roles can perform within the system.
### Description
**Assumption:** The system operates on a Role-Based Access Control (RBAC) model supporting 'Admin' and 'Member' roles. Admins manage billing, workspace settings, and user invites. Members manage tasks, clients, and standard operations.
### Procedures
Assign or update roles during user creation or via the workspace admin dashboard. Evaluate roles in middleware.
### Examples
Admin creating a platform-wide task template vs. a Member applying a template to a specific client project.
### Expected Results
Proper segregation of duties preventing privilege escalation.
### Troubleshooting
Verify the `role` column in the Users table if a user cannot perform an expected action.
### References
- RBAC Design Document (**Assumption**)

## 9. Database Overview (SQLite)
### Objective
To manage persistent data storage and relational data structures.
### Description
TaskWhite relies on SQLite for a lightweight, file-based relational database, managed via the Sequelize ORM. User sessions are persisted using the `connect-sqlite3` adapter.
### Procedures
Execute migrations and seeders using the Sequelize CLI to update the database schema synchronously across environments.
### Examples
```bash
npx sequelize-cli db:migrate
```
### Expected Results
Schema changes are reliably applied to the `.sqlite` file, maintaining data integrity and relationships.
### Troubleshooting
Check file and directory permissions if SQLite throws `SQLITE_CANTOPEN` or `SQLITE_READONLY` errors.
### References
- [Sequelize Documentation](https://sequelize.org/)

## 10. API Documentation
### Objective
To provide a clear reference for interacting with the backend programmatically.
### Description
The internal RESTful API serves JSON responses to power front-end dynamic interactions and potential integrations. 
### Procedures
Consult the specific route controllers in the source code or Postman collections to understand payload requirements.
### Examples
Fetching the latest team activity via AJAX calls.
### Expected Results
Consistent, predictable, and fully documented data retrieval for the client side.
### Troubleshooting
Use API clients like Postman or Insomnia to isolate backend API issues from frontend JavaScript bugs.
### References
- Internal API Routes Specification

## 11. API Authentication
### Objective
To secure all exposed API endpoints against unauthorized access.
### Description
Unlike token-based (JWT) stateless APIs, the TaskWhite API relies on the stateful session cookie established during the Passport.js login process.
### Procedures
Ensure the frontend HTTP client includes credentials (cookies) in all AJAX/Fetch requests.
### Examples
```javascript
fetch('/api/tasks', { credentials: 'same-origin' })
```
### Expected Results
Endpoints reject unauthenticated or expired-session requests with a `401 Unauthorized` HTTP status code.
### Troubleshooting
Ensure the frontend domain and backend domain configurations allow cookies to be passed (check `SameSite` cookie attributes).
### References
- [MDN Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 12. Endpoints (Tasks, Team, Clients)
### Objective
To define the core API routing architecture.
### Description
- `/api/tasks`: CRUD operations for task management.
- `/api/team`: Endpoints to invite, remove, or list team members.
- `/api/clients`: Manage client CRM records.
- `/api/templates`: Fetch and modify reusable task templates.
- `/api/ai/generate-tasks`: Trigger generative AI to create task lists from prompts.
### Procedures
Send standard HTTP methods (GET, POST, PUT, DELETE) to these routes with appropriate JSON payloads.
### Examples
`GET /api/clients` returns a JSON array of all registered clients for the active workspace.
### Expected Results
Appropriate JSON payload or success status code returned.
### Troubleshooting
Check route parameters and request body parsing (e.g., `express.json()`) if a `404` or `400` is returned.
### References
- [Express Router Documentation](https://expressjs.com/en/4x/api.html#router)

## 13. Request/Response Examples
### Objective
To illustrate standard data formats for API communication.
### Description
Provides explicit shapes and schemas for incoming requests and outgoing responses to ensure frontend/backend contract alignment.
### Procedures
Format payloads strictly according to these schemas.
### Examples
**Request:** `POST /api/tasks`
```json
{
  "title": "Onboard new client",
  "clientId": 42,
  "dueDate": "2026-08-01"
}
```
**Response:** `201 Created`
```json
{
  "id": 105,
  "title": "Onboard new client",
  "status": "pending"
}
```
### Expected Results
Successful data binding and state updates on the client side.
### Troubleshooting
Validate JSON syntax and data types if a `400 Bad Request` or validation error is returned by Sequelize.
### References
- JSON Specification

## 14. Webhooks (**Assumption**)
### Objective
To push real-time event updates to external systems.
### Description
**Assumption:** The system dispatches outbound HTTP webhooks on critical events, such as task completion or new client registration.
### Procedures
Register callback URLs in the platform settings. The backend will POST event payloads to these URLs.
### Examples
Payload sent to `https://customer-crm.com/webhook` when a task changes status to "Done".
### Expected Results
External systems are synchronized in near real-time without polling.
### Troubleshooting
Check internal webhook dispatch logs for delivery failures, timeouts, or non-200 responses from the receiving server.
### References
- Webhook Implementation Guide (**Assumption**)

## 15. Integrations
### Objective
To connect TaskWhite with essential third-party services.
### Description
The platform natively integrates with Google and Microsoft for OAuth Authentication, and leverages third-party Large Language Model APIs (e.g., OpenAI) for the `/api/ai/generate-tasks` endpoint.
### Procedures
Configure API keys, client IDs, and secrets securely in the production `.env` file.
### Examples
Configuring the OpenAI API key to enable generative features.
### Expected Results
Seamless interoperability with external identity providers and AI tools.
### Troubleshooting
Verify API quotas, billing status, and key validity if third-party integrations fail abruptly.
### References
- Google Cloud Console, Microsoft Azure AD, OpenAI API Docs.

## 16. Configuration (.env)
### Objective
To manage environment-specific variables securely outside of the codebase.
### Description
Stores secrets, database paths, proxy settings, and API keys. The file is excluded from version control.
### Procedures
Create a `.env` file in the root directory based on the provided `.env.example` template.
### Examples
```env
PORT=3000
SESSION_SECRET=super_secure_random_string
GOOGLE_CLIENT_ID=...
```
### Expected Results
The application boots correctly, loading secrets into `process.env`.
### Troubleshooting
Ensure the `dotenv` package is loaded at the very top of the entry file (e.g., `require('dotenv').config()`).
### References
- [dotenv Documentation](https://www.npmjs.com/package/dotenv)

## 17. Deployment Considerations (PM2/Nginx)
### Objective
To safely and reliably deploy the application to a production server environment.
### Description
Nginx routes internet traffic (ports 80/443) to the internal Node.js port (e.g., 3000) managed by PM2. `trust proxy=1` must be configured in Express since Nginx acts as a reverse proxy.
### Procedures
Configure an Nginx server block with `proxy_pass` directives, install SSL certificates, and start the app with PM2.
### Examples
```bash
pm2 start app.js --name "taskwhite_prod" --env production
```
### Expected Results
The application is securely accessible via a public domain over HTTPS with process daemonization.
### Troubleshooting
Check Nginx error logs (`/var/log/nginx/error.log`) if users experience 502 Bad Gateway issues.
### References
- Nginx Reverse Proxy Guide

## 18. Scalability
### Objective
To ensure the application can handle increasing user loads over time.
### Description
Node.js runs on a single thread. To scale vertically, PM2 can run the application in cluster mode, spawning a process for each CPU core. 
### Procedures
Start PM2 with the cluster flag.
### Examples
```bash
pm2 start app.js -i max
```
### Expected Results
Improved concurrent request handling by utilizing all available server resources.
### Troubleshooting
Because SQLite is file-based, concurrency writes might lock the database (`SQLITE_BUSY`). Scalability limits are heavily bound by SQLite's concurrent write limitations.
### References
- Node.js Cluster Module

## 19. Performance
### Objective
To guarantee fast response times and low latency for end users.
### Description
Performance is optimized via strategic SQLite indexing, EJS template caching in production mode, and static asset minification (Bootstrap).
### Procedures
Ensure Express is running in production mode, which automatically caches views. Add indexes to frequently queried Sequelize models.
### Examples
Setting `NODE_ENV=production` ensures Express enables internal optimizations.
### Expected Results
Reduced Time to First Byte (TTFB) and snappy UI rendering.
### Troubleshooting
Monitor query execution times in Sequelize logging; if slow, add composite indexes to the SQLite tables.
### References
- [Express Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## 20. Monitoring
### Objective
To actively track system health, uptime, and performance metrics.
### Description
System health is monitored primarily using PM2's built-in monitoring tools and Nginx access logs.
### Procedures
Use the PM2 terminal dashboard for live metrics or connect to PM2 Plus for remote monitoring.
### Examples
```bash
pm2 monit
```
### Expected Results
Real-time visibility into memory consumption and CPU usage per Node process.
### Troubleshooting
Investigate specific processes consuming excessive memory (memory leaks) and restart them gracefully.
### References
- [PM2 Monitoring Guide](https://pm2.keymetrics.io/docs/usage/monitoring/)

## 21. Logging (PM2 logs)
### Objective
To record application events, warnings, and errors for auditing and debugging.
### Description
All standard output (`stdout`) and standard error (`stderr`) generated by the Node.js application are captured automatically by PM2.
### Procedures
View logs via the PM2 CLI and ensure a log rotation strategy is in place.
### Examples
```bash
pm2 logs taskwhite_prod
```
### Expected Results
A comprehensive, timestamped audit trail of application behavior and stack traces.
### Troubleshooting
Install the `pm2-logrotate` module to prevent log files from exhausting server disk space over time.
### References
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)

## 22. Backup & Recovery (SQLite backups)
### Objective
To prevent data loss in the event of hardware failure or human error.
### Description
Requires regular, automated backups of the SQLite database file (`database.sqlite`) and any user-uploaded assets.
### Procedures
Set up cron jobs on the host server to copy the SQLite file securely to off-site storage.
### Examples
```bash
# Example cron job script
sqlite3 /path/to/database.sqlite ".backup '/backups/db-$(date +%F).sqlite'"
```
### Expected Results
Reliable restoration points available to roll back data corruption or accidental deletions.
### Troubleshooting
Ensure you use the SQLite `.backup` command rather than a simple `cp` command to avoid copying a locked or partially written database.
### References
- [SQLite Backup API](https://www.sqlite.org/backup.html)

## 23. Disaster Recovery
### Objective
To restore service rapidly after a critical failure or catastrophic event.
### Description
Outlines the steps to provision a new server, deploy the codebase, and restore the latest SQLite database backup.
### Procedures
Execute automated server provisioning scripts (**Assumption**) or manually reconfigure the Nginx/PM2 stack.
### Examples
Spinning up a new VPS, cloning the Git repository, running `npm install`, and pulling the latest backup from AWS S3.
### Expected Results
Minimal Recovery Time Objective (RTO) and Recovery Point Objective (RPO).
### Troubleshooting
Test the disaster recovery procedures quarterly in a staging environment to ensure backup integrity.
### References
- Disaster Recovery Plan Document (**Assumption**)

## 24. Compliance (**Assumption**)
### Objective
To adhere to legal, industry, and regulatory standards.
### Description
**Assumption:** The platform is compliant with standard data protection regulations (e.g., GDPR, CCPA) regarding user consent and data deletion rights.
### Procedures
Provide users a self-service mechanism in the UI to delete their accounts, which triggers a cascade deletion of their data in SQLite.
### Examples
```sql
DELETE FROM Users WHERE id = :userId; -- Cascades to tasks, clients, etc.
```
### Expected Results
Data minimization, regulatory compliance, and avoidance of legal penalties.
### Troubleshooting
Audit the database periodically to ensure orphaned records (e.g., tasks with no users) are properly cleaned up.
### References
- GDPR/CCPA Guidelines

## 25. Privacy
### Objective
To fiercely protect user data and sensitive information.
### Description
Passwords are irreversibly hashed via `bcrypt`. Session cookies are secured with `httpOnly` (preventing XSS access), `SameSite=Lax` (preventing CSRF), and expire after 30 days.
### Procedures
Enforce HTTPS at the Nginx level for all traffic to ensure data in transit is encrypted.
### Examples
Nginx `301` redirect server block from port 80 to 443.
### Expected Results
Data in transit and at rest is protected against interception and unauthorized access.
### Troubleshooting
Check the browser console and network tab for mixed content warnings or insecure cookie flags.
### References
- [OWASP Privacy Risks](https://owasp.org/)

## 26. Security Best Practices
### Objective
To maintain a proactively hardened application over its lifecycle.
### Description
Involves regular NPM dependency updates, minimal server exposure, and strict proxy configurations.
### Procedures
Run `npm audit` regularly to detect vulnerabilities in third-party packages.
### Examples
```bash
npm audit fix
```
### Expected Results
A drastically reduced vulnerability surface area and mitigation of zero-day exploits.
### Troubleshooting
If a minor package update breaks the build, rollback via Git, investigate the breaking change, and apply alternative patches.
### References
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 27. Error Handling
### Objective
To gracefully manage application faults without degrading user experience or leaking system details.
### Description
A global error handling middleware in Express catches unhandled exceptions and promise rejections.
### Procedures
Define a 4-arity middleware in the Express app (must take `err, req, res, next`) at the end of the middleware chain.
### Examples
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});
```
### Expected Results
End users see a friendly error page instead of raw stack traces or JSON crash dumps.
### Troubleshooting
Check PM2 logs for the original stack trace when users report viewing the generic 500 error page.
### References
- [Express Error Handling Guide](https://expressjs.com/en/guide/error-handling.html)

## 28. Maintenance
### Objective
To perform routine system upkeep ensuring long-term stability.
### Description
Includes database vacuuming (to reclaim unused space in the SQLite file), log rotation, and underlying OS security patching.
### Procedures
Schedule maintenance windows during off-peak hours (e.g., weekends at 2 AM).
### Examples
Running `VACUUM;` on the SQLite database via a cron job to defragment the file.
### Expected Results
Optimal system performance and stable disk utilization over time.
### Troubleshooting
If a maintenance script fails or the database locks for too long during a VACUUM, ensure the application is temporarily paused or put in maintenance mode.
### References
- [SQLite VACUUM documentation](https://www.sqlite.org/lang_vacuum.html)

## 29. Upgrade Procedures
### Objective
To deploy new application versions and features safely with minimal disruption.
### Description
The standard flow involves pulling code from Git, installing new dependencies, running database migrations, and restarting PM2.
### Procedures
Execute the deployment script or CI/CD pipeline step.
### Examples
```bash
git pull origin main
npm ci
npx sequelize-cli db:migrate
pm2 reload taskwhite_prod
```
### Expected Results
Zero-downtime deployment leveraging PM2's graceful reload capabilities.
### Troubleshooting
If the app fails to boot after an upgrade, immediately run `pm2 revert taskwhite_prod` (**Assumption** - depending on PM2 setup) or Git checkout the previous tag.
### References
- [PM2 Graceful Reload](https://pm2.keymetrics.io/docs/usage/cluster-mode/#graceful-reload)

## 30. Troubleshooting Guide
### Objective
To rapidly resolve common platform issues and restore service.
### Description
A compilation of frequent problems, their root causes, and immediate solutions for the infrastructure and app stack.
### Procedures
Identify symptoms from user reports or monitoring alerts and apply the documented fix.
### Examples
- **Symptom:** `502 Bad Gateway` on all pages. 
  - **Fix:** Node process crashed. Check `pm2 logs` and restart Nginx/PM2.
- **Symptom:** Users randomly logged out. 
  - **Fix:** Check if the `connect-sqlite3` session table is full or if the `SESSION_SECRET` was accidentally rotated.
### Expected Results
Reduced Mean Time To Resolution (MTTR) for outages.
### Troubleshooting
If the issue is undocumented or unresolvable within 15 minutes, escalate to Tier 2 support or senior engineering (**Assumption**).
### References
- Internal Support Knowledge Base (**Assumption**)
