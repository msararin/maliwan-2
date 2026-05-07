const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { createWorkerHandler, handleHttpRequest } = require("../src/app/worker");
const { createCareOrchestrator } = require("../src/orchestrator/careOrchestrator");
const { createHouseholdModel } = require("../src/domain/household/householdModel");
const { createMedicationModel } = require("../src/domain/medication/medicationModel");
const { createMedicationRepository } = require("../src/domain/medication/medicationRepository");
const {
  DATA_ENVIRONMENTS,
  assertAutomatedTestDataBoundary,
  createDataEnvironmentConfig,
} = require("../src/config/dataEnvironment");
const { createD1MedicationRepository } = require("../src/infrastructure/d1/d1MedicationRepository");
const { formatReport, runSmokeLineRead } = require("../scripts/smoke-line-read");

const schemaPath = path.join(__dirname, "..", "src", "infrastructure", "d1", "schema.sql");
const seedPath = path.join(__dirname, "..", "src", "infrastructure", "d1", "seed.example.json");
const wranglerPath = path.join(__dirname, "..", "wrangler.toml");
const fixturesPath = path.join(__dirname, "fixtures");

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixturesPath, fileName), "utf8"));
}

test("skeleton imports do not fail", () => {
  assert.equal(typeof createWorkerHandler, "function");
  assert.equal(typeof handleHttpRequest, "function");
  assert.equal(typeof createCareOrchestrator, "function");
  assert.equal(typeof createHouseholdModel, "function");
  assert.equal(typeof createMedicationModel, "function");
  assert.equal(typeof createMedicationRepository, "function");
  assert.equal(typeof createDataEnvironmentConfig, "function");
  assert.equal(typeof createD1MedicationRepository, "function");
});

test("skeleton modules return placeholder objects", () => {
  const worker = createWorkerHandler();
  const orchestrator = createCareOrchestrator();
  const household = createHouseholdModel({ household_id: "household-001", name: "Primary Household" });
  const medication = createMedicationModel({ household_id: "household-001", member_id: "member-rin", medication_name: "Pristiq" });
  const medicationRepository = createMedicationRepository();
  const d1MedicationRepository = createD1MedicationRepository();

  assert.equal(worker.name, "maliwan-2-worker");
  assert.equal(worker.handle().status, 200);
  assert.equal(orchestrator.plan().scope, "standalone repo bootstrap");
  assert.equal(household.household_id, "household-001");
  assert.equal(medication.medication_name, "Pristiq");
  assert.equal(medicationRepository.kind, "repository-interface-placeholder");
  assert.equal(d1MedicationRepository.kind, "d1-repository-placeholder");
  assert.equal(typeof medicationRepository.findMedicationSchedulesByMember, "function");
  assert.equal(typeof medicationRepository.createMedicationLog, "function");
  assert.equal(typeof d1MedicationRepository.findMedicationSchedulesByMember, "function");
  assert.equal(typeof d1MedicationRepository.createMedicationLog, "function");
  assert.equal(typeof orchestrator.readMedicationScheduleForMember, "function");
});

test("worker wires เช็กยาวันนี้ to medication schedule orchestration", () => {
  const calls = [];
  const worker = createWorkerHandler({
    careOrchestrator: {
      readMedicationScheduleForMember(input) {
        calls.push(input);
        return {
          kind: "medication-schedule-review",
          status: "ready",
          householdId: input.householdId,
          memberId: input.memberId,
          memberDisplayName: input.memberDisplayName,
          summary: "วันนี้คุณ Rin มียา 1 รายการค่ะ",
          prompt: "กินตัวไหนแล้วบ้างคะ?",
          scheduleCount: 1,
          scheduleItems: [
            {
              medicationName: "Pristiq",
              time: "10.00am",
              note: "หลังอาหารเช้า",
            },
          ],
          suggestedResponses: ["Pristiq", "กินครบแล้ว", "ยังไม่ได้กิน"],
        };
      },
    },
  });

  const response = worker.handle({
    action: "เช็กยาวันนี้",
    lineUserId: "line-rin",
  });

  assert.deepEqual(calls, [
    {
      householdId: "household-malaithong",
      memberId: "member-rin",
      memberDisplayName: "Rin",
    },
  ]);
  assert.equal(response.status, 200);
  assert.equal(response.body.kind, "line-reply");
  assert.equal(response.body.status, "ready");
  assert.equal(response.body.householdId, "household-malaithong");
  assert.equal(response.body.memberId, "member-rin");
  assert.equal(response.body.memberDisplayName, "Rin");
  assert.equal(
    response.body.text,
    "วันนี้คุณ Rin มียา 1 รายการค่ะ\nกินตัวไหนแล้วบ้างคะ?\n1. 10.00am - Pristiq (หลังอาหารเช้า)"
  );
  assert.deepEqual(response.body.suggestedResponses, ["Pristiq", "กินครบแล้ว", "ยังไม่ได้กิน"]);
});

