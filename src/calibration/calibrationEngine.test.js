import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCalibrationSession,
  addCalibrationSample,
  summarizeCalibrationSession,
} from "./calibrationEngine.js";

function createPopulatedSession(options = {}) {
  const session = createCalibrationSession();

  const conditions = [
    "neutral",
    "eyesOpen",
    "eyesSquinting",
    "eyesClosed",
    "headLeft",
    "headRight",
    "headDown",
  ];

  for (let i = 0; i < 30; i++) {
    for (const condition of conditions) {
      let features;

      if (condition === "eyesOpen") {
        features = {
          averageEAR: options.unstableEyesOpen
            ? i % 2 === 0
              ? 0.1
              : 0.3
            : (options.eyesOpen ?? 0.3),
        };
      } else if (condition === "eyesSquinting") {
        features = {
          averageEAR: options.eyesSquinting ?? 0.2,
        };
      } else if (condition === "eyesClosed") {
        features = {
          averageEAR: options.eyesClosed ?? 0.1,
        };
      } else {
        const poses = {
          neutral: [0, 0, 0],
          headLeft: [options.headLeftYaw ?? -35, 0, 0],
          headRight: [options.headRightYaw ?? 35, 0, 0],
          headDown: [0, options.headDownPitch ?? 27, 0],
        };

        const [headYaw, headPitch, headRoll] = poses[condition];

        features = { headYaw, headPitch, headRoll };
      }

      addCalibrationSample(session, condition, features);
    }
  }

  return session;
}

test("kalibrasi dengan semua sampel valid diterima", () => {
  const session = createPopulatedSession();
  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, true);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("kalibrasi dengan sampel kurang dari 30 ditolak", () => {
  const session = createPopulatedSession();
  session.conditions.neutral.pop();

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, false);
  assert.equal(result.valid, false);
});

test("kalibrasi dengan pemisahan EAR yang tidak memadai ditolak", () => {
  const session = createPopulatedSession({
    eyesOpen: 0.2,
    eyesSquinting: 0.2,
    eyesClosed: 0.1,
  });

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, true);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("Pemisahan EAR")));
});

test("kalibrasi dengan arah yaw kiri dan kanan yang sama ditolak", () => {
  const session = createPopulatedSession({
    headLeftYaw: -35,
    headRightYaw: -30,
  });

  const result = summarizeCalibrationSession(session);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("Arah yaw")));
});

test("kalibrasi dengan sampel mata yang tidak stabil ditolak", () => {
  const session = createPopulatedSession({
    unstableEyesOpen: true,
  });

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, true);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("tidak stabil")));
});

test("kalibrasi dengan gerakan mendongak ditolak sebagai headDown", () => {
  const session = createPopulatedSession({
    headDownPitch: -27,
  });

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, true);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) => error.includes("Arah gerakan menunduk")),
  );
});

test("kalibrasi dengan sampel head pose tidak stabil ditolak", () => {
  const session = createPopulatedSession();

  session.conditions.headLeft = session.conditions.headLeft.map(
    (sample, index) => ({
      ...sample,
      headYaw: index % 2 === 0 ? -35 : -10,
    }),
  );

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, true);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) => error.includes("headLeft tidak stabil")),
  );
});

test("sampel dengan nilai tidak valid ditolak", () => {
  const session = createCalibrationSession();

  assert.equal(
    addCalibrationSample(session, "eyesOpen", { averageEAR: null }),
    false,
  );

  assert.equal(
    addCalibrationSample(session, "eyesOpen", { averageEAR: NaN }),
    false,
  );

  assert.equal(
    addCalibrationSample(session, "eyesOpen", { averageEAR: undefined }),
    false,
  );

  assert.equal(session.conditions.eyesOpen.length, 0);
});

test("kalibrasi ditolak jika salah satu kondisi belum lengkap", () => {
  const session = createPopulatedSession();

  session.conditions.headRight.splice(0, 5);

  const result = summarizeCalibrationSession(session);

  assert.equal(result.complete, false);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("kondisi headRight")));
});
