"use client"

import { Button } from "@/components/ui/button"
import { Coffee, Heart } from "lucide-react"
import { useSwipeable } from "react-swipeable"

export default function SupportScreen() {
  // Add swipe handlers for navigation between tabs
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      // Navigate to translate tab
      const translateTab = document.querySelector('[value="translate"]') as HTMLElement
      if (translateTab) translateTab.click()
    },
    onSwipedRight: () => {
      // Navigate to cards tab
      const cardsTab = document.querySelector('[value="cards"]') as HTMLElement
      if (cardsTab) cardsTab.click()
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div {...swipeHandlers} className="flex flex-col h-full p-6 overflow-y-auto">
      <div className="max-w-md mx-auto flex flex-col items-center text-center">
        <div className="bg-amber-600 p-4 rounded-full mb-6">
          <Coffee className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Fuel This Learning Journey</h1>

        <p className="text-zinc-400 mb-6">
          This app is ad-free to enhance your learning experience, but servers and
          translations aren't. Your support keeps language learning accessible for everyone.
        </p>

        <div className="space-y-4 mb-8">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Your contribution powers:</h3>
            <ul className="text-zinc-400 text-left space-y-2">
              <li className="flex items-start">
                <Heart className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Fast, reliable translation services</span>
              </li>
              <li className="flex items-start">
                <Heart className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>New features like pronunciation and grammar checks</span>
              </li>
              <li className="flex items-start">
                <Heart className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>More languages and offline learning tools</span>
              </li>
            </ul>
          </div>
        </div>

        <a
          href="https://buymeacoffee.com/translateandlearn"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 py-6">
            <Coffee className="h-5 w-5" />
            <span className="font-bold">Buy me some FUEL</span>
          </Button>
        </a>

        <p className="text-xs text-zinc-500 mt-6">
          Every cup fuels better learning tools for thousands of language enthusiasts.
        </p>
      </div>
    </div>
  )
}