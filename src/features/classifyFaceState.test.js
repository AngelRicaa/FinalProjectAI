import test from "node:test";
import assert from "node:assert/strict";
import { classifyFaceState } from "./classifyFaceState.js";

function createCalibration() {
  return {
    valid: true,
    conditions: {
      eyesOpen: {
        averageEAR: { median: 0.38 },
      },
      eyesSquinting: {
        averageEAR: { median: 0.25 },
      },
      eyesClosed: {
        averageEAR: { median: 0.1 },
      },
      neutral: {
        headYaw: { median: 0 },
        headPitch: { median: 0 },
        headRoll: { median: 0 },
      },
      headLeft: {
        headYaw: { median: 30 },
      },
      headRight: {
        headYaw: { median: -30 },
      },
      headDown: {
        headPitch: { median: 25 },
      },
    },
  };
}

function createFeatures(overrides = {}) {
  return {
    averageEAR: 0.38,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    ...overrides,
  };
}

test("mengklasifikasikan mata terbuka", () => {
  const result = classifyFaceState(
    createFeatures({ averageEAR: 0.38 }),
    createCalibration(),
  );

  assert.equal(result.eyeState, "open");
});

test("mengklasifikasikan mata menyipit", () => {
  const result = classifyFaceState(
    createFeatures({ averageEAR: 0.25 }),
    createCalibration(),
  );

  assert.equal(result.eyeState, "squinting");
});

test("mengklasifikasikan mata tertutup", () => {
  const result = classifyFaceState(
    createFeatures({ averageEAR: 0.1 }),
    createCalibration(),
  );

  assert.equal(result.eyeState, "closed");
});

test("mengklasifikasikan kepala menoleh kiri", () => {
  const result = classifyFaceState(
    createFeatures({ headYaw: 20 }),
    createCalibration(),
  );

  assert.equal(result.headDirection.yaw, "left");
});

test("mengklasifikasikan kepala menoleh kanan", () => {
  const result = classifyFaceState(
    createFeatures({ headYaw: -20 }),
    createCalibration(),
  );

  assert.equal(result.headDirection.yaw, "right");
});

test("mengklasifikasikan kepala menunduk", () => {
  const result = classifyFaceState(
    createFeatures({ headPitch: 20 }),
    createCalibration(),
  );

  assert.equal(result.headDirection.pitch, "down");
});

test("mengembalikan null jika kalibrasi tidak valid", () => {
  const calibration = createCalibration();
  calibration.valid = false;

  const result = classifyFaceState(createFeatures(), calibration);

  assert.equal(result, null);
});

test("mengembalikan null jika fitur tidak lengkap", () => {
  const features = createFeatures();
  delete features.headRoll;

  const result = classifyFaceState(features, createCalibration());

  assert.equal(result, null);
});
