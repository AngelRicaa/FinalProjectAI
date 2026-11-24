import test from "node:test";
import assert from "node:assert/strict";
import {
  createDatasetSession,
  addDatasetSample,
  finishDatasetSession,
} from "./datasetEngine.js";

function createFeatures() {
  return {
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
  };
}

test("membuat session untuk kelas focused dan participant P001", () => {
  const session = createDatasetSession("focused", "P001");

  assert.equal(session.classId, "focused");
  assert.equal(session.participantId, "P001");
  assert.equal(session.samples.length, 0);
  assert.ok(session.sessionId);
});

test("menolak participant ID dengan format tidak valid", () => {
  assert.throws(
    () => createDatasetSession("focused", "Peter"),
    /Participant ID harus menggunakan format/,
  );
});

test("menerima sampel dengan fitur valid", () => {
  const session = createDatasetSession("focused", "P001");
  const result = addDatasetSample(session, createFeatures(), 1000);

  assert.equal(result, true);
  assert.equal(session.samples.length, 1);
  assert.equal(session.samples[0].label, "focused");
  assert.equal(session.samples[0].participantId, "P001");
});

test("menolak sampel sebelum interval 200 ms", () => {
  const session = createDatasetSession("focused", "P001");

  addDatasetSample(session, createFeatures(), 1000);

  const result = addDatasetSample(session, createFeatures(), 1100);

  assert.equal(result, false);
  assert.equal(session.samples.length, 1);
});

test("menolak fitur yang tidak valid", () => {
  const session = createDatasetSession("focused", "P001");

  const result = addDatasetSample(
    session,
    {
      averageEAR: null,
      headYaw: -0.9,
      headPitch: 2.6,
      headRoll: -1.0,
      eyeState: "open",
    },
    1000,
  );

  assert.equal(result, false);
  assert.equal(session.samples.length, 0);
});

test("menyelesaikan session dan mempertahankan sampel", () => {
  const session = createDatasetSession("drowsy", "P002");

  addDatasetSample(session, createFeatures(), 1000);

  const result = finishDatasetSession(session);

  assert.equal(result.classId, "drowsy");
  assert.equal(result.participantId, "P002");
  assert.equal(result.sampleCount, 1);
  assert.equal(result.samples[0].label, "drowsy");
});

test("tidak menyelesaikan session tanpa sampel", () => {
  const session = createDatasetSession("focused", "P001");

  const result = finishDatasetSession(session);

  assert.equal(result, null);
});
