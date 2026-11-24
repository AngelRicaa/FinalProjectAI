const DATABASE_NAME = "focusly_dataset";
const DATABASE_VERSION = 1;
const STORE_NAME = "sessions";

function openDatasetDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "sessionId",
        });

        store.createIndex("participantId", "participantId", {
          unique: false,
        });

        store.createIndex("classId", "classId", {
          unique: false,
        });

        store.createIndex("startedAt", "startedAt", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      reject(new Error("Database sedang digunakan oleh tab lain."));
    };
  });
}

export async function saveDatasetSession(session) {
  if (!session || !session.sessionId || !session.participantId) {
    throw new Error("Data sesi atau Participant ID tidak valid.");
  }

  const database = await openDatasetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(session);

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function getAllDatasetSessions() {
  const database = await openDatasetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function getDatasetSessionsByParticipant(participantId) {
  const database = await openDatasetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("participantId");
    const request = index.getAll(participantId);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function deleteAllDatasetSessions() {
  const database = await openDatasetDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.clear();

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
}
