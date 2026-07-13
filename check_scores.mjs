/**
 * Check the form structure used for peer evaluations of James
 * and figure out what KPI scores were submitted (or what to insert to get 2.8125)
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// 1. Get James's self evaluation scores (already submitted, task 180009)
const [selfResp] = await db.execute(
  "SELECT er.id, er.formId FROM evaluation_responses er WHERE er.taskId = 180009"
);
console.log("Self response:", selfResp[0]);

const selfFormId = selfResp[0]?.formId;
const selfRespId = selfResp[0]?.id;

// 2. Get the form categories and KPIs for the self form
const [cats] = await db.execute(
  "SELECT fc.id, fc.title, fc.weight FROM form_categories fc WHERE fc.formId = ? ORDER BY fc.id",
  [selfFormId]
);
console.log("\nForm categories (formId:", selfFormId, "):");
for (const cat of cats) {
  const [kpis] = await db.execute(
    "SELECT fk.id, fk.kpiName FROM form_kpis fk WHERE fk.categoryId = ? ORDER BY fk.id",
    [cat.id]
  );
  console.log(`  [${cat.id}] ${cat.title} (weight: ${cat.weight}%)`);
  kpis.forEach(k => console.log(`    KPI ${k.id}: ${k.kpiName}`));
}

// 3. Get James's self KPI scores
const [selfKpis] = await db.execute(
  "SELECT kr.kpiId, kr.score FROM kpi_responses kr WHERE kr.responseId = ?",
  [selfRespId]
);
console.log("\nJames self KPI scores:");
selfKpis.forEach(k => console.log(`  KPI ${k.kpiId}: ${k.score}`));

// 4. Calculate self score using category weights
let selfTotal = 0;
let totalWeight = 0;
for (const cat of cats) {
  const [kpis] = await db.execute(
    "SELECT fk.id FROM form_kpis fk WHERE fk.categoryId = ?",
    [cat.id]
  );
  const catKpiIds = kpis.map(k => k.id);
  const catScores = selfKpis.filter(k => catKpiIds.includes(k.kpiId)).map(k => k.score);
  if (catScores.length > 0) {
    const catAvg = catScores.reduce((a, b) => a + b, 0) / catScores.length;
    selfTotal += catAvg * cat.weight;
    totalWeight += cat.weight;
    console.log(`  Cat "${cat.title}" (${cat.weight}%): avg=${catAvg.toFixed(4)}, scores=[${catScores.join(',')}]`);
  }
}
const selfScore = totalWeight > 0 ? selfTotal / totalWeight : null;
console.log("\nSelf totalAvg:", selfScore?.toFixed(4));

// 5. Check if there's a peer form (different from self form)
const [peerFormRows] = await db.execute(
  "SELECT ef.id, ef.formType FROM evaluation_forms ef WHERE ef.formType = 'peer'"
);
console.log("\nPeer form:", peerFormRows[0]);

const peerFormId = peerFormRows[0]?.id;
if (peerFormId) {
  const [peerCats] = await db.execute(
    "SELECT fc.id, fc.title, fc.weight FROM form_categories fc WHERE fc.formId = ? ORDER BY fc.id",
    [peerFormId]
  );
  console.log("Peer form categories:");
  for (const cat of peerCats) {
    const [kpis] = await db.execute(
      "SELECT fk.id, fk.kpiName FROM form_kpis fk WHERE fk.categoryId = ? ORDER BY fk.id",
      [cat.id]
    );
    console.log(`  [${cat.id}] ${cat.title} (weight: ${cat.weight}%)`);
    kpis.forEach(k => console.log(`    KPI ${k.id}: ${k.kpiName}`));
  }
}

// 6. What peer score would give final 2.8125?
// finalScore = selfScore * 0.2 + peerScore * 0.8
// peerScore = (2.8125 - selfScore * 0.2) / 0.8
if (selfScore !== null) {
  const targetFinal = 2.8125;
  const neededPeer = (targetFinal - selfScore * 0.2) / 0.8;
  console.log(`\nTo get finalScore = ${targetFinal}:`);
  console.log(`  selfScore = ${selfScore.toFixed(4)}`);
  console.log(`  neededPeerScore = ${neededPeer.toFixed(4)}`);
}

await db.end();
