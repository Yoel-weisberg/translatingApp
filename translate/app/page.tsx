"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TranslateScreen from "@/components/translate-screen"
import PracticeScreen from "@/components/practice-screen"
import AllCardsScreen from "@/components/all-cards-screen"
import { setupGlobalErrorHandlers } from "@/lib/error-handlers"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <Tabs defaultValue="translate" className="w-full">
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
          </TabsList>
        </div>

        <TabsContent value="translate" className="h-[calc(100vh-60px)]">
          <TranslateScreen />
        </TabsContent>

        <TabsContent value="practice" className="h-[calc(100vh-60px)]">
          <PracticeScreen />
        </TabsContent>

        <TabsContent value="cards" className="h-[calc(100vh-60px)]">
          <AllCardsScreen />
        </TabsContent>
      </Tabs>
    </main>
  )
}

