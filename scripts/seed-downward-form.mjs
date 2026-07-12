import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql2.createConnection(process.env.DATABASE_URL);

try {
  // 1. Find the peer form
  const [peerForms] = await db.execute(
    "SELECT * FROM evaluation_forms WHERE formType = 'peer' LIMIT 1"
  );
  if (!peerForms.length) {
    console.error("Peer form not found");
    process.exit(1);
  }
  const peerForm = peerForms[0];
  console.log("Found peer form:", peerForm.id, peerForm.title);

  // 2. Check if downward_eval form already exists
  const [existing] = await db.execute(
    "SELECT id FROM evaluation_forms WHERE formType = 'downward_eval' LIMIT 1"
  );
  if (existing.length) {
    console.log("downward_eval form already exists, id:", existing[0].id);
    process.exit(0);
  }

  // 3. Create downward_eval form
  const [formResult] = await db.execute(
    "INSERT INTO evaluation_forms (formType, title, description, isActive) VALUES (?, ?, ?, ?)",
    [
      "downward_eval",
      "Downward Evaluation (Manager → Employee)",
      "Manager evaluates a direct report using the same 8-category framework as peer evaluation.",
      1,
    ]
  );
  const newFormId = formResult.insertId;
  console.log("Created downward_eval form, id:", newFormId);

  // 4. Copy categories from peer form
  const [categories] = await db.execute(
    "SELECT * FROM form_categories WHERE formId = ? ORDER BY sortOrder",
    [peerForm.id]
  );
  console.log(`Copying ${categories.length} categories...`);

  for (const cat of categories) {
    const [catResult] = await db.execute(
      "INSERT INTO form_categories (formId, title, weight, purpose, definition, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
      [newFormId, cat.title, cat.weight, cat.purpose, cat.definition, cat.sortOrder]
    );
    const newCatId = catResult.insertId;

    // 5. Copy KPIs for each category
    const [kpis] = await db.execute(
      "SELECT * FROM form_kpis WHERE categoryId = ? ORDER BY sortOrder",
      [cat.id]
    );
    for (const kpi of kpis) {
      await db.execute(
        "INSERT INTO form_kpis (categoryId, kpiName, question, sortOrder) VALUES (?, ?, ?, ?)",
        [newCatId, kpi.kpiName, kpi.question, kpi.sortOrder]
      );
    }
    console.log(`  Category "${cat.title}": copied ${kpis.length} KPIs`);
  }

  console.log("Done! downward_eval form created successfully.");
} finally {
  await db.end();
}
