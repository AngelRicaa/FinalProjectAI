import test from "node:test";
import assert from "node:assert/strict";
import { buildDatasetCsv } from "./exportDatasetCsv.js";

function createSession() {
  return {
    sessionId: "session-001",
    participantId: "P001",
    classId: "focused",
    activity: "reading",
    startedAt: "2026-11-24T10:00:00.000Z",
    finishedAt: "2026-11-24T10:01:00.000Z",
    samples: [
      {
        sessionId: "session-001",
        participantId: "P001",
        timestamp: 1000,
        averageEAR: 0.38,
        headYaw: -0.9,
        headPitch: 2.6,
        headRoll: -1.0,
        eyeState: "open",
        eyeDuration: 1000,
        yawDirection: "neutral",
        yawDuration: 1000,
        pitchDirection: "neutral",
        pitchDuration: 1000,
        label: "focused",
      },
    ],
  };
}

test("membuat CSV dengan header dan sampel", () => {
  const csv = buildDatasetCsv([createSession()]);
  const rows = csv.split("\r\n");

  assert.equal(rows.length, 2);
  assert.match(rows[0], /participantId/);
  assert.match(rows[0], /averageEAR/);
  assert.match(rows[1], /P001/);
  assert.match(rows[1], /focused/);
});

test("menolak ekspor tanpa sesi", () => {
  assert.throws(() => buildDatasetCsv([]), /Belum ada sesi dataset/);
});

test("menolak sampel dengan identitas peserta tidak konsisten", () => {
  const session = createSession();
  session.samples[0].participantId = "P002";

  assert.throws(() => buildDatasetCsv([session]), /sampel tidak valid/);
});

test("menolak fitur numerik yang tidak valid", () => {
  const session = createSession();
  session.samples[0].averageEAR = null;

  assert.throws(() => buildDatasetCsv([session]), /sampel tidak valid/);
});

test("mengamankan nilai CSV yang mengandung koma", () => {
  const session = createSession();
  session.activity = "reading, studying";

  const csv = buildDatasetCsv([session]);

  assert.match(csv, /"reading, studying"/);
});
