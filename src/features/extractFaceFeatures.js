import { calculateBothEyesEAR } from "./eyeFeatures";
import { calculateHeadPoseFromMatrix } from "./headPose";

export function extractFaceFeatures(landmarks, transformationMatrix) {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  const eyeFeatures = calculateBothEyesEAR(landmarks);
  const headFeatures = calculateHeadPoseFromMatrix(transformationMatrix);

  return {
    ...eyeFeatures,
    ...headFeatures,
  };
}
