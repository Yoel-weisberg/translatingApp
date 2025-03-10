// Service Worker for Language Learning PWA
const CACHE_NAME = "language-learning-pwa-v1"

// Assets to cache on install
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// App shell assets (critical UI components)
const APP_SHELL = ["/app/page", "/app/globals.css"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Attempting to cache static assets")

        // Cache each asset individually with logging
        return Promise.all(
          [...STATIC_ASSETS, ...APP_SHELL].map((url) => {
            return fetch(url)
              .then((response) => {
                if (!response.ok) {
                  console.error(`Failed to cache: ${url}, status: ${response.status}`)
                  return
                }
                console.log(`Successfully cached: ${url}`)
                return cache.put(url, response)
              })
              .catch((error) => {
                console.error(`Error caching ${url}:`, error)
              })
          }),
        )
      })
      .then(() => {
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        // Claim clients so the service worker is in control immediately
        return self.clients.claim()
      }),
  )
})

// Helper function to determine if a request is an API call
const isApiRequest = (url) => {
  return url.includes("/api/")
}

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return (
    url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    STATIC_ASSETS.includes(url) ||
    APP_SHELL.includes(url)
  )
}

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Handle API requests (network first, then offline fallback)
  if (isApiRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If it's a successful response, clone it and store in cache
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              // Cache the API response for offline use
              // Only cache successful API responses
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // If it's a translation API request that failed, return a custom response
            if (event.request.url.includes("/api/translate")) {
              return new Response(
                JSON.stringify({
                  translation: "[Offline] Translation not available. Please connect to the internet.",
                  offline: true,
                }),
                {
                  headers: { "Content-Type": "application/json" },
                },
              )
            }

            // For other API requests, return a generic error
            return new Response(
              JSON.stringify({
                error: "You are offline and this resource is not cached.",
                offline: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            )
          })
        }),
    )
    return
  }

  // For static assets, use cache-first strategy
  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        // If not in cache, fetch from network and cache
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      }),
    )
    return
  }

  // For HTML navigation requests, use network-first strategy
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          // Return cached page if available
          if (cachedResponse) {
            return cachedResponse
          }

          // If not in cache, try to serve the root page
          return caches.match("/")
        })
      }),
    )
    return
  }

  // Default strategy for everything else: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response if it's valid
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      }),
  )
})

// Background sync for offline translations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-translations") {
    event.waitUntil(syncTranslations())
  }
})

// Function to sync translations that were made offline
async function syncTranslations() {
  try {
    // Get all pending translations from IndexedDB
    const pendingTranslations = await getPendingTranslationsFromDB()

    // Process each pending translation
    for (const translation of pendingTranslations) {
      try {
        // Try to send the translation request
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(translation),
        })

        if (response.ok) {
          // If successful, remove from pending
          await removePendingTranslationFromDB(translation.id)

          // Notify the user if the app is open
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "TRANSLATION_SYNCED",
                translation: translation,
              })
            })
          })
        }
      } catch (error) {
        console.error("Error syncing translation:", error)
      }
    }
  } catch (error) {
    console.error("Error in syncTranslations:", error)
  }
}

// Placeholder functions for IndexedDB operations
// These would need to be implemented with actual IndexedDB code
async function getPendingTranslationsFromDB() {
  // This would retrieve pending translations from IndexedDB
  return []
}

async function removePendingTranslationFromDB(id) {
  // This would remove a pending translation from IndexedDB
  return true
}

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "New notification from Language Learning PWA",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "Language Learning PWA", options))
  } catch (error) {
    console.error("Error showing notification:", error)
  }
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus()
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    }),
  )
})

// Log service worker lifecycle events for debugging
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

console.log("Service Worker Loaded")

