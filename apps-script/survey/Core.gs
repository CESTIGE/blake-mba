var SURVEY_HEADERS = [
  "server_timestamp",
  "client_timestamp",
  "role",
  "role_other",
  "learning_topics",
  "current_problem",
  "blake_course_count",
  "ai_course_count",
  "email",
  "consent",
  "request_id",
  "submission_id",
  "source",
];

var SURVEY_ROLES = ["學生", "上班族", "主管／管理者", "創業者／自由工作者", "其他"];
var SURVEY_SOURCE = "blake_mba_survey";

function trimText(value) {
  return String(value == null ? "" : value).trim();
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseSurveyBody(rawBody) {
  if (typeof rawBody !== "string" || rawBody.length === 0 || rawBody.length > 12000) {
    throw new Error("INVALID_BODY");
  }

  var parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("INVALID_BODY");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("INVALID_BODY");
  }

  return parsed;
}

function validateTextField(value, maxLength) {
  var trimmed = trimText(value);
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }
  return trimmed;
}

function normalizeSurveyPayload(payload) {
  var fields = [];
  var requestId = trimText(payload.requestId);
  var role = trimText(payload.role);
  var roleOther = trimText(payload.roleOther);
  var learningTopics = validateTextField(payload.learningTopics, 300);
  var currentProblem = validateTextField(payload.currentProblem, 2000);
  var blakeCourseCount = trimText(payload.blakeCourseCount);
  var aiCourseCount = trimText(payload.aiCourseCount);
  var email = trimText(payload.email).toLowerCase();
  var submittedAtClient = trimText(payload.submittedAtClient);
  var consent = payload.consent === true;

  if (!requestId || requestId.length > 64 || !isUuid(requestId)) fields.push("requestId");
  if (SURVEY_ROLES.indexOf(role) < 0) fields.push("role");
  if (role === "其他" && !roleOther) fields.push("roleOther");
  if (learningTopics === null) fields.push("learningTopics");
  if (currentProblem === null) fields.push("currentProblem");
  if (blakeCourseCount && !/^(0|[1-9][0-9]{0,2})$/.test(blakeCourseCount)) fields.push("blakeCourseCount");
  if (aiCourseCount && !/^(0|[1-9][0-9]{0,2})$/.test(aiCourseCount)) fields.push("aiCourseCount");
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fields.push("email");
  if (!consent) fields.push("consent");

  return fields.length
    ? {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "請檢查必填欄位。",
        fields: fields,
      }
    : {
        ok: true,
        value: {
          requestId: requestId,
          role: role,
          roleOther: roleOther,
          learningTopics: learningTopics,
          currentProblem: currentProblem,
          blakeCourseCount: blakeCourseCount,
          aiCourseCount: aiCourseCount,
          email: email,
          consent: consent,
          submittedAtClient: submittedAtClient,
        },
      };
}

function buildSurveyRow(value, metadata) {
  return [
    metadata.serverTimestamp,
    value.submittedAtClient,
    value.role,
    value.roleOther,
    value.learningTopics,
    value.currentProblem,
    value.blakeCourseCount,
    value.aiCourseCount,
    value.email,
    value.consent,
    value.requestId,
    metadata.submissionId,
    SURVEY_SOURCE,
  ];
}
