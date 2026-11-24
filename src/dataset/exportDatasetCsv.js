const CSV_COLUMNS = [
  "participantId",
  "sessionId",
  "classId",
  "activity",
  "sessionStartedAt",
  "sessionFinishedAt",
  "sampleIndex",
  "sampleTimestamp",
  "averageEAR",
  "headYaw",
  "headPitch",
  "headRoll",
  "eyeState",
  "eyeDuration",
  "yawDirection",
  "yawDuration",
  "pitchDirection",
  "pitchDuration",
  "label",
];

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("Belum ada sesi dataset yang tersimpan.");
  }

  for (const session of sessions) {
    if (
      !session ||
      typeof session.sessionId !== "string" ||
      !/^P\d{3}$/.test(session.participantId) ||
      typeof session.classId !== "string" ||
      !Array.isArray(session.samples) ||
      session.samples.length === 0
    ) {
      throw new Error("Ditemukan sesi dataset dengan struktur tidak valid.");
    }

    for (const sample of session.samples) {
      if (
        !sample ||
        sample.sessionId !== session.sessionId ||
        sample.participantId !== session.participantId ||
        sample.label !== session.classId ||
        !isValidNumber(sample.timestamp) ||
        !isValidNumber(sample.averageEAR) ||
        !isValidNumber(sample.headYaw) ||
        !isValidNumber(sample.headPitch) ||
        !isValidNumber(sample.headRoll) ||
        !["open", "squinting", "closed"].includes(sample.eyeState)
      ) {
        throw new Error(
          `Ditemukan sampel tidak valid pada sesi ${session.sessionId}.`,
        );
      }
    }
  }
}

export function buildDatasetCsv(sessions) {
  validateSessions(sessions);

  const rows = [CSV_COLUMNS];

  for (const session of sessions) {
    session.samples.forEach((sample, index) => {
      rows.push([
        session.participantId,
        session.sessionId,
        session.classId,
        session.activity,
        session.startedAt,
        session.finishedAt,
        index + 1,
        sample.timestamp,
        sample.averageEAR,
        sample.headYaw,
        sample.headPitch,
        sample.headRoll,
        sample.eyeState,
        sample.eyeDuration,
        sample.yawDirection,
        sample.yawDuration,
        sample.pitchDirection,
        sample.pitchDuration,
        sample.label,
      ]);
    });
  }

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
}

export function downloadDatasetCsv(sessions) {
  const csv = buildDatasetCsv(sessions);
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `focusly_dataset_${date}.csv`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    filename,
    sessionCount: sessions.length,
    sampleCount: sessions.reduce(
      (total, session) => total + session.samples.length,
      0,
    ),
  };
}
