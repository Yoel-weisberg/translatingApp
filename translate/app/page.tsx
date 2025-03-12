"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TranslateScreen from "@/components/translate-screen"
import PracticeScreen from "@/components/practice-screen"
import AllCardsScreen from "@/components/all-cards-screen"
import { setupGlobalErrorHandlers } from "@/lib/error-handlers"
import { registerServiceWorker } from "@/lib/register-sw"
import { useEffect } from "react"
import SupportScreen from "@/components/support-screen"
import { AnimatedCoffeeIcon } from "@/components/animated-coffee-icon"

export default function Home() {
  useEffect(() => {
    setupGlobalErrorHandlers()
    registerServiceWorker()

    // Verify that IndexedDB is working and settings are accessible
    const verifySettings = async () => {
      try {
        const { getSetting } = await import("@/lib/db")
        const sourceLanguage = await getSetting("sourceLanguage", null)
        const targetLanguage = await getSetting("targetLanguage", null)

        console.log("Initial language settings:", { sourceLanguage, targetLanguage })
      } catch (error) {
        console.error("Error verifying settings:", error)
      }
    }

    verifySettings()
  }, [])

  return (
    <main className="flex flex-col bg-black text-white h-[100dvh] max-h-[100dvh] overflow-hidden">
      <Tabs defaultValue="translate" className="w-full h-full flex flex-col">
        <div className="flex justify-center pt-4 pb-2">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="translate" className="text-white data-[state=active]:bg-zinc-700">
              translate
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-white data-[state=active]:bg-zinc-700">
              practice
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-white data-[state=active]:bg-zinc-700">
              cards
            </TabsTrigger>
            <TabsTrigger value="helpMe" className="text-white data-[state=active]:bg-zinc-700">
              <AnimatedCoffeeIcon />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="translate" className="h-full m-0 p-0">
            <TranslateScreen />
          </TabsContent>

          <TabsContent value="practice" className="h-full m-0 p-0">
            <PracticeScreen />
          </TabsContent>

          <TabsContent value="cards" className="h-full m-0 p-0">
            <AllCardsScreen />
          </TabsContent>

          <TabsContent value="helpMe" className="h-full m-0 p-0">
            <SupportScreen />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

