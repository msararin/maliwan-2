const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { createWorkerHandler } = require("../src/app/worker");
const { createCareOrchestrator } = require("../src/orchestrator/careOrchestrator");
const { createHouseholdModel } = require("../src/domain/household/householdModel");
const { createMedicationModel } = require("../src/domain/medication/medicationModel");
const { createMedicationRepository } = require("../src/domain/medication/medicationRepository");
const { createD1MedicationRepository } = require("../src/infrastructure/d1/d1MedicationRepository");

const schemaPath = path.join(__dirname, "..", "src", "infrastructure", "d1", "schema.sql");
const seedPath = path.join(__dirname, "..", "src", "infrastructure", "d1", "seed.example.json");

test("skeleton imports do not fail", () => {
  assert.equal(typeof createWorkerHandler, "function");
  assert.equal(typeof createCareOrchestrator, "function");
  assert.equal(typeof createHouseholdModel, "function");
  assert.equal(typeof createMedicationModel, "function");
  assert.equal(typeof createMedicationRepository, "function");
  assert.equal(typeof createD1MedicationRepository, "function");
});

test("skeleton modules return placeholder objects", () => {
  const worker = createWorkerHandler();
  const orchestrator = createCareOrchestrator();
  const household = createHouseholdModel({ household_id: "household-001", name: "Primary Household" });
  const medication = createMedicationModel({ household_id: "household-001", member_id: "member-rin", medication_name: "Pristiq" });

  assert.equal(worker.name, "maliwan-2-worker");
  assert.equal(worker.handle().status, 200);
  assert.equal(orchestrator.plan().scope, "standalone repo bootstrap");
  assert.equal(household.household_id, "household-001");
  assert.equal(medication.medication_name, "Pristiq");
});

test("bootstrap placeholders exist for D1 schema and seed data", () => {
  assert.ok(fs.existsSync(schemaPath), "expected D1 schema placeholder to exist");
  assert.ok(fs.existsSync(seedPath), "expected seed data placeholder to exist");

  const schema = fs.readFileSync(schemaPath, "utf8");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS households"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS household_members"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS line_identities"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS medication_schedules"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS medication_logs"));
  assert.ok(schema.includes("household_id TEXT NOT NULL"));
  assert.ok(schema.includes("member_id TEXT NOT NULL"));
  assert.ok(schema.includes("line_user_id TEXT PRIMARY KEY"));
  assert.ok(schema.includes("FOREIGN KEY (line_user_id) REFERENCES line_identities (line_user_id)"));

  assert.equal(seed.households.length, 1);
  assert.equal(seed.households[0].name, "Malaithong household");
  assert.equal(seed.household_members.length, 2);
  assert.deepEqual(
    seed.household_members.map((member) => member.display_name).sort(),
    ["Benchawan", "Rin"]
  );
  assert.equal(seed.line_identities.length, 2);
  assert.equal(seed.medication_schedules.length, 2);
  assert.equal(seed.medication_logs.length, 1);
  assert.ok(seed.medication_schedules.every((entry) => entry.household_id === "household-malaithong"));
  assert.ok(seed.medication_schedules.every((entry) => typeof entry.member_id === "string" && entry.member_id.length > 0));
  assert.ok(seed.medication_logs.every((entry) => typeof entry.line_user_id === "string" && entry.line_user_id.length > 0));
});

test("bootstrap repo does not introduce inventory or admin UI implementation files", () => {
  const forbiddenPaths = [
    path.join(__dirname, "..", "src", "inventory"),
    path.join(__dirname, "..", "src", "admin"),
    path.join(__dirname, "..", "src", "ui"),
    path.join(__dirname, "..", "src", "runtime"),
  ];

  forbiddenPaths.forEach((forbiddenPath) => {
    assert.equal(fs.existsSync(forbiddenPath), false, `did not expect ${forbiddenPath} to exist`);
  });
});
