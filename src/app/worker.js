const DEFAULT_MEMBER_DIRECTORY = {
  "line-rin": {
    householdId: "household-malaithong",
    memberId: "member-rin",
    memberDisplayName: "Rin",
  },
  "line-benchawan": {
    householdId: "household-malaithong",
    memberId: "member-benchawan",
    memberDisplayName: "Benchawan",
  },
};

function createWorkerHandler(dependencies = {}) {
  const careOrchestrator = dependencies.careOrchestrator || null;
  const memberDirectory = dependencies.memberDirectory || DEFAULT_MEMBER_DIRECTORY;

  return {
    name: "maliwan-2-worker",
    handle(event = {}) {
      const text = normalizeText(event.text || event.message || event.action);
      const lineUserId = normalizeText(event.lineUserId || event.userId || event.sourceUserId);

      if (matchesCheckToday(text)) {
        const memberContext = resolveMemberContext(memberDirectory, lineUserId);
        if (!memberContext) {
          return createLineResponse({
            kind: "line-reply",
            status: "needs-member-context",
            text: "ยังไม่ทราบว่าต้องเช็กยาวันนี้ของใครค่ะ",
            suggestedResponses: ["Rin", "Benchawan", "กลับเมนูหลัก"],
          });
        }

        assertCareOrchestrator(careOrchestrator);
        const review = careOrchestrator.readMedicationScheduleForMember(memberContext);

        return createLineResponse({
          kind: "line-reply",
          status: review.status,
          householdId: review.householdId,
          memberId: review.memberId,
          memberDisplayName: review.memberDisplayName,
          text: buildMedicationScheduleText(review),
          suggestedResponses: review.suggestedResponses,
        });
      }

      return {
        status: 200,
        body: "maliwan-2 skeleton",
      };
    },
  };
}

async function handleHttpRequest(request, dependencies = {}) {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return createJsonResponse({
      ok: true,
      service: "maliwan-2",
      environment: normalizeText(dependencies.dataEnvironment || "staging"),
      status: "ready",
    });
  }

  return createJsonResponse(
    {
      ok: false,
      error: "not_found",
    },
    404
  );
}

function resolveMemberContext(memberDirectory, lineUserId) {
  if (!lineUserId || !memberDirectory || typeof memberDirectory !== "object") {
    return null;
  }

  const memberContext = memberDirectory[lineUserId];
  if (!memberContext) {
    return null;
  }

  return {
    householdId: normalizeText(memberContext.householdId),
    memberId: normalizeText(memberContext.memberId),
    memberDisplayName: normalizeText(memberContext.memberDisplayName || memberContext.memberName || memberContext.memberId),
  };
}

function matchesCheckToday(text) {
  return text === "เช็กยาวันนี้";
}

function assertCareOrchestrator(careOrchestrator) {
  if (!careOrchestrator || typeof careOrchestrator.readMedicationScheduleForMember !== "function") {
    throw new TypeError("Worker requires a careOrchestrator with readMedicationScheduleForMember().");
  }
}

function buildMedicationScheduleText(review) {
  if (!review || typeof review !== "object") {
    return "ไม่สามารถอ่านข้อมูลยาได้ค่ะ";
  }

  if (review.status === "empty") {
    return review.summary || "วันนี้ยังไม่มียาที่ตั้งไว้ค่ะ";
  }

  const scheduleLines = Array.isArray(review.scheduleItems)
    ? review.scheduleItems.map((item, index) => {
        const medicationName = normalizeText(item.medicationName || item.medication_name || `ยา ${index + 1}`);
        const time = normalizeText(item.time);
        const note = normalizeText(item.note);
        const noteSuffix = note ? ` (${note})` : "";
        const timePrefix = time ? `${time} - ` : "";
        return `${index + 1}. ${timePrefix}${medicationName}${noteSuffix}`;
      })
    : [];

  const body = [review.summary, review.prompt, ...scheduleLines].filter(Boolean);
  return body.join("\n");
}

function createLineResponse(payload) {
  return {
    status: 200,
    body: payload,
  };
}

function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

module.exports = {
  createWorkerHandler,
  handleHttpRequest,
};
