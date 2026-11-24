import { getDatasetClass } from "./datasetConfig.js";

const REQUIRED_FEATURES = ["averageEAR", "headYaw", "headPitch", "headRoll"];

const VALID_EYE_STATES = ["open", "squinting", "closed"];
const SAMPLE_INTERVAL_MS = 200;

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateFeatures(features) {
  if (!features || typeof features !== "object") {
    return false;
  }

  if (!REQUIRED_FEATURES.every((key) => isValidNumber(features[key]))) {
    return false;
  }

  return VALID_EYE_STATES.includes(features.eyeState);
}

export function createDatasetSession(classId, participantId) {
  const datasetClass = getDatasetClass(classId);

  if (!datasetClass) {
    throw new Error("Kelas dataset tidak valid.");
  }

  if (typeof participantId !== "string" || !/^P\d{3}$/.test(participantId)) {
    throw new Error(
      "Participant ID harus menggunakan format P001 sampai P999.",
    );
  }

  return {
    sessionId: crypto.randomUUID(),
    participantId,
    classId: datasetClass.id,
    activity: datasetClass.activity,
    startedAt: new Date().toISOString(),
    samples: [],
    lastSampleTime: null,
  };
}

export function addDatasetSample(session, features, timestamp = Date.now()) {
  if (
    !session ||
    !Array.isArray(session.samples) ||
    !isValidNumber(timestamp) ||
    !validateFeatures(features)
  ) {
    return false;
  }

  if (
    session.lastSampleTime !== null &&
    timestamp - session.lastSampleTime < SAMPLE_INTERVAL_MS
  ) {
    return false;
  }

  const sample = {
    timestamp,
    sessionId: session.sessionId,
    participantId: session.participantId,
    averageEAR: features.averageEAR,
    headYaw: features.headYaw,
    headPitch: features.headPitch,
    headRoll: features.headRoll,
    eyeState: features.eyeState,
    eyeDuration: features.eyeDuration ?? 0,
    yawDirection: features.yawDirection ?? "unknown",
    yawDuration: features.yawDuration ?? 0,
    pitchDirection: features.pitchDirection ?? "unknown",
    pitchDuration: features.pitchDuration ?? 0,
    label: session.classId,
  };

  session.samples.push(sample);
  session.lastSampleTime = timestamp;

  return true;
}

export function finishDatasetSession(session) {
  if (!session || session.samples.length === 0) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    participantId: session.participantId,
    classId: session.classId,
    activity: session.activity,
    startedAt: session.startedAt,
    finishedAt: new Date().toISOString(),
    sampleCount: session.samples.length,
    samples: [...session.samples],
  };
}
