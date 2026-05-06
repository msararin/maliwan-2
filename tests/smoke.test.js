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
  const seed = fs.readFileSync(seedPath, "utf8");

  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS households"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS household_members"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS line_identities"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS medication_schedules"));
  assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS medication_logs"));
  assert.ok(seed.includes('"display_name": "Rin"'));
  assert.ok(seed.includes('"display_name": "Benchawan"'));
});
