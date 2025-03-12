"use client"

import { Toaster } from "sonner"

export function SonnerProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#27272a", // zinc-800
          color: "white",
          border: "1px solid #3f3f46", // zinc-700
        },
        duration: 500, // Set toast duration to 500ms
      }}
    />
  )
}

