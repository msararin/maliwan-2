const { createWorkerHandler } = require("../src/app/worker");

function createSmokeOrchestrator() {
  return {
    readMedicationScheduleForMember(input) {
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
  };
}

function runSmokeLineRead() {
  const worker = createWorkerHandler({
    careOrchestrator: createSmokeOrchestrator(),
  });

  const input = {
    lineUserId: "line-rin",
    action: "เช็กยาวันนี้",
  };

  const response = worker.handle(input);
  const report = {
    inputText: input.action,
    resolvedMemberContext: {
      householdId: response.body.householdId,
      memberId: response.body.memberId,
      memberDisplayName: response.body.memberDisplayName,
    },
    responseKind: response.body.kind,
    responseStatus: response.body.status,
    replyText: response.body.text,
    suggestedResponses: response.body.suggestedResponses,
  };

  return report;
}

function formatReport(report) {
  return [
    "Big Crew smoke: line read",
    `input text: ${report.inputText}`,
    `resolved member context: ${JSON.stringify(report.resolvedMemberContext)}`,
    `response kind: ${report.responseKind}`,
    `response status: ${report.responseStatus}`,
    `reply text: ${report.replyText}`,
    `suggested responses: ${JSON.stringify(report.suggestedResponses)}`,
  ].join("\n");
}

if (require.main === module) {
  const report = runSmokeLineRead();
  console.log(formatReport(report));
}

module.exports = {
  createSmokeOrchestrator,
  formatReport,
  runSmokeLineRead,
};
