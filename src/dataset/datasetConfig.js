export const DATASET_CLASSES = [
  {
    id: "focused",
    name: "Focused",
    description:
      "Pengguna mempertahankan perhatian pada aktivitas utama di layar.",
    instruction:
      "Bacalah materi yang ditampilkan di layar dan pertahankan perhatian pada materi tersebut.",
    activity: "reading",
  },
  {
    id: "distracted",
    name: "Distracted",
    description: "Pengguna sengaja mengalihkan perhatian dari aktivitas utama.",
    instruction:
      "Alihkan pandangan dari layar menuju objek lain di sekitar Anda, lalu pertahankan perhatian pada objek tersebut.",
    activity: "looking_away",
  },
  {
    id: "drowsy",
    name: "Drowsy",
    description:
      "Pengguna menyimulasikan perilaku yang berkaitan dengan rasa mengantuk.",
    instruction:
      "Simulasikan kondisi mengantuk secara aman melalui kedipan lambat, menguap, atau memejamkan mata sebentar. Jangan memaksakan diri untuk tidur.",
    activity: "drowsiness_simulation",
  },
];

export function getDatasetClass(classId) {
  return (
    DATASET_CLASSES.find((datasetClass) => datasetClass.id === classId) ?? null
  );
}
