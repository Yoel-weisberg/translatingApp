"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Star, Shuffle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type Flashcard,
  getActiveCards,
  getKnownCards,
  getUnknownCards,
  addActiveCard,
  addKnownCard,
  addUnknownCard,
  deleteActiveCard,
  deleteUnknownCard,
  clearKnownCards,
  clearUnknownCards,
  getSetting,
  saveSetting,
  migrateFromLocalStorage,
} from "@/lib/db"

export default function PracticeScreen() {
  const [allActiveCards, setAllActiveCards] = useState<Flashcard[]>([])
  const [filteredActiveCards, setFilteredActiveCards] = useState<Flashcard[]>([])
  const [knownCards, setKnownCards] = useState<Flashcard[]>([])
  const [unknownCards, setUnknownCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const cardRef = useRef<HTMLDivElement>(null)
  const [dbInitialized, setDbInitialized] = useState(false)

  // Initialize and load data from IndexedDB
  useEffect(() => {
    const initializeData = async () => {
      try {
        // First, migrate any existing data from localStorage
        await migrateFromLocalStorage()

        // Load cards from IndexedDB
        const activeCards = await getActiveCards()
        const savedKnownCards = await getKnownCards()
        const savedUnknownCards = await getUnknownCards()
        const savedSelectedLanguage = await getSetting("selectedLanguage", "all")

        setAllActiveCards(activeCards)
        setKnownCards(savedKnownCards)
        setUnknownCards(savedUnknownCards)
        setSelectedLanguage(savedSelectedLanguage as string)

        // Filter cards based on selected language
        filterCardsByLanguage(activeCards, savedSelectedLanguage as string)

        setDbInitialized(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing data:", error)
        toast.error("Failed to load cards", {
          description: "There was an error loading your cards. Please try again.",
        })
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  // Filter cards based on selected language
  const filterCardsByLanguage = (cards: Flashcard[], language: string) => {
    if (language === "all") {
      setFilteredActiveCards(cards)
    } else {
      const filtered = cards.filter(
        (card) =>
          card.sourceLang.toLowerCase() === language.toLowerCase() ||
          card.targetLang.toLowerCase() === language.toLowerCase(),
      )
      setFilteredActiveCards(filtered)
    }

    // Reset current index when filtering
    setCurrentIndex(0)
  }

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  // Save selected language whenever it changes
  useEffect(() => {
    if (dbInitialized) {
      saveSetting("selectedLanguage", selectedLanguage)
    }
  }, [selectedLanguage, dbInitialized])

  const goToNextCard = () => {
    // Reset flip state first
    setIsFlipped(false)

    // Use setTimeout to ensure the flip reset is applied before changing cards
    setTimeout(() => {
      if (currentIndex < filteredActiveCards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else if (filteredActiveCards.length > 0) {
        // Loop back to the first card if we're at the end
        setCurrentIndex(0)
      }
    }, 100) // Small delay to ensure flip animation completes
  }

  const goToPrevCard = () => {
    // Reset flip state first
    setIsFlipped(false)

    // Use setTimeout to ensure the flip reset is applied before changing cards
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (filteredActiveCards.length > 0) {
        // Loop to the last card if we're at the beginning
        setCurrentIndex(filteredActiveCards.length - 1)
      }
    }, 100) // Small delay to ensure flip animation completes
  }

  const shuffleCards = () => {
    const shuffled = [...filteredActiveCards].sort(() => Math.random() - 0.5)
    setFilteredActiveCards(shuffled)
    toast("Cards shuffled")
  }

  const toggleFavorite = () => {
    // In a real app, you would implement favorite functionality here
    toast("Favorite toggled")
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const markCardAs = async (status: "known" | "unknown") => {
    if (filteredActiveCards.length === 0) return

    // Reset flip state first
    setIsFlipped(false)

    try {
      const currentCard = filteredActiveCards[currentIndex]
      const updatedCard = { ...currentCard, status }

      // Remove card from active deck (both filtered and all)
      const updatedFilteredActiveCards = [...filteredActiveCards]
      updatedFilteredActiveCards.splice(currentIndex, 1)
      setFilteredActiveCards(updatedFilteredActiveCards)

      const updatedAllActiveCards = allActiveCards.filter((card) => card.id !== currentCard.id)
      setAllActiveCards(updatedAllActiveCards)

      // Delete from active cards in DB
      await deleteActiveCard(currentCard.id)

      // Add to appropriate array and DB
      if (status === "known") {
        await addKnownCard(updatedCard)
        setKnownCards([...knownCards, updatedCard])
      } else {
        await addUnknownCard(updatedCard)
        setUnknownCards([...unknownCards, updatedCard])
      }

      // Adjust current index if needed
      if (currentIndex >= updatedFilteredActiveCards.length && updatedFilteredActiveCards.length > 0) {
        setCurrentIndex(updatedFilteredActiveCards.length - 1)
      }
    } catch (error) {
      console.error("Error marking card:", error)
      toast.error("Failed to update card", {
        description: "There was an error updating your card. Please try again.",
      })
    }
  }

  // Get all unique languages from all cards
  const availableLanguages = useMemo(() => {
    const allCards = [...allActiveCards, ...knownCards, ...unknownCards]
    const languageMap = new Map<string, string>() // lowercase key -> original case value

    allCards.forEach((card) => {
      // Add source language with proper capitalization
      const sourceLangLower = card.sourceLang.toLowerCase()
      if (!languageMap.has(sourceLangLower)) {
        languageMap.set(sourceLangLower, card.sourceLang)
      }

      // Add target language with proper capitalization
      const targetLangLower = card.targetLang.toLowerCase()
      if (!languageMap.has(targetLangLower)) {
        languageMap.set(targetLangLower, card.targetLang)
      }
    })

    // Convert map values to array and sort alphabetically
    return Array.from(languageMap.values()).sort()
  }, [allActiveCards, knownCards, unknownCards])

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    filterCardsByLanguage(allActiveCards, language)
  }

  const practiceUnknownCards = async () => {
    // Move unknown cards back to active deck
    const filteredUnknown =
      selectedLanguage === "all"
        ? unknownCards
        : unknownCards.filter(
            (card) =>
              card.sourceLang.toLowerCase() === selectedLanguage.toLowerCase() ||
              card.targetLang.toLowerCase() === selectedLanguage.toLowerCase(),
          )

    if (filteredUnknown.length === 0) {
      toast.error("No unknown cards to practice", {
        description: "You haven't marked any cards as unknown yet.",
      })
      return
    }

    try {
      // Add unknown cards to active deck in DB and state
      for (const card of filteredUnknown) {
        await deleteUnknownCard(card.id)
        await addActiveCard(card)
      }

      // Update state
      const updatedActiveCards = [...allActiveCards, ...filteredUnknown]
      setAllActiveCards(updatedActiveCards)

      // Filter by language
      filterCardsByLanguage(updatedActiveCards, selectedLanguage)

      // Clear unknown cards
      const remainingUnknownCards = unknownCards.filter((card) => !filteredUnknown.some((u) => u.id === card.id))
      setUnknownCards(remainingUnknownCards)

      toast.success("Unknown cards added to practice", {
        description: `Added ${filteredUnknown.length} cards to practice.`,
      })
    } catch (error) {
      console.error("Error moving unknown cards:", error)
      toast.error("Failed to move cards", {
        description: "There was an error moving your cards. Please try again.",
      })
    }
  }

  const resetAllCards = async () => {
    try {
      // Reset all cards back to active deck
      const allCards = [...allActiveCards, ...knownCards, ...unknownCards]

      // Clear known and unknown cards
      await clearKnownCards()
      await clearUnknownCards()

      // Add all cards to active cards
      for (const card of knownCards.concat(unknownCards)) {
        await addActiveCard(card)
      }

      // Update state
      setAllActiveCards(allCards)
      filterCardsByLanguage(allCards, selectedLanguage)
      setKnownCards([])
      setUnknownCards([])
      setCurrentIndex(0)

      toast("All cards reset for practice")
    } catch (error) {
      console.error("Error resetting cards:", error)
      toast.error("Failed to reset cards", {
        description: "There was an error resetting your cards. Please try again.",
      })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (allActiveCards.length === 0 && knownCards.length === 0 && unknownCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-xl mb-4">No flashcards yet</p>
        <p className="text-zinc-400">Translate some text and add it to practice to create flashcards</p>
      </div>
    )
  }

  if (filteredActiveCards.length === 0) {
    // Filter unknown cards based on selected language
    const filteredUnknown =
      selectedLanguage === "all"
        ? unknownCards
        : unknownCards.filter(
            (card) =>
              card.sourceLang.toLowerCase() === selectedLanguage.toLowerCase() ||
              card.targetLang.toLowerCase() === selectedLanguage.toLowerCase(),
          )

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 bg-red-900 rounded-full text-white mr-2">
              {unknownCards.length}
            </div>
            <div className="flex items-center justify-center h-8 w-8 bg-green-900 rounded-full text-white">
              {knownCards.length}
            </div>
          </div>

          <Button
            variant="outline"
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            onClick={resetAllCards}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xl mb-4">
            {allActiveCards.length > 0
              ? `No cards available for ${selectedLanguage !== "all" ? selectedLanguage : "practice"}`
              : "All cards reviewed!"}
          </p>
          <div className="flex gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 bg-red-900 rounded-full text-white text-2xl mx-auto mb-2">
                {unknownCards.length}
              </div>
              <p className="text-zinc-400">Unknown</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 bg-green-900 rounded-full text-white text-2xl mx-auto mb-2">
                {knownCards.length}
              </div>
              <p className="text-zinc-400">Known</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {filteredUnknown.length > 0 && (
              <Button
                variant="outline"
                className="bg-red-900 text-white border-zinc-700 hover:bg-red-800"
                onClick={practiceUnknownCards}
              >
                Practice Unknown Words ({filteredUnknown.length})
              </Button>
            )}

            {allActiveCards.length > 0 && selectedLanguage !== "all" && (
              <Button
                variant="outline"
                className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                onClick={() => handleLanguageChange("all")}
              >
                Show All Languages
              </Button>
            )}

            <Button
              variant="outline"
              className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
              onClick={resetAllCards}
            >
              Practice All Cards
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = filteredActiveCards[currentIndex]

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] max-h-[calc(100vh-60px)]">
      <div className="flex items-center justify-between p-2">
        <Button variant="ghost" size="icon" onClick={shuffleCards}>
          <Shuffle className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 bg-red-900 rounded-full text-white">
            {unknownCards.length}
          </div>
          <div className="text-zinc-400">
            {currentIndex + 1} / {filteredActiveCards.length}
          </div>
          <div className="flex items-center justify-center h-8 w-8 bg-green-900 rounded-full text-white">
            {knownCards.length}
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-full bg-white"
          style={{ width: `${((currentIndex + 1) / filteredActiveCards.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        {/* Card container with perspective for 3D effect */}
        <div className="w-full max-w-xs perspective-1000">
          {/* Flashcard with flip and swipe functionality */}
          <div
            key={currentCard?.id || currentIndex}
            ref={cardRef}
            className={`relative w-full aspect-[3/4] preserve-3d transition-transform duration-500 cursor-pointer ${isFlipped ? "rotate-y-180" : ""}`}
            onClick={flipCard}
          >
            {/* Front of card (source text) */}
            <div className="absolute w-full h-full backface-hidden bg-zinc-200 rounded-lg flex items-center justify-center">
              <div className="text-black text-4xl font-bold p-4 text-center">{currentCard?.sourceText || ""}</div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-black"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite()
                }}
              >
                <Star className="h-5 w-5" />
              </Button>
            </div>

            {/* Back of card (translation) */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-200 rounded-lg flex items-center justify-center">
              <div className="text-black text-4xl font-bold p-4 text-center">{currentCard?.translatedText || ""}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 p-2">
        <Button
          variant="outline"
          className="flex-1 rounded-full bg-red-900 border-zinc-700 hover:bg-red-800"
          onClick={() => markCardAs("unknown")}
        >
          Don't Know
        </Button>

        <Button
          variant="outline"
          className="flex-1 rounded-full bg-green-900 border-zinc-700 hover:bg-green-800"
          onClick={() => markCardAs("known")}
        >
          Know
        </Button>
      </div>

      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-zinc-800 text-white border-zinc-700 rounded-full hover:bg-zinc-700"
            >
              {selectedLanguage === "all" ? "All Languages" : selectedLanguage}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800 border-zinc-700">
            <DropdownMenuLabel>Filter by Language</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              className="capitalize cursor-pointer hover:bg-zinc-700 text-white"
              onClick={() => handleLanguageChange("all")}
            >
              All Languages
            </DropdownMenuItem>
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang}
                className="cursor-pointer hover:bg-zinc-700 text-white"
                onClick={() => handleLanguageChange(lang)}
              >
                {lang}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

