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
- [x] Menus 8–12 full implementation (deferred — out of current scope, showing Coming Soon badges)

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

## Evaluation Submit & Results Fix
- [x] Fix submit bug: upsert instead of create-only (one submit no longer locks all tasks)
- [x] Allow re-editing submitted evaluations while cycle is still open (cycleCloseDate check)
- [x] Prefill existing answers when re-editing a submitted evaluation
- [x] Show "Submitted (editable)" badge vs "Submitted" based on cycle status
- [x] Build Performance Results page: self (20%), peer (30%), manager (50%) weighted final score
- [x] Per-category breakdown for self/peer/manager/contractor evaluations
- [x] Add computedResults tRPC procedure that aggregates scores from evaluation_responses

## Downward Evaluation Feature
- [x] DB schema: downward_eval added to evaluationForms.formType enum, downward added to evaluationTasks.type enum
- [x] DB migration (0009_tranquil_thunderbolt.sql) applied
- [x] downward_eval form seeded in DB (id: 150001) by copying peer form with all 8 categories and KPIs
- [x] routers.ts: downward added to task type enums, downward_eval added to formType enum
- [x] AdminEvalCycles.tsx: TaskType union includes downward, TASK_TYPE_LABELS/COLORS updated
- [x] AdminEvalCycles.tsx: selectedDownwardIds state added
- [x] AdminEvalCycles.tsx: resetAssignState clears selectedDownwardIds
- [x] AdminEvalCycles.tsx: handleEditParticipant pre-populates selectedDownwardIds from existing downward tasks
- [x] AdminEvalCycles.tsx: handleAssignConfirm creates downward tasks for manager participants
- [x] AdminEvalCycles.tsx: Assign panel step 2 shows Downward Evaluatees section (only when participant isManager=true)
- [x] AdminEvalCycles.tsx: Summary section shows downward evaluation count
- [x] PeriodicEvaluation.tsx: FormType union includes downward_eval
- [x] PeriodicEvaluation.tsx: getFormType maps type="downward" → "downward_eval"
- [x] PeriodicEvaluation.tsx: typeLabels/typeColors/typeIcons include downward
- [x] server/db.ts: getComputedEvaluationResults classifies type="downward" as manager group (50%), type="peer"|"manager" as peer group (30%)

## Railway 이전 마이그레이션

- [x] Step 1: Manus 전용 플러그인 제거 (vite-plugin-manus-runtime, Umami analytics)
- [x] Step 2: Manus OAuth → DB 이메일/비밀번호 로그인 전환
  - [x] server/_core/sdk.ts: OAuth 제거, JWT sign/verify만 유지 (userId/email/role 기반)
  - [x] server/_core/oauth.ts: OAuth 콜백 핸들러 제거 (no-op stub)
  - [x] server/_core/env.ts: OAUTH_SERVER_URL, VITE_APP_ID, OWNER_OPEN_ID 제거
  - [x] server/_core/index.ts: signSession 페이로드를 새 SessionPayload 형식으로 수정
  - [x] server/db.ts: getUserById 헬퍼 추가, ownerOpenId 자동 승격 로직 제거
  - [x] client/src/const.ts: startLogin() → /login 리다이렉트로 교체
  - [x] client/src/_core/hooks/useAuth.ts: Manus localStorage/sessionStorage 잔재 제거
  - [x] client/src/main.tsx: manus-cookie Bearer token 폴백 제거
  - [x] client/src/components/DashboardLayout.tsx: startLogin() 버튼 → /login 리다이렉트
  - [x] shared/const.ts: OAUTH_STATE_COOKIE, OAuthState, encodeOAuthState, decodeOAuthState 제거
  - [x] TypeScript 0 errors, Vite 빌드 성공 (1787 modules)
- [x] Step 3: Forge API 스토리지 → 로컬 디스크(Railway Persistent Volume) 교체 완료
- [x] Step 4: Railway 배포 설정 완료 (Dockerfile, railway.toml, RAILWAY_DEPLOY.md)

## Step 3 완료: Forge API 스토리지 → 로컬 디스크 교체

- [x] server/storage.ts: Forge API presign/S3 PUT 제거, 로컬 디스크 fs.writeFileSync/storageResolve로 교체
- [x] server/_core/storageProxy.ts: Forge API 프록시 제거, 로컬 디스크 파일 서빙으로 교체 (/manus-storage/* 하위 호환 유지)
- [x] server/_core/index.ts: /api/download 엔드포인트를 fs.createReadStream 기반으로 교체 (Forge 제거)
- [x] server/_core/env.ts: 스토리지용 forgeApiUrl/forgeApiKey 제거 (LLM/이미지/음성 등 다른 Forge 기능은 유지)
- [x] mime-types 패키지 추가 (Content-Type 자동 감지)
- [x] TypeScript 0 errors, Vite 빌드 성공
- [x] 업로드/다운로드 API 실제 호출 테스트 통과 (HTTP 200)

## Step 4 완료: Railway 배포 설정

- [x] server/_core/env.ts: Forge API 변수 optional 처리 명확화 (서버 부팅 시 에러 없음 확인)
- [x] Dockerfile: node:22-slim 기반, corepack pnpm, 전체 빌드, STORAGE_DIR 기본값 설정
- [x] railway.toml: DOCKERFILE 빌더, 헬스체크(/), 재시작 정책 설정
- [x] RAILWAY_DEPLOY.md: 환경변수 목록, Persistent Volume 설정, 배포 순서, 트러블슈팅 가이드
- [x] TypeScript 0 errors, Vite 빌드 성공 (93.4kb server bundle)
