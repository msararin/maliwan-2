function createCareOrchestrator(dependencies = {}) {
  const medicationRepository = dependencies.medicationRepository || null;

  return {
    name: "care-orchestrator",
    plan() {
      return {
        status: "skeleton",
        scope: "standalone repo bootstrap",
      };
    },
    readMedicationScheduleForMember(input = {}) {
      assertMedicationReadInput(input);
      assertMedicationRepository(medicationRepository);

      const memberDisplayName = normalizeDisplayName(
        input.memberDisplayName || input.member_name || input.memberId
      );
      const scheduleRows = medicationRepository.findMedicationSchedulesByMember({
        householdId: input.householdId,
        memberId: input.memberId,
      });
      const scheduleItems = normalizeMedicationSchedules(scheduleRows);

      if (scheduleItems.length === 0) {
        return {
          kind: "medication-schedule-review",
          status: "empty",
          householdId: input.householdId,
          memberId: input.memberId,
          memberDisplayName,
          summary: `วันนี้ยังไม่มียาที่ตั้งไว้สำหรับ ${memberDisplayName} ค่ะ`,
          scheduleCount: 0,
          scheduleItems: [],
          suggestedResponses: ["กลับเมนูหลัก", "ยกเลิก"],
        };
      }

      return {
        kind: "medication-schedule-review",
        status: "ready",
        householdId: input.householdId,
        memberId: input.memberId,
        memberDisplayName,
        summary: `วันนี้คุณ ${memberDisplayName} มียา ${scheduleItems.length} รายการค่ะ`,
        prompt: "กินตัวไหนแล้วบ้างคะ?",
        scheduleCount: scheduleItems.length,
        scheduleItems,
        suggestedResponses: [
          ...scheduleItems.map((item) => item.medicationName),
          "กินครบแล้ว",
          "ยังไม่ได้กิน",
        ],
      };
    },
  };
}

function assertMedicationReadInput(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("CareOrchestrator requires a request object.");
  }

  if (!input.householdId) {
    throw new TypeError("CareOrchestrator requires householdId.");
  }

  if (!input.memberId) {
    throw new TypeError("CareOrchestrator requires memberId.");
  }
}

function assertMedicationRepository(medicationRepository) {
  if (!medicationRepository || typeof medicationRepository.findMedicationSchedulesByMember !== "function") {
    throw new TypeError("CareOrchestrator requires a medicationRepository with findMedicationSchedulesByMember().");
  }
}

function normalizeMedicationSchedules(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => ({
      medicationScheduleId: String(row.medication_schedule_id || row.medicationScheduleId || "").trim(),
      householdId: String(row.household_id || row.householdId || "").trim(),
      memberId: String(row.member_id || row.memberId || "").trim(),
      medicationName: String(row.medication_name || row.medicationName || "").trim(),
      time: row.time == null ? "" : String(row.time).trim(),
      note: row.note == null ? "" : String(row.note).trim(),
      active: row.active == null ? 1 : Number(row.active),
    }))
    .filter((row) => row.medicationScheduleId && row.householdId && row.memberId && row.medicationName);
}

function normalizeDisplayName(value) {
  const displayName = String(value || "").trim();
  return displayName || "member";
}

module.exports = {
  createCareOrchestrator,
};
