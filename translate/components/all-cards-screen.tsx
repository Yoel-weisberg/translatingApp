"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  type Flashcard,
  getActiveCards,
  getKnownCards,
  getUnknownCards,
  addActiveCard,
  addKnownCard,
  addUnknownCard,
  deleteActiveCard,
  deleteKnownCard,
  deleteUnknownCard,
  clearActiveCards,
  clearKnownCards,
  clearUnknownCards,
  migrateFromLocalStorage,
} from "@/lib/db"

export default function AllCardsScreen() {
  const [activeCards, setActiveCards] = useState<Flashcard[]>([])
  const [knownCards, setKnownCards] = useState<Flashcard[]>([])
  const [unknownCards, setUnknownCards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "known" | "unknown">("all")

  useEffect(() => {
    const loadCards = async () => {
      try {
        // First, migrate any existing data from localStorage
        await migrateFromLocalStorage()

        // Load cards from IndexedDB
        const savedActiveCards = await getActiveCards()
        const savedKnownCards = await getKnownCards()
        const savedUnknownCards = await getUnknownCards()

        setActiveCards(savedActiveCards)
        setKnownCards(savedKnownCards)
        setUnknownCards(savedUnknownCards)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading cards:", error)
        toast.error("Failed to load cards", {
          description: "There was an error loading your cards. Please try again.",
        })
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  const resetAllCards = async () => {
    try {
      // Reset all cards back to active deck
      const allCards = [...activeCards, ...knownCards, ...unknownCards]

      // Clear all stores
      await clearActiveCards()
      await clearKnownCards()
      await clearUnknownCards()

      // Add all cards to active cards
      for (const card of allCards) {
        await addActiveCard(card)
      }

      // Update state
      setActiveCards(allCards)
      setKnownCards([])
      setUnknownCards([])

      toast("All cards reset for practice")
    } catch (error) {
      console.error("Error resetting cards:", error)
      toast.error("Failed to reset cards", {
        description: "There was an error resetting your cards. Please try again.",
      })
    }
  }

  const moveCardTo = async (card: Flashcard, destination: "active" | "known" | "unknown") => {
    try {
      // First, remove the card from all arrays to prevent duplication
      const updatedActiveCards = activeCards.filter((c) => c.id !== card.id)
      const updatedKnownCards = knownCards.filter((c) => c.id !== card.id)
      const updatedUnknownCards = unknownCards.filter((c) => c.id !== card.id)

      // Update the card's status
      const updatedCard = {
        ...card,
        status: destination === "known" ? "known" : destination === "unknown" ? "unknown" : null,
      }

      // Delete from all stores
      await deleteActiveCard(card.id)
      await deleteKnownCard(card.id)
      await deleteUnknownCard(card.id)

      // Add to the appropriate store
      if (destination === "active") {
        await addActiveCard(updatedCard)
        setActiveCards([...updatedActiveCards, updatedCard])
        setKnownCards(updatedKnownCards)
        setUnknownCards(updatedUnknownCards)
      } else if (destination === "known") {
        await addKnownCard(updatedCard)
        setActiveCards(updatedActiveCards)
        setKnownCards([...updatedKnownCards, updatedCard])
        setUnknownCards(updatedUnknownCards)
      } else if (destination === "unknown") {
        await addUnknownCard(updatedCard)
        setActiveCards(updatedActiveCards)
        setKnownCards(updatedKnownCards)
        setUnknownCards([...updatedUnknownCards, updatedCard])
      }
    } catch (error) {
      console.error("Error moving card:", error)
      toast.error("Failed to update card", {
        description: "There was an error updating your card. Please try again.",
      })
    }
  }

  const deleteCard = async (card: Flashcard) => {
    try {
      // Remove card from all stores
      await deleteActiveCard(card.id)
      await deleteKnownCard(card.id)
      await deleteUnknownCard(card.id)

      // Update state
      setActiveCards(activeCards.filter((c) => c.id !== card.id))
      setKnownCards(knownCards.filter((c) => c.id !== card.id))
      setUnknownCards(unknownCards.filter((c) => c.id !== card.id))

      toast("Card deleted", {
        description: `"${card.sourceText}" has been removed.`,
      })
    } catch (error) {
      console.error("Error deleting card:", error)
      toast.error("Failed to delete card", {
        description: "There was an error deleting your card. Please try again.",
      })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (activeCards.length === 0 && knownCards.length === 0 && unknownCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-xl mb-4">No flashcards yet</p>
        <p className="text-zinc-400">Translate some text and add it to practice to create flashcards</p>
      </div>
    )
  }

  // Determine which cards to display based on filter
  let cardsToDisplay: Flashcard[] = []
  if (filter === "all") {
    cardsToDisplay = [...activeCards, ...knownCards, ...unknownCards]
  } else if (filter === "active") {
    cardsToDisplay = activeCards
  } else if (filter === "known") {
    cardsToDisplay = knownCards
  } else if (filter === "unknown") {
    cardsToDisplay = unknownCards
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] max-h-[calc(100vh-60px)]">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">All Cards</h2>
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            onClick={resetAllCards}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className={filter === "all" ? "bg-zinc-700" : "bg-zinc-800 border-zinc-700"}
            onClick={() => setFilter("all")}
          >
            All ({activeCards.length + knownCards.length + unknownCards.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            className={filter === "active" ? "bg-zinc-700" : "bg-zinc-800 border-zinc-700"}
            onClick={() => setFilter("active")}
          >
            Active ({activeCards.length})
          </Button>
          <Button
            variant={filter === "known" ? "default" : "outline"}
            size="sm"
            className={filter === "known" ? "bg-green-900" : "bg-zinc-800 border-zinc-700"}
            onClick={() => setFilter("known")}
          >
            Known ({knownCards.length})
          </Button>
          <Button
            variant={filter === "unknown" ? "default" : "outline"}
            size="sm"
            className={filter === "unknown" ? "bg-red-900" : "bg-zinc-800 border-zinc-700"}
            onClick={() => setFilter("unknown")}
          >
            Unknown ({unknownCards.length})
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {cardsToDisplay.map((card) => {
            // Determine card status
            let statusColor = "bg-zinc-800"
            let statusIcon = null
            let currentStatus: "active" | "known" | "unknown" = "active"

            if (knownCards.some((c) => c.id === card.id)) {
              statusColor = "bg-green-900"
              statusIcon = <CheckCircle className="h-5 w-5 text-green-500" />
              currentStatus = "known"
            } else if (unknownCards.some((c) => c.id === card.id)) {
              statusColor = "bg-red-900"
              statusIcon = <XCircle className="h-5 w-5 text-red-500" />
              currentStatus = "unknown"
            }

            return (
              <Card key={card.id} className={`${statusColor} border-zinc-700`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-lg font-medium">{card.sourceText}</p>
                      <p className="text-zinc-400">{card.translatedText}</p>
                      <div className="flex items-center mt-2 text-xs text-zinc-500">
                        <span className="capitalize">{card.sourceLang}</span>
                        <span className="mx-1">→</span>
                        <span className="capitalize">{card.targetLang}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 rounded-full ${
                            currentStatus === "known" ? "bg-green-700" : "bg-green-900/20 hover:bg-green-900/40"
                          }`}
                          onClick={() => currentStatus !== "known" && moveCardTo(card, "known")}
                          disabled={currentStatus === "known"}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 rounded-full ${
                            currentStatus === "unknown" ? "bg-red-700" : "bg-red-900/20 hover:bg-red-900/40"
                          }`}
                          onClick={() => currentStatus !== "unknown" && moveCardTo(card, "unknown")}
                          disabled={currentStatus === "unknown"}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-zinc-800/50 hover:bg-zinc-700"
                          onClick={() => deleteCard(card)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

