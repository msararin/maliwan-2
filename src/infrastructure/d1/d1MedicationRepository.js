function createD1MedicationRepository(d1Database = null) {
  if (!d1Database) {
    return createPlaceholderD1MedicationRepository();
  }

  assertD1Database(d1Database);

  return {
    kind: "d1-repository",
    findMedicationSchedulesByMember(input = {}) {
      assertMemberScope(input);
      const result = d1Database
        .prepare(FIND_MEDICATION_SCHEDULES_BY_MEMBER_SQL)
        .bind(input.householdId, input.memberId)
        .all();

      return Array.isArray(result?.results) ? result.results : [];
    },
    createMedicationLog(input = {}) {
      assertMedicationLogInput(input);

      const schedule = readMedicationScheduleForMember(d1Database, input);
      if (!schedule) {
        throw new Error(
          "D1MedicationRepository could not find an active medication schedule for this household and member."
        );
      }

      return d1Database
        .prepare(INSERT_MEDICATION_LOG_SQL)
        .bind(
          createMedicationLogId(),
          input.householdId,
          input.memberId,
          input.recordedByLineUserId,
          schedule.medication_name,
          "taken",
          "d1-medication-repository",
          input.takenAt
        )
        .run();
    },
    findForMember(input = {}) {
      return this.findMedicationSchedulesByMember(input);
    },
    logTaken(input = {}) {
      return this.createMedicationLog(input);
    },
  };
}

function createPlaceholderD1MedicationRepository() {
  return {
    kind: "d1-repository-placeholder",
    findMedicationSchedulesByMember(input = {}) {
      assertMemberScope(input);
      return [];
    },
    createMedicationLog(input = {}) {
      assertMedicationLogInput(input);
      return null;
    },
    findForMember(input = {}) {
      return this.findMedicationSchedulesByMember(input);
    },
    logTaken(input = {}) {
      return this.createMedicationLog(input);
    },
  };
}

function assertD1Database(d1Database) {
  if (!d1Database || typeof d1Database.prepare !== "function") {
    throw new TypeError("D1MedicationRepository requires a D1 database with prepare().");
  }
}

function assertMemberScope(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("D1MedicationRepository requires a request object.");
  }

  if (!input.householdId) {
    throw new TypeError("D1MedicationRepository requires householdId.");
  }

  if (!input.memberId) {
    throw new TypeError("D1MedicationRepository requires memberId.");
  }
}

function assertMedicationLogInput(input) {
  assertMemberScope(input);

  if (!input.medicationScheduleId) {
    throw new TypeError("D1MedicationRepository requires medicationScheduleId.");
  }

  if (!input.recordedByLineUserId) {
    throw new TypeError("D1MedicationRepository requires recordedByLineUserId.");
  }

  if (!input.takenAt) {
    throw new TypeError("D1MedicationRepository requires takenAt.");
  }
}

function readMedicationScheduleForMember(d1Database, input) {
  const result = d1Database
    .prepare(FIND_MEDICATION_SCHEDULE_BY_ID_SQL)
    .bind(input.householdId, input.memberId, input.medicationScheduleId)
    .all();

  return Array.isArray(result?.results) ? result.results[0] || null : null;
}

function createMedicationLogId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `medication-log-${Date.now()}`;
}

const FIND_MEDICATION_SCHEDULES_BY_MEMBER_SQL = `
  SELECT
    medication_schedule_id,
    household_id,
    member_id,
    medication_name,
    time,
    note,
    active
  FROM medication_schedules
  WHERE household_id = ? AND member_id = ? AND active = 1
  ORDER BY time ASC, medication_name ASC
`;

const FIND_MEDICATION_SCHEDULE_BY_ID_SQL = `
  SELECT
    medication_schedule_id,
    household_id,
    member_id,
    medication_name,
    time,
    note,
    active
  FROM medication_schedules
  WHERE household_id = ? AND member_id = ? AND medication_schedule_id = ? AND active = 1
  LIMIT 1
`;

const INSERT_MEDICATION_LOG_SQL = `
  INSERT INTO medication_logs (
    medication_log_id,
    household_id,
    member_id,
    line_user_id,
    medication_name,
    status,
    source,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

module.exports = {
  createD1MedicationRepository,
};
