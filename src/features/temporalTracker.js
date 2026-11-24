const MAX_FRAME_GAP = 1000;

function createTrack() {
  return {
    value: null,
    durationMs: 0,
  };
}

export function createTemporalTracker() {
  return {
    lastTimestamp: null,
    eyeState: createTrack(),
    yawDirection: createTrack(),
    pitchDirection: createTrack(),
  };
}

function updateTrack(track, nextValue, deltaMs) {
  if (nextValue === null || nextValue === undefined) {
    track.value = null;
    track.durationMs = 0;
    return;
  }

  if (track.value === nextValue) {
    track.durationMs += deltaMs;
    return;
  }

  track.value = nextValue;
  track.durationMs = 0;
}

export function updateTemporalTracker(tracker, faceState, timestamp) {
  if (
    !tracker ||
    !Number.isFinite(timestamp) ||
    !tracker.eyeState ||
    !tracker.yawDirection ||
    !tracker.pitchDirection
  ) {
    return null;
  }

  let deltaMs = 0;
  let resetTracks = false;

  if (tracker.lastTimestamp !== null) {
    const difference = timestamp - tracker.lastTimestamp;

    if (difference >= 0 && difference <= MAX_FRAME_GAP) {
      deltaMs = difference;
    } else {
      resetTracks = true;
    }
  }

  if (resetTracks) {
    tracker.eyeState = createTrack();
    tracker.yawDirection = createTrack();
    tracker.pitchDirection = createTrack();
  }

  if (!faceState) {
    updateTrack(tracker.eyeState, null, 0);
    updateTrack(tracker.yawDirection, null, 0);
    updateTrack(tracker.pitchDirection, null, 0);
  } else {
    updateTrack(tracker.eyeState, faceState.eyeState, deltaMs);
    updateTrack(tracker.yawDirection, faceState.headDirection?.yaw, deltaMs);
    updateTrack(
      tracker.pitchDirection,
      faceState.headDirection?.pitch,
      deltaMs,
    );
  }

  tracker.lastTimestamp = timestamp;

  return {
    eyeState: {
      value: tracker.eyeState.value,
      durationMs: tracker.eyeState.durationMs,
    },
    yawDirection: {
      value: tracker.yawDirection.value,
      durationMs: tracker.yawDirection.durationMs,
    },
    pitchDirection: {
      value: tracker.pitchDirection.value,
      durationMs: tracker.pitchDirection.durationMs,
    },
  };
}

export function resetTemporalTracker(tracker) {
  if (!tracker) return;

  tracker.lastTimestamp = null;
  tracker.eyeState = createTrack();
  tracker.yawDirection = createTrack();
  tracker.pitchDirection = createTrack();
}
