function invalidHeadPose() {
  return {
    headYaw: null,
    headPitch: null,
    headRoll: null,
  };
}

export function calculateHeadPoseFromMatrix(matrix) {
  if (
    !matrix ||
    matrix.rows !== 4 ||
    matrix.columns !== 4 ||
    !matrix.data ||
    matrix.data.length !== 16
  ) {
    return invalidHeadPose();
  }

  const data = matrix.data;

  if (!Array.from(data).every(Number.isFinite)) {
    return invalidHeadPose();
  }

  const scaleX = Math.hypot(data[0], data[1], data[2]);
  const scaleY = Math.hypot(data[4], data[5], data[6]);
  const scaleZ = Math.hypot(data[8], data[9], data[10]);

  if (scaleX < 1e-8 || scaleY < 1e-8 || scaleZ < 1e-8) {
    return invalidHeadPose();
  }

  const r00 = data[0] / scaleX;
  const r10 = data[1] / scaleX;
  const r20 = data[2] / scaleX;

  const r21 = data[6] / scaleY;
  const r22 = data[10] / scaleZ;

  const yaw = Math.atan2(r10, r00);
  const pitch = Math.asin(Math.max(-1, Math.min(1, -r20)));
  const roll = Math.atan2(r21, r22);

  const toDegrees = (value) => value * (180 / Math.PI);

  return {
    headYaw: toDegrees(pitch),
    headPitch: toDegrees(roll),
    headRoll: toDegrees(yaw),
  };
}