test("worker returns a safe response when member context is missing", () => {
  const worker = createWorkerHandler({
    careOrchestrator: {
      readMedicationScheduleForMember() {
        throw new Error("should not be called");
      },
    },
    memberDirectory: {},
  });

  const response = worker.handle({
    text: "เช็กยาวันนี้",
    lineUserId: "unknown-user",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.kind, "line-reply");
  assert.equal(response.body.status, "needs-member-context");
  assert.equal(response.body.text, "ยังไม่ทราบว่าต้องเช็กยาวันนี้ของใครค่ะ");
  assert.deepEqual(response.body.suggestedResponses, ["Rin", "Benchawan", "กลับเมนูหลัก"]);
});

test("worker surfaces an empty medication schedule reply safely", () => {
  let callCount = 0;
  const worker = createWorkerHandler({
    careOrchestrator: {
      readMedicationScheduleForMember(input) {
        callCount += 1;
        assert.deepEqual(input, {
          householdId: "household-malaithong",
          memberId: "member-benchawan",
          memberDisplayName: "Benchawan",
        });

        return {
          kind: "medication-schedule-review",
          status: "empty",
          householdId: input.householdId,
          memberId: input.memberId,
          memberDisplayName: input.memberDisplayName,
          summary: "วันนี้ยังไม่มียาที่ตั้งไว้สำหรับ Benchawan ค่ะ",
          scheduleCount: 0,
          scheduleItems: [],
          suggestedResponses: ["กลับเมนูหลัก", "ยกเลิก"],
        };
      },
    },
  });

  const response = worker.handle({
    message: "เช็กยาวันนี้",
    userId: "line-benchawan",
  });

  assert.equal(callCount, 1);
  assert.equal(response.status, 200);
  assert.equal(response.body.kind, "line-reply");
  assert.equal(response.body.status, "empty");
  assert.equal(response.body.householdId, "household-malaithong");
  assert.equal(response.body.memberId, "member-benchawan");
  assert.equal(response.body.memberDisplayName, "Benchawan");
  assert.equal(response.body.text, "วันนี้ยังไม่มียาที่ตั้งไว้สำหรับ Benchawan ค่ะ");
  assert.deepEqual(response.body.suggestedResponses, ["กลับเมนูหลัก", "ยกเลิก"]);
});

test("care orchestrator returns a reviewable medication schedule model", () => {
  const calls = [];
  const orchestrator = createCareOrchestrator({
    medicationRepository: {
      findMedicationSchedulesByMember(input) {
        calls.push(input);
        return [
          {
            medication_schedule_id: "schedule-rin-pristiq",
            household_id: input.householdId,
            member_id: input.memberId,
            medication_name: "Pristiq",
            time: "10.00am",
            note: "หลังอาหารเช้า",
            active: 1,
          },
        ];
      },
    },
  });

  const result = orchestrator.readMedicationScheduleForMember({
    householdId: "household-malaithong",
    memberId: "member-rin",
    memberDisplayName: "Rin",
  });

  assert.deepEqual(calls, [
    {
      householdId: "household-malaithong",
      memberId: "member-rin",
    },
  ]);
  assert.equal(result.kind, "medication-schedule-review");
  assert.equal(result.status, "ready");
  assert.equal(result.householdId, "household-malaithong");
  assert.equal(result.memberId, "member-rin");
  assert.equal(result.memberDisplayName, "Rin");
  assert.equal(result.scheduleCount, 1);
  assert.equal(result.summary, "วันนี้คุณ Rin มียา 1 รายการค่ะ");
  assert.equal(result.prompt, "กินตัวไหนแล้วบ้างคะ?");
  assert.deepEqual(result.suggestedResponses, ["Pristiq", "กินครบแล้ว", "ยังไม่ได้กิน"]);
  assert.deepEqual(result.scheduleItems, [
    {
      medicationScheduleId: "schedule-rin-pristiq",
      householdId: "household-malaithong",
      memberId: "member-rin",
      medicationName: "Pristiq",
      time: "10.00am",
      note: "หลังอาหารเช้า",
      active: 1,
    },
  ]);
});

test("care orchestrator returns a safe empty medication schedule model", () => {
  const calls = [];
  const orchestrator = createCareOrchestrator({
    medicationRepository: {
      findMedicationSchedulesByMember(input) {
        calls.push(input);
        return [];
      },
    },
  });

  const result = orchestrator.readMedicationScheduleForMember({
    householdId: "household-malaithong",
    memberId: "member-benchawan",
    member_name: "Benchawan",
  });

  assert.deepEqual(calls, [
    {
      householdId: "household-malaithong",
      memberId: "member-benchawan",
    },
  ]);
  assert.equal(result.kind, "medication-schedule-review");
  assert.equal(result.status, "empty");
  assert.equal(result.householdId, "household-malaithong");
  assert.equal(result.memberId, "member-benchawan");
  assert.equal(result.memberDisplayName, "Benchawan");
  assert.equal(result.scheduleCount, 0);
  assert.equal(result.summary, "วันนี้ยังไม่มียาที่ตั้งไว้สำหรับ Benchawan ค่ะ");
  assert.deepEqual(result.scheduleItems, []);
  assert.deepEqual(result.suggestedResponses, ["กลับเมนูหลัก", "ยกเลิก"]);
});

test("worker and orchestrator stay free of direct D1 SQL", () => {
  const workerSource = fs.readFileSync(path.join(__dirname, "..", "src", "app", "worker.js"), "utf8");
  const orchestratorSource = fs.readFileSync(
    path.join(__dirname, "..", "src", "orchestrator", "careOrchestrator.js"),
    "utf8"
  );

  assert.ok(workerSource.includes("readMedicationScheduleForMember"));
  assert.ok(orchestratorSource.includes("readMedicationScheduleForMember"));
  assert.equal(workerSource.includes("SELECT "), false);
  assert.equal(workerSource.includes("INSERT INTO"), false);
  assert.equal(orchestratorSource.includes("SELECT "), false);
  assert.equal(orchestratorSource.includes("INSERT INTO"), false);
});

test("health check endpoint supports staging runtime smoke checks", async () => {
  const response = await handleHttpRequest(new Request("https://maliwan-2-staging.example.test/health"), {
    dataEnvironment: DATA_ENVIRONMENTS.STAGING,
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    ok: true,
    service: "maliwan-2",
    environment: "staging",
    status: "ready",
  });
});

test("wrangler config defines separated staging and production runtime placeholders", () => {
  const wranglerConfig = fs.readFileSync(wranglerPath, "utf8");

  assert.ok(wranglerConfig.includes('main = "src/app/cloudflareWorker.mjs"'));
  assert.ok(wranglerConfig.includes("[env.staging]"));
  assert.ok(wranglerConfig.includes("[env.production]"));
  assert.ok(wranglerConfig.includes('binding = "DB"'));
  assert.ok(wranglerConfig.includes('database_name = "maliwan2_staging"'));
  assert.ok(wranglerConfig.includes('database_name = "maliwan2_production"'));
  assert.ok(wranglerConfig.includes('MALIWAN_DATA_ENV = "staging"'));
  assert.ok(wranglerConfig.includes('MALIWAN_DATA_ENV = "production"'));
  assert.equal(wranglerConfig.includes("replace-with-staging-d1-database-id"), false);
  assert.ok(wranglerConfig.includes("d3c1c9d8-915e-4f3f-ac51-dc5e9160be80"));
  assert.ok(wranglerConfig.includes("replace-with-production-d1-database-id"));
});

test("data environment guard keeps automated tests away from production data", () => {
  const testConfig = createDataEnvironmentConfig({
    dataEnvironment: DATA_ENVIRONMENTS.TEST,
    dataStoreName: "maliwan-test-local",
  });

  assert.equal(testConfig.dataEnvironment, "test");
  assert.equal(testConfig.isTest, true);
  assert.equal(assertAutomatedTestDataBoundary(testConfig), true);

  assert.throws(
    () =>
      assertAutomatedTestDataBoundary({
        dataEnvironment: DATA_ENVIRONMENTS.STAGING,
        dataStoreName: "maliwan-staging-d1",
      }),
    /Automated tests must use the test data environment/
  );
  assert.throws(
    () =>
      assertAutomatedTestDataBoundary({
        dataEnvironment: DATA_ENVIRONMENTS.TEST,
        dataStoreName: "maliwan-production-d1",
      }),
    /Automated tests must not point at production data stores/
  );
  assert.throws(
    () =>
      assertAutomatedTestDataBoundary({
        nodeEnvironment: "test",
        dataEnvironment: DATA_ENVIRONMENTS.PRODUCTION,
        dataStoreName: "maliwan2_prod",
      }),
    /NODE_ENV=test must not use non-test data environments/
  );
});

test("test fixtures keep medication person-scoped and inventory household-scoped", () => {
  const persons = readFixture("persons.json");
  const schedules = readFixture("medication-schedules.json");
  const logs = readFixture("medication-logs.json");
  const inventoryItems = readFixture("inventory-items.json");

  assert.deepEqual(
    persons.map((person) => person.member_id).sort(),
    ["test-benchawan", "test-rin"]
  );
  assert.ok(persons.every((person) => person.household_id === "test-household"));
  assert.ok(persons.every((person) => person.line_user_id.startsWith("test-line-")));

  assert.ok(schedules.every((schedule) => schedule.household_id === "test-household"));
  assert.ok(schedules.every((schedule) => schedule.member_id.startsWith("test-")));
  assert.deepEqual(
    schedules.map((schedule) => schedule.medication_name).sort(),
    ["TestMedMorning", "TestMedNight"]
  );

  assert.ok(logs.every((log) => log.household_id === "test-household"));
  assert.ok(logs.every((log) => log.member_id.startsWith("test-")));
  assert.ok(logs.every((log) => log.line_user_id.startsWith("test-line-")));

  assert.ok(inventoryItems.every((item) => item.household_id === "test-household"));
  assert.ok(inventoryItems.every((item) => !Object.hasOwn(item, "member_id")));
});

test("medication schedule read can use fake person fixture data", () => {
  const persons = readFixture("persons.json");
  const schedules = readFixture("medication-schedules.json");
  const testRin = persons.find((person) => person.member_id === "test-rin");
  const calls = [];
  const orchestrator = createCareOrchestrator({
    medicationRepository: {
      findMedicationSchedulesByMember(input) {
        calls.push(input);
        return schedules.filter(
          (schedule) => schedule.household_id === input.householdId && schedule.member_id === input.memberId
        );
      },
    },
  });

  const result = orchestrator.readMedicationScheduleForMember({
    householdId: testRin.household_id,
    memberId: testRin.member_id,
    memberDisplayName: testRin.display_name,
  });

  assert.deepEqual(calls, [
    {
      householdId: "test-household",
      memberId: "test-rin",
    },
  ]);
  assert.equal(result.status, "ready");
  assert.equal(result.memberId, "test-rin");
  assert.equal(result.scheduleCount, 1);
  assert.equal(result.scheduleItems[0].medicationName, "TestMedMorning");
});

test("smoke:line-read script reports the read-only medication flow", () => {
  const report = runSmokeLineRead();
  const rendered = formatReport(report);

  assert.equal(report.inputText, "เช็กยาวันนี้");
  assert.deepEqual(report.resolvedMemberContext, {
    householdId: "household-malaithong",
    memberId: "member-rin",
    memberDisplayName: "Rin",
  });
  assert.equal(report.responseKind, "line-reply");
  assert.equal(report.responseStatus, "ready");
  assert.equal(report.replyText, "วันนี้คุณ Rin มียา 1 รายการค่ะ\nกินตัวไหนแล้วบ้างคะ?\n1. 10.00am - Pristiq (หลังอาหารเช้า)");
  assert.deepEqual(report.suggestedResponses, ["Pristiq", "กินครบแล้ว", "ยังไม่ได้กิน"]);
  assert.ok(rendered.includes("Big Crew smoke: line read"));
  assert.ok(rendered.includes("input text: เช็กยาวันนี้"));
  assert.ok(rendered.includes("response status: ready"));
});

test("medication repository contract requires household and member identity", () => {
  const medicationRepository = createMedicationRepository();
  const d1MedicationRepository = createD1MedicationRepository();

  const validScheduleRequest = {
    householdId: "household-malaithong",
    memberId: "member-rin",
  };

  const validLogRequest = {
    householdId: "household-malaithong",
    memberId: "member-rin",
    medicationScheduleId: "schedule-rin-pristiq",
    recordedByLineUserId: "line-rin",
    takenAt: "2026-05-06T10:00:00Z",
  };

  assert.deepEqual(medicationRepository.findMedicationSchedulesByMember(validScheduleRequest), []);
  assert.equal(medicationRepository.createMedicationLog(validLogRequest), null);
  assert.deepEqual(d1MedicationRepository.findMedicationSchedulesByMember(validScheduleRequest), []);
  assert.equal(d1MedicationRepository.createMedicationLog(validLogRequest), null);

  assert.throws(() => medicationRepository.findMedicationSchedulesByMember({ memberId: "member-rin" }), /householdId/);
  assert.throws(() => medicationRepository.findMedicationSchedulesByMember({ householdId: "household-malaithong" }), /memberId/);
  assert.throws(() => medicationRepository.createMedicationLog({ householdId: "household-malaithong", memberId: "member-rin", medicationScheduleId: "schedule-rin-pristiq", takenAt: "2026-05-06T10:00:00Z" }), /recordedByLineUserId/);
  assert.throws(() => d1MedicationRepository.createMedicationLog({ householdId: "household-malaithong", memberId: "member-rin", medicationScheduleId: "schedule-rin-pristiq", recordedByLineUserId: "line-rin" }), /takenAt/);
});

test("d1 medication repository uses scoped D1 queries for schedules and logs", () => {
  const calls = [];
  const scheduleRows = [
    {
      medication_schedule_id: "schedule-rin-pristiq",
      household_id: "household-malaithong",
      member_id: "member-rin",
      medication_name: "Pristiq",
      time: "10.00am",
      note: "",
      active: 1,
    },
  ];

  const d1Database = {
    prepare(sql) {
      const statement = {
        bind(...values) {
          calls.push({ type: "bind", sql, values });
          return statement;
        },
        all() {
          calls.push({ type: "all", sql });
          if (sql.includes("FROM medication_schedules") && sql.includes("medication_schedule_id = ?")) {
            return { results: scheduleRows };
          }
          if (sql.includes("FROM medication_schedules")) {
            return { results: scheduleRows };
          }
          return { results: [] };
        },
        run() {
          calls.push({ type: "run", sql });
          return { success: true, meta: { changes: 1 } };
        },
      };

      calls.push({ type: "prepare", sql });
      return statement;
    },
  };

  const repository = createD1MedicationRepository(d1Database);

  const schedules = repository.findMedicationSchedulesByMember({
    householdId: "household-malaithong",
    memberId: "member-rin",
  });

  assert.equal(repository.kind, "d1-repository");
  assert.deepEqual(schedules, scheduleRows);
  assert.ok(calls[0].sql.includes("FROM medication_schedules"));
  assert.deepEqual(calls[1], {
    type: "bind",
    sql: calls[0].sql,
    values: ["household-malaithong", "member-rin"],
  });
  assert.equal(calls[2].type, "all");

  calls.length = 0;

  const logResult = repository.createMedicationLog({
    householdId: "household-malaithong",
    memberId: "member-rin",
    medicationScheduleId: "schedule-rin-pristiq",
    recordedByLineUserId: "line-rin",
    takenAt: "2026-05-06T10:00:00Z",
  });

  assert.deepEqual(logResult, { success: true, meta: { changes: 1 } });
  assert.ok(calls[0].sql.includes("medication_schedule_id = ?"));
  assert.deepEqual(calls[1], {
    type: "bind",
    sql: calls[0].sql,
    values: ["household-malaithong", "member-rin", "schedule-rin-pristiq"],
  });
  assert.equal(calls[2].type, "all");
  assert.ok(calls[3].sql.includes("INSERT INTO medication_logs"));
  assert.equal(calls[4].type, "bind");
  assert.equal(calls[4].sql, calls[3].sql);
  assert.equal(calls[5].type, "run");
  assert.equal(typeof calls[4].values[0], "string");
  assert.ok(calls[4].values[0].length > 0);
  assert.deepEqual(calls[4].values.slice(1), [
    "household-malaithong",
    "member-rin",
    "line-rin",
    "Pristiq",
    "taken",
    "d1-medication-repository",
    "2026-05-06T10:00:00Z",
  ]);
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
