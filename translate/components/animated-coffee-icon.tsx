"use client"

import { Coffee } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function AnimatedCoffeeIcon() {
  const [isSparkle, setIsSparkle] = useState(false)

  useEffect(() => {
    // Initial sparkle when component mounts
    setIsSparkle(true)

    const timeout = setTimeout(() => {
      setIsSparkle(false)
    }, 2000)

    // Set up interval to sparkle every 2 minutes
    const interval = setInterval(() => {
      setIsSparkle(true)

      // Turn off sparkle after 2 seconds
      setTimeout(() => {
        setIsSparkle(false)
      }, 2000)
    }, 2000) // 2 minutes = 120000ms

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-orange-500 p-1.5 transition-all duration-300",
        isSparkle && "animate-sparkle",
      )}
    >
      <Coffee className="h-4 w-4 text-white" />
      {isSparkle && <span className="absolute inset-0 rounded-full bg-orange-400/30 animate-ping" />}
    </div>
  )
}

