"use client"

export function setupGlobalErrorHandlers() {
  if (typeof window !== "undefined") {
    // Handle uncaught exceptions
    window.addEventListener("error", (event) => {
      console.error("Global error caught:", event.error)
      // Prevent default browser error handling
      event.preventDefault()
      return true
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason)
      // Prevent default browser error handling
      event.preventDefault()
      return true
    })
  }
}

