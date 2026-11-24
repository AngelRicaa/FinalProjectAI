function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildDatasetFeatures(faceFeatures, faceState, temporalState) {
  if (!faceFeatures || !faceState || !temporalState) {
    return null;
  }

  const requiredValues = [
    faceFeatures.averageEAR,
    faceFeatures.headYaw,
    faceFeatures.headPitch,
    faceFeatures.headRoll,
    temporalState.eyeState?.durationMs,
    temporalState.yawDirection?.durationMs,
    temporalState.pitchDirection?.durationMs,
  ];

  if (!requiredValues.every(isValidNumber)) {
    return null;
  }

  const eyeState = faceState.eyeState;
  const yawDirection = faceState.headDirection?.yaw;
  const pitchDirection = faceState.headDirection?.pitch;

  if (
    !["open", "squinting", "closed"].includes(eyeState) ||
    !["left", "right", "neutral"].includes(yawDirection) ||
    !["down", "neutral"].includes(pitchDirection)
  ) {
    return null;
  }

  return {
    averageEAR: faceFeatures.averageEAR,
    headYaw: faceFeatures.headYaw,
    headPitch: faceFeatures.headPitch,
    headRoll: faceFeatures.headRoll,
    eyeState,
    eyeDuration: temporalState.eyeState.durationMs,
    yawDirection,
    yawDuration: temporalState.yawDirection.durationMs,
    pitchDirection,
    pitchDuration: temporalState.pitchDirection.durationMs,
  };
}
