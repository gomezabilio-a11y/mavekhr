# HR Employee Portal — TODO

## Employee Portal (Menus 1–7)
- [x] Dashboard (welcome banner, stats cards, announcements, quick links)
- [x] My Information (personal info, employment info, documents tabs)
- [x] My Organization — direct hierarchy path (root → my team) + My Team members from DB
- [x] My Account (password change, login history, connected devices)
- [x] Financial History (salary table, YTD totals)
- [x] Performance Results (score gauge, radar chart, category breakdown)
- [x] Periodic Evaluation (self/peer/manager tasks, progress bar)

## Employee Portal (Menus 8–12 — Coming Soon)
- [x] Leave Management (Coming Soon badge)
- [x] Company Documents (Coming Soon badge)
- [x] Training (Coming Soon badge)
- [x] Announcements (Coming Soon badge)
- [x] Help Desk (Coming Soon badge)

## Backend + DB
- [x] web-db-user upgrade (tRPC + MySQL + Manus Auth)
- [x] DB schema: users, employees, orgUnits, salaryRecords, performanceResults, performanceCategoryScores, evaluationCycles, evaluationTasks, announcements, employeeDocuments
- [x] DB migration (pnpm db:push)
- [x] server/db.ts query helpers for all tables
- [x] server/routers.ts tRPC procedures (orgUnit, employee, salary, performance, evaluation, announcement, document)
- [x] Admin guard (adminProcedure — role check)

## Admin Portal
- [x] AdminLayout (dark sidebar, role-based access guard, back-to-portal link)
- [x] Admin Dashboard (stats overview, quick actions, employee list preview)
- [x] Admin Employees (CRUD: create/edit/delete employees, search, table view)
- [x] Admin Org Units (CRUD: create/edit/delete, tree view with parent/child)
- [x] Admin Salary Records (per-employee salary history, CRUD)
- [x] Admin Performance (per-employee performance results, create)
- [x] Admin Announcements (CRUD: create/edit/delete, active/inactive toggle)
- [x] Admin Portal link in employee sidebar

## Bug Fixes
- [x] Fix nested <a> anchor tags in Layout.tsx and Dashboard.tsx

## Pending
- [x] Employee portal pages connected to real DB data (currently using mockData.ts)
- [ ] Menus 8–12 full implementation

## Evaluation Form Builder (New)
- [x] DB schema: employeeRole enum (regular/contractor), evaluationForms, formCategories, formKpis, evaluationResponses, kpiResponses tables
- [x] DB migration (15 tables total)
- [x] tRPC procedures: evaluationForm CRUD, formCategory CRUD, formKpi CRUD, submitEvaluationResponse
- [x] Admin: Evaluation Form Builder page (5 form types, category/KPI editor)
- [x] Employee portal: Periodic Evaluation page shows real form with 1-5 scoring
- [x] Contractor: no self-evaluation, only peer evaluation available

## Auth + Documents + Leave Management
- [x] DB schema: passwordHash in users, employeeDocuments table, leaveTypes/leaveBalances/leaveRequests tables
- [x] DB migration
- [x] Install bcrypt, build email+password login/logout API
- [x] Login page (email + password, replace OAuth)
- [x] Admin: set password when creating/editing employee
- [x] Admin: document upload (CV, contract) per employee
- [x] Employee portal: My Info Documents tab connected to real DB
- [x] Leave Management page (employee: apply, view status, balance)
- [x] Leave Management: manager approval page
- [x] Leave balance management (admin sets annual/sick leave days per employee)

## My Information Improvements
- [x] DB schema: bank_info table (19th table)
- [x] DB migration (pnpm db:push)
- [x] Backend: getBankInfoByEmployeeId, upsertBankInfo, updateEmployeePersonalInfo helpers
- [x] tRPC: bankInfo.get, bankInfo.upsert procedures
- [x] tRPC: employee.updatePersonal procedure (phone/nationality/workLocation/emergencyContact)
- [x] Frontend: Personal tab — editable fields (phone, nationality, workLocation, emergencyContact); full name read-only
- [x] Frontend: Bank Information tab — Recipient Info + Bank Info sections with save button
- [x] Frontend: Documents tab — connected to trpc.document.list (admin uploads → employee downloads)
- [x] Verified: admin document upload → employee_documents table → employee Documents tab flow

## Photo Display Fix + Admin User Management
- [x] Fix storage proxy to pipe image content directly (no 307 redirect) — fixes photos in Admin Employees list
- [x] Fix photo display in Dashboard, My Information, Layout sidebar (replace Radix AvatarImage with plain img)
- [x] Admin: User Management page (/admin/users) — list all users, promote/demote admin role, reset password
- [x] Add auth.listUsers and auth.setRole tRPC procedures (admin-only)

## MyAccount Real Data Connections
- [x] Password Change — connected to auth.changePassword tRPC (validates current password, bcrypt hash update)
- [x] Login History — shows lastSignedIn timestamp from users table (full history tracking deferred — no login_history table)
- [x] Devices — removed hardcoded MacBook/iPhone data; shows "Device tracking not available" (session table deferred)
- [x] Email tab — shows real user email from auth context
- [x] Periodic Evaluation badge — dynamically fetches pending task count via evaluation.myTasks tRPC

## Admin Access Toggle in Employee Form
- [x] Add "Admin Portal Access" toggle to employee create/edit form in AdminEmployees
- [x] Backend: employee.create/update procedures set user role to admin/user when isAdmin flag changes
- [x] Show admin badge/indicator in employee list for admin users

## Evaluation Enhancements
- [x] Add Purpose & Definition ON/OFF toggle to category create/edit forms in AdminEvalForms
- [x] Add upward_eval form type (employee evaluates manager) to schema and backend
- [x] Wire upward eval task assignment in eval cycle - assign employee to evaluate their manager
- [x] Add upward evaluation UI in Employee Portal PeriodicEvaluation page

## Evaluation Model Redesign (Evaluator-Grouped)
- [x] Purpose & Definition ON/OFF toggle added to category create/edit forms in AdminEvalForms
- [x] Add upward_eval form type to schema and backend
- [x] Wire upward eval task assignment in eval cycle
- [x] Add upward evaluation UI in Employee Portal PeriodicEvaluation page
- [x] Remove manager_eval form type from UI (manager evaluations use Peer form)
- [x] Redesign evaluation task model: evaluator-grouped (participant evaluates others)
- [x] Fix AdminEvalCycles.tsx TypeScript errors (tasksByEvaluatee → tasksByEvaluator, evalTasks type cast)
- [x] Fix AdminEvalForms.tsx Vite parse error (stale cache, not actual duplicate)
- [x] Update assign panel step labels: "Select Participant" / "Assign Evaluatees"
- [x] Update assign panel step 1 header text to "Choose participant (evaluator)"
- [x] Add Contractor Evaluatees section in assign panel step 2 (separate from Peer Evaluatees)
- [x] Add Edit Participant button per participant row (pre-populates assign panel with existing tasks)
- [x] Fix PeriodicEvaluation.tsx FormType union (remove manager_eval, add upward_eval)
- [x] handleEditParticipant: pre-populates selectedPeerIds, selectedContractorIds, selectedManagerId, includeUpward
