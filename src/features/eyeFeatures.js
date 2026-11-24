// src/features/eyeFeatures.js

// Urutan titik: p1, p2, p3, p4, p5, p6
// Indeks berdasarkan topology MediaPipe Face Mesh.

export const RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144];

export const LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

// Menghitung jarak Euclidean antara dua titik
function distance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

// Menghitung Eye Aspect Ratio
export function calculateEAR(landmarks, indices) {
  if (!landmarks || !indices || indices.length !== 6) {
    return null;
  }

  const points = indices.map((index) => landmarks[index]);

  if (points.some((point) => !point)) {
    return null;
  }

  const [p1, p2, p3, p4, p5, p6] = points;

  const vertical1 = distance(p2, p6);
  const vertical2 = distance(p3, p5);
  const horizontal = distance(p1, p4);

  if (horizontal === 0) {
    return null;
  }

  return (vertical1 + vertical2) / (2 * horizontal);
}

// Menghitung EAR kedua mata
export function calculateBothEyesEAR(landmarks) {
  const rightEAR = calculateEAR(landmarks, RIGHT_EYE_INDICES);

  const leftEAR = calculateEAR(landmarks, LEFT_EYE_INDICES);

  if (rightEAR === null || leftEAR === null) {
    return {
      rightEAR,
      leftEAR,
      averageEAR: null,
    };
  }

  return {
    rightEAR,
    leftEAR,
    averageEAR: (rightEAR + leftEAR) / 2,
  };
}
