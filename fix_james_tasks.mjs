/**
 * Fix James Khoo's evaluation tasks:
 * - Find manager-type tasks where James is the evaluatee (targetEmployeeId = James's ID)
 * - Delete those tasks and their responses
 * - Recreate them as peer-type tasks
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// 1. Find James's employee ID
const [jamesRows] = await db.execute(
  "SELECT id, firstName, lastName FROM employees WHERE firstName = 'James ' AND lastName = 'Khoo'"
);
if (!jamesRows.length) { console.log("James not found"); process.exit(1); }
const james = jamesRows[0];
console.log("James:", james);

// 2. Find manager-type tasks where James is the target (being evaluated)
const [managerTasks] = await db.execute(
  "SELECT * FROM evaluation_tasks WHERE evaluateeId = ? AND type = 'manager'",
  [james.id]
);
console.log("Manager tasks targeting James:", managerTasks.length);
managerTasks.forEach(t => console.log(" ->", t.id, "evaluatorId:", t.evaluatorId, "type:", t.type, "status:", t.status));

if (managerTasks.length === 0) {
  console.log("No manager tasks found for James. Nothing to fix.");
  await db.end();
  process.exit(0);
}

// 3. For each manager task, delete kpi_responses -> evaluation_responses -> task, then recreate as peer
for (const task of managerTasks) {
  // Find evaluation_responses for this task
  const [evalResps] = await db.execute(
    "SELECT id FROM evaluation_responses WHERE taskId = ?",
    [task.id]
  );
  const evalRespIds = evalResps.map(r => r.id);
  console.log(`Task ${task.id}: found ${evalRespIds.length} evaluation_responses`);

  // Delete kpi_responses
  if (evalRespIds.length > 0) {
    for (const respId of evalRespIds) {
      await db.execute("DELETE FROM kpi_responses WHERE responseId = ?", [respId]);
    }
    await db.execute(
      `DELETE FROM evaluation_responses WHERE taskId = ?`,
      [task.id]
    );
    console.log(`  Deleted kpi_responses and evaluation_responses for task ${task.id}`);
  }

  // Delete the task
  await db.execute("DELETE FROM evaluation_tasks WHERE id = ?", [task.id]);
  console.log(`  Deleted task ${task.id}`);

  // Recreate as peer type (same evaluator, same target, same cycle)
  const [result] = await db.execute(
    `INSERT INTO evaluation_tasks (cycleId, evaluatorId, evaluateeId, type, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'peer', 'pending', NOW(), NOW())`,
    [task.cycleId, task.evaluatorId, task.evaluateeId]
  );
  console.log(`  Created new peer task id=${result.insertId} for evaluator=${task.evaluatorId}`);
}

// 4. Verify
const [newTasks] = await db.execute(
  "SELECT id, type, status, evaluatorId FROM evaluation_tasks WHERE evaluateeId = ?",
  [james.id]
);
console.log("\nAll tasks for James after fix:");
newTasks.forEach(t => console.log(" ->", t.id, "type:", t.type, "status:", t.status, "evaluatorId:", t.evaluatorId));

await db.end();
console.log("\nDone!");
