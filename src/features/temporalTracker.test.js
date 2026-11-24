import test from "node:test";
import assert from "node:assert/strict";

import {
  createTemporalTracker,
  updateTemporalTracker,
  resetTemporalTracker,
} from "./temporalTracker.js";

function createFaceState(eyeState, yaw, pitch) {
  return {
    eyeState,
    headDirection: {
      yaw,
      pitch,
    },
  };
}

test("mereset durasi setelah jeda panjang meskipun kondisi sebelumnya sudah berlangsung", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("closed", "neutral", "neutral"),
    1000,
  );

  updateTemporalTracker(
    tracker,
    createFaceState("closed", "neutral", "neutral"),
    1800,
  );

  const result = updateTemporalTracker(
    tracker,
    createFaceState("closed", "neutral", "neutral"),
    3300,
  );

  assert.equal(result.eyeState.value, "closed");
  assert.equal(result.eyeState.durationMs, 0);
});

test("menghitung durasi kondisi mata yang sama", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    1000,
  );

  const result = updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    1500,
  );

  assert.equal(result.eyeState.durationMs, 500);
});

test("mereset durasi ketika kondisi mata berubah", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    1000,
  );

  updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    1500,
  );

  const result = updateTemporalTracker(
    tracker,
    createFaceState("closed", "neutral", "neutral"),
    1800,
  );

  assert.equal(result.eyeState.value, "closed");
  assert.equal(result.eyeState.durationMs, 0);
});

test("menghitung durasi kepala menoleh", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("open", "left", "neutral"),
    1000,
  );

  const result = updateTemporalTracker(
    tracker,
    createFaceState("open", "left", "neutral"),
    2000,
  );

  assert.equal(result.yawDirection.value, "left");
  assert.equal(result.yawDirection.durationMs, 1000);
});

test("mereset durasi ketika wajah tidak terdeteksi", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("closed", "left", "down"),
    1000,
  );

  updateTemporalTracker(
    tracker,
    createFaceState("closed", "left", "down"),
    1500,
  );

  const result = updateTemporalTracker(tracker, null, 1600);

  assert.equal(result.eyeState.value, null);
  assert.equal(result.eyeState.durationMs, 0);
  assert.equal(result.yawDirection.value, null);
  assert.equal(result.pitchDirection.value, null);
});

test("tidak menghitung jeda lebih dari satu detik", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    1000,
  );

  const result = updateTemporalTracker(
    tracker,
    createFaceState("open", "neutral", "neutral"),
    2500,
  );

  assert.equal(result.eyeState.durationMs, 0);
});

test("mengatur ulang seluruh tracker", () => {
  const tracker = createTemporalTracker();

  updateTemporalTracker(
    tracker,
    createFaceState("closed", "right", "down"),
    1000,
  );

  resetTemporalTracker(tracker);

  assert.equal(tracker.lastTimestamp, null);
  assert.equal(tracker.eyeState.value, null);
  assert.equal(tracker.eyeState.durationMs, 0);
  assert.equal(tracker.yawDirection.value, null);
  assert.equal(tracker.pitchDirection.value, null);
});
