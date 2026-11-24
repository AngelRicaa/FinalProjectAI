import test from "node:test";
import assert from "node:assert/strict";
import { buildDatasetFeatures } from "./buildDatasetFeatures.js";

test("menggabungkan fitur wajah, klasifikasi, dan durasi", () => {
  const faceFeatures = {
    averageEAR: 0.38,
    headYaw: -0.9,
    headPitch: 2.6,
    headRoll: -1.0,
  };

  const faceState = {
    eyeState: "open",
    headDirection: {
      yaw: "neutral",
      pitch: "neutral",
    },
  };

  const temporalState = {
    eyeState: {
      value: "open",
      durationMs: 1200,
    },
    yawDirection: {
      value: "neutral",
      durationMs: 1500,
    },
    pitchDirection: {
      value: "neutral",
      durationMs: 1500,
    },
  };

  const result = buildDatasetFeatures(faceFeatures, faceState, temporalState);

  assert.equal(result.averageEAR, 0.38);
  assert.equal(result.eyeState, "open");
  assert.equal(result.eyeDuration, 1200);
  assert.equal(result.yawDirection, "neutral");
  assert.equal(result.pitchDirection, "neutral");
});

test("mengembalikan null jika wajah belum terdeteksi", () => {
  const result = buildDatasetFeatures(null, null, null);

  assert.equal(result, null);
});

test("menolak klasifikasi mata yang tidak valid", () => {
  const result = buildDatasetFeatures(
    {
      averageEAR: 0.38,
      headYaw: -0.9,
      headPitch: 2.6,
      headRoll: -1.0,
    },
    {
      eyeState: "unknown",
      headDirection: {
        yaw: "neutral",
        pitch: "neutral",
      },
    },
    {
      eyeState: { durationMs: 1000 },
      yawDirection: { durationMs: 1000 },
      pitchDirection: { durationMs: 1000 },
    },
  );

  assert.equal(result, null);
});
