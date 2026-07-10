# HR Employee Portal — TODO

## Employee Portal (Menus 1–7)
- [x] Dashboard (welcome banner, stats cards, announcements, quick links)
- [x] My Information (personal info, employment info, documents tabs)
- [x] My Organization — team/entity hierarchy chart + My Team section with manager badge
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
- [ ] Employee portal pages connected to real DB data (currently using mockData.ts)
- [ ] Menus 8–12 full implementation

## Evaluation Form Builder (New)
- [x] DB schema: employeeRole enum (regular/contractor), evaluationForms, formCategories, formKpis, evaluationResponses, kpiResponses tables
- [x] DB migration (15 tables total)
- [x] tRPC procedures: evaluationForm CRUD, formCategory CRUD, formKpi CRUD, submitEvaluationResponse
- [x] Admin: Evaluation Form Builder page (5 form types, category/KPI editor)
- [x] Employee portal: Periodic Evaluation page shows real form with 1-5 scoring
- [x] Contractor: no self-evaluation, only peer evaluation available

## Auth + Documents + Leave Management
- [ ] DB schema: passwordHash in users, employeeDocuments table, leaveTypes/leaveBalances/leaveRequests tables
- [ ] DB migration
- [ ] Install bcrypt, build email+password login/logout API
- [ ] Login page (email + password, replace OAuth)
- [ ] Admin: set password when creating/editing employee
- [ ] Admin: document upload (CV, contract) per employee
- [ ] Employee portal: My Info Documents tab connected to real DB
- [ ] Leave Management page (employee: apply, view status, balance)
- [ ] Leave Management: manager approval page
- [ ] Leave balance management (admin sets annual/sick leave days per employee)
