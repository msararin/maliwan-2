function createD1MedicationRepository() {
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

module.exports = {
  createD1MedicationRepository,
};
