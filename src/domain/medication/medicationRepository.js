function createMedicationRepository() {
  return {
    kind: "repository-interface-placeholder",
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
    throw new TypeError("MedicationRepository requires a request object.");
  }

  if (!input.householdId) {
    throw new TypeError("MedicationRepository requires householdId.");
  }

  if (!input.memberId) {
    throw new TypeError("MedicationRepository requires memberId.");
  }
}

function assertMedicationLogInput(input) {
  assertMemberScope(input);

  if (!input.medicationScheduleId) {
    throw new TypeError("MedicationRepository requires medicationScheduleId.");
  }

  if (!input.recordedByLineUserId) {
    throw new TypeError("MedicationRepository requires recordedByLineUserId.");
  }

  if (!input.takenAt) {
    throw new TypeError("MedicationRepository requires takenAt.");
  }
}

module.exports = {
  createMedicationRepository,
};
