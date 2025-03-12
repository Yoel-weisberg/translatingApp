const DB_NAME = "language-learning-db"
const DB_VERSION = 1
const STORES = {
  ACTIVE_CARDS: "active-cards",
  KNOWN_CARDS: "known-cards",
  UNKNOWN_CARDS: "unknown-cards",
  SETTINGS: "settings",
}

export type Flashcard = {
  id: number
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  status?: "known" | "unknown" | null
}

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (_event) => {
      console.error("IndexedDB error:", request.error)
      reject(request.error)
    }

    request.onsuccess = (_event) => {
      resolve(request.result)
    }

    request.onupgradeneeded = (_event) => {
      const db = request.result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.ACTIVE_CARDS)) {
        db.createObjectStore(STORES.ACTIVE_CARDS, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(STORES.KNOWN_CARDS)) {
        db.createObjectStore(STORES.KNOWN_CARDS, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(STORES.UNKNOWN_CARDS)) {
        db.createObjectStore(STORES.UNKNOWN_CARDS, { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: "key" })
      }
    }
  })
}

// Get all items from a store\
export const getAllItems = async <T>(storeName: string)
: Promise<T[]> =>
{
  try {
    const db = await initDB()
    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error getting items from ${storeName}:`, error)
    return [];
  }
}

// Add an item to a store
export const addItem = async <T>(storeName: string, item: T)
: Promise<T> =>
{
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error adding item to ${storeName}:`, error)
    throw error
  }
}

// Update an item in a store
export const updateItem = async <T>(storeName: string, item: T)
: Promise<T> =>
{
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = () => {
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error updating item in ${storeName}:`, error)
    throw error
  }
}

// Delete an item from a store
export const deleteItem = async (storeName: string, id: number): Promise<void> => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error(`Error deleting item from ${storeName}:`, error)
    throw error
  }
}

// Clear all items from a store
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error(`Error clearing store ${storeName}:`, error)
    throw error
  }
}

// Get a setting value
export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => {
        // Check if the result exists AND has a value property
        if (request.result && request.result.value !== undefined) {
          resolve(request.result.value);
        } else {
          // If the setting doesn't exist, initialize it with the default value
          // This ensures it exists for future requests
          saveSetting(key, defaultValue)
            .then(() => {
              resolve(defaultValue);
            })
            .catch((err) => {
              console.error(`Error initializing setting ${key}:`, err);
              resolve(defaultValue);
            });
        }
      };

      request.onerror = () => {
        console.error(`Error in request for setting ${key}:`, request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Improved version of saveSetting with additional validation
export const saveSetting = async <T>(key: string, value: T): Promise<void> => {
  // If value is undefined or null, log a warning but continue with saving
  // This way we're not silently failing when problematic values are passed
  if (value === undefined || value === null) {
    console.warn(`Warning: Attempting to save ${key} with ${value} value. This may cause issues.`);
  }
  
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      
      // Create a proper object to store
      const settingObject = { key: key, value: value };
      const request = store.put(settingObject);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Error in request for saving setting ${key}:`, request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
};
// Helper functions for cards
export const getActiveCards = (): Promise<Flashcard[]> => {
  return getAllItems<Flashcard>(STORES.ACTIVE_CARDS)
}

export const getKnownCards = (): Promise<Flashcard[]> => {
  return getAllItems<Flashcard>(STORES.KNOWN_CARDS)
}

export const getUnknownCards = (): Promise<Flashcard[]> => {
  return getAllItems<Flashcard>(STORES.UNKNOWN_CARDS)
}

export const addActiveCard = (card: Flashcard): Promise<Flashcard> => {
  return addItem<Flashcard>(STORES.ACTIVE_CARDS, card)
}

export const addKnownCard = (card: Flashcard): Promise<Flashcard> => {
  return addItem<Flashcard>(STORES.KNOWN_CARDS, card)
}

export const addUnknownCard = (card: Flashcard): Promise<Flashcard> => {
  return addItem<Flashcard>(STORES.UNKNOWN_CARDS, card)
}

export const deleteActiveCard = (id: number): Promise<void> => {
  return deleteItem(STORES.ACTIVE_CARDS, id)
}

export const deleteKnownCard = (id: number): Promise<void> => {
  return deleteItem(STORES.KNOWN_CARDS, id)
}

export const deleteUnknownCard = (id: number): Promise<void> => {
  return deleteItem(STORES.UNKNOWN_CARDS, id)
}

export const clearActiveCards = (): Promise<void> => {
  return clearStore(STORES.ACTIVE_CARDS)
}

export const clearKnownCards = (): Promise<void> => {
  return clearStore(STORES.KNOWN_CARDS)
}

export const clearUnknownCards = (): Promise<void> => {
  return clearStore(STORES.UNKNOWN_CARDS)
}

// Migrate data from localStorage to IndexedDB (one-time operation)
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    // Check if migration has already been done
    const migrated = await getSetting("localStorage_migrated", false)
    if (migrated) return

    // Get data from localStorage
    const activeCards = JSON.parse(localStorage.getItem("flashcards") || "[]")
    const knownCards = JSON.parse(localStorage.getItem("knownCards") || "[]")
    const unknownCards = JSON.parse(localStorage.getItem("unknownCards") || "[]")
    const selectedLanguage = localStorage.getItem("selectedLanguage") || "all"

    // Save to IndexedDB
    const db = await initDB()

    // Active cards
    const activeTransaction = db.transaction(STORES.ACTIVE_CARDS, "readwrite")
    const activeStore = activeTransaction.objectStore(STORES.ACTIVE_CARDS)
    activeCards.forEach((card: Flashcard) => {
      activeStore.add(card)
    })

    // Known cards
    const knownTransaction = db.transaction(STORES.KNOWN_CARDS, "readwrite")
    const knownStore = knownTransaction.objectStore(STORES.KNOWN_CARDS)
    knownCards.forEach((card: Flashcard) => {
      knownStore.add(card)
    })

    // Unknown cards
    const unknownTransaction = db.transaction(STORES.UNKNOWN_CARDS, "readwrite")
    const unknownStore = unknownTransaction.objectStore(STORES.UNKNOWN_CARDS)
    unknownCards.forEach((card: Flashcard) => {
      unknownStore.add(card)
    })

    // Settings
    const settingsTransaction = db.transaction(STORES.SETTINGS, "readwrite")
    const settingsStore = settingsTransaction.objectStore(STORES.SETTINGS)
    settingsStore.put({ key: "selectedLanguage", value: selectedLanguage })

    // Mark migration as complete
    await saveSetting("localStorage_migrated", true)

    // Close the database
    db.close()

    console.log("Migration from localStorage to IndexedDB completed")
  } catch (error) {
    console.error("Error migrating from localStorage:", error)
  }
}

