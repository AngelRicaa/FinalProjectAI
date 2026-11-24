function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function classifyYaw(currentYaw, neutralYaw, leftYaw, rightYaw) {
  const delta = currentYaw - neutralYaw;
  const leftDelta = leftYaw - neutralYaw;
  const rightDelta = rightYaw - neutralYaw;

  if (delta * leftDelta > 0 && Math.abs(delta) >= Math.abs(leftDelta) / 2) {
    return "left";
  }

  if (delta * rightDelta > 0 && Math.abs(delta) >= Math.abs(rightDelta) / 2) {
    return "right";
  }

  return "neutral";
}

function classifyPitch(currentPitch, neutralPitch, downPitch) {
  const delta = currentPitch - neutralPitch;
  const downDelta = downPitch - neutralPitch;

  if (delta * downDelta > 0 && Math.abs(delta) >= Math.abs(downDelta) / 2) {
    return "down";
  }

  return "neutral";
}

export function classifyFaceState(features, calibration) {
  if (!features || !calibration || !calibration.valid) {
    return null;
  }

  const conditions = calibration.conditions;

  const requiredValues = [
    features.averageEAR,
    features.headYaw,
    features.headPitch,
    features.headRoll,
    conditions.eyesOpen?.averageEAR?.median,
    conditions.eyesSquinting?.averageEAR?.median,
    conditions.eyesClosed?.averageEAR?.median,
    conditions.neutral?.headYaw?.median,
    conditions.neutral?.headPitch?.median,
    conditions.neutral?.headRoll?.median,
    conditions.headLeft?.headYaw?.median,
    conditions.headRight?.headYaw?.median,
    conditions.headDown?.headPitch?.median,
  ];

  if (!requiredValues.every(isValidNumber)) {
    return null;
  }

  const openEAR = conditions.eyesOpen.averageEAR.median;
  const squintEAR = conditions.eyesSquinting.averageEAR.median;
  const closedEAR = conditions.eyesClosed.averageEAR.median;

  if (!(openEAR > squintEAR && squintEAR > closedEAR)) {
    return null;
  }

  const openSquintThreshold = (openEAR + squintEAR) / 2;
  const squintClosedThreshold = (squintEAR + closedEAR) / 2;

  let eyeState = "closed";

  if (features.averageEAR >= openSquintThreshold) {
    eyeState = "open";
  } else if (features.averageEAR >= squintClosedThreshold) {
    eyeState = "squinting";
  }

  const neutralYaw = conditions.neutral.headYaw.median;
  const neutralPitch = conditions.neutral.headPitch.median;
  const neutralRoll = conditions.neutral.headRoll.median;

  return {
    eyeState,
    headDirection: {
      yaw: classifyYaw(
        features.headYaw,
        neutralYaw,
        conditions.headLeft.headYaw.median,
        conditions.headRight.headYaw.median,
      ),
      pitch: classifyPitch(
        features.headPitch,
        neutralPitch,
        conditions.headDown.headPitch.median,
      ),
    },
    headDeviation: {
      yaw: features.headYaw - neutralYaw,
      pitch: features.headPitch - neutralPitch,
      roll: features.headRoll - neutralRoll,
    },
  };
}
