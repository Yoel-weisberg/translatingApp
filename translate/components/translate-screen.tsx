"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftRight, Loader2, Search, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { languages, commonLanguages } from "@/lib/languages"
import { addActiveCard, getSetting, saveSetting, initDB } from "@/lib/db"

// Maximum character limit for translations
const MAX_CHARS = 40

// Debounce function to delay API calls while typing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function TranslateScreen() {
  // Start with null or loading state values
  const [inputText, setInputText] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<String | null>(null); // Start with null
  const [targetLanguage, setTargetLanguage] = useState<String | null>(null); // Start with null
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add a loading state

  // Language name memoization
  const sourceLanguageName = useMemo(() => {
    if (!sourceLanguage) return ""; // Handle null case
    return languages.find((lang) => lang.code === sourceLanguage)?.name || sourceLanguage;
  }, [sourceLanguage]);

  const targetLanguageName = useMemo(() => {
    if (!targetLanguage) return ""; // Handle null case
    return languages.find((lang) => lang.code === targetLanguage)?.name || targetLanguage;
  }, [targetLanguage]);

  // Load saved language preferences
  useEffect(() => {
    async function loadLanguagePreferences() {
      try {
        
        // Force IndexedDB to initialize first
        await initDB();
        
        // Load source language with a default of "es"
        const savedSourceLang = await getSetting("sourceLanguage", "source");
        
        // Load target language with a default of "en"
        const savedTargetLang = await getSetting("targetLanguage", "target");
        
        // Set both languages at once to avoid multiple renders
        setSourceLanguage(savedSourceLang);
        setTargetLanguage(savedTargetLang);
        
        // Mark loading as complete
        setIsLoading(false);
      } catch (error) {
        // Set defaults if there was an error
        setSourceLanguage("source");
        setTargetLanguage("targ");
        setIsLoading(false);
      }
    }
    
    loadLanguagePreferences();
  }, []); // Empty dependency array - only run once on mount

  // Save language preferences when they change
  useEffect(() => {
    // Only save if we're not in the loading state and both languages have values
    if (!isLoading && sourceLanguage && targetLanguage) {
      async function saveLanguagePreferences() {
        try {
          await saveSetting("sourceLanguage", sourceLanguage);
          
          await saveSetting("targetLanguage", targetLanguage);
          
        } catch (error) {
          console.error("Failed to save language preferences:", error);
        }
      }
      
      saveLanguagePreferences();
    }
  }, [sourceLanguage, targetLanguage, isLoading]);

  // Custom language selection handlers with additional logging
  const selectSourceLanguage = (code: string) => {
    setSourceLanguage(code);
    setSourceSearchQuery("");
  };

  const selectTargetLanguage = (code: string) => {
    setTargetLanguage(code);
    setTargetSearchQuery("");
  };

  // Debounce the input text to avoid excessive API calls
  const debouncedInputText = useDebounce(inputText, 800) // 800ms delay
  const debouncedSourceSearch = useDebounce(sourceSearchQuery, 300)
  const debouncedTargetSearch = useDebounce(targetSearchQuery, 300)

  // Filter languages based on search query
  const filteredSourceLanguages = useMemo(() => {
    if (!debouncedSourceSearch) return languages
    return languages.filter((lang) => lang.name.toLowerCase().includes(debouncedSourceSearch.toLowerCase()))
  }, [debouncedSourceSearch])

  const filteredTargetLanguages = useMemo(() => {
    if (!debouncedTargetSearch) return languages
    return languages.filter((lang) => lang.name.toLowerCase().includes(debouncedTargetSearch.toLowerCase()))
  }, [debouncedTargetSearch])

  // Check if input exceeds character limit
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInputText(text)
    setIsOverLimit(text.length > MAX_CHARS)

    if (text.length > MAX_CHARS) {
      toast.error(`Character limit exceeded (${MAX_CHARS})`, {
        description: "Please shorten your text for translation.",
      })
    }
  }

  // Memoize the translate function to avoid recreating it on every render
  const translateText = useCallback(
    async (text: string) => {
      if (!text.trim() || text.trim().length < 2 || text.length > MAX_CHARS) {
        setTranslation("")
        return
      }

      try {
        setIsTranslating(true)

        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            sourceLanguage,
            targetLanguage,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Translation failed")
        }

        setTranslation(data.translation)
      } catch (error) {
        console.error("Translation error:", error)
        toast.error("Translation failed", {
          description: error instanceof Error ? error.message : "Could not translate text. Please try again.",
        })
        setTranslation("")
      } finally {
        setIsTranslating(false)
      }
    },
    [sourceLanguage, targetLanguage],
  )

  // Effect to trigger translation when debounced input text changes
  useEffect(() => {
    if (debouncedInputText && !isOverLimit) {
      translateText(debouncedInputText)
    }
  }, [debouncedInputText, translateText, isOverLimit])

  // Effect to trigger translation when languages change (if there's text to translate)
  useEffect(() => {
    if (inputText.trim() && !isOverLimit) {
      translateText(inputText)
    }
  }, [sourceLanguage, targetLanguage, translateText, inputText, isOverLimit])

  const addToPractice = async () => {
    if (!inputText || !translation) return

    try {
      // Create new flashcard
      const newCard = {
        id: Date.now(),
        sourceText: inputText,
        translatedText: translation,
        sourceLang: sourceLanguageName,
        targetLang: targetLanguageName,
      }

      // Add to IndexedDB
      await addActiveCard(newCard)

      toast.success("Added to practice", {
        description: "This translation has been added to your practice cards.",
      })
    } catch (error) {
      console.error("Error adding card:", error)
      toast.error("Failed to add card", {
        description: "There was an error adding your card. Please try again.",
      })
    }
  }

  const swapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    setInputText(translation);
    setTranslation(inputText);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="relative flex-1 min-h-0">
          <Textarea
            placeholder="Enter text "
            className={`h-full min-h-[150px] bg-transparent border-none text-white text-3xl resize-none focus-visible:ring-0 focus-visible:ring-offset-0 ${isOverLimit ? "text-red-400" : ""}`}
            value={inputText}
            onChange={handleInputChange}
          />
          {isOverLimit && (
            <div className="absolute top-2 right-2 text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {inputText.length}/{MAX_CHARS}
              </span>
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-800 my-4" />

        <div className="flex-1 text-zinc-400 text-3xl relative min-h-0 overflow-auto">
          {isTranslating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            translation || "translation"
          )}
        </div>
      </div>

      <div className="p-4 mt-auto">
        <Button
          variant="outline"
          className="w-full mb-4 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
          onClick={addToPractice}
          disabled={!translation || isTranslating || isOverLimit}
        >
          Add to practice
        </Button>

        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 bg-zinc-800 text-white border-zinc-700 rounded-full hover:bg-zinc-700"
              >
                {sourceLanguageName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border-zinc-700 max-h-[60vh] overflow-y-auto w-[250px]">
              <DropdownMenuLabel>Source Language</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <div className="flex items-center px-2 py-1 rounded-md bg-zinc-700">
                  <Search className="h-4 w-4 mr-2 text-zinc-400" />
                  <Input
                    placeholder="Search languages..."
                    className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={sourceSearchQuery}
                    onChange={(e) => setSourceSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <DropdownMenuSeparator className="bg-zinc-700" />

              {!debouncedSourceSearch && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-zinc-400">Common Languages</DropdownMenuLabel>
                    {commonLanguages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        className="cursor-pointer hover:bg-zinc-700 text-white"
                        onClick={() => selectSourceLanguage(lang.code)}
                      >
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuLabel className="text-xs text-zinc-400">All Languages</DropdownMenuLabel>
                </>
              )}

              {filteredSourceLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  className="cursor-pointer hover:bg-zinc-700 text-white"
                  onClick={() => {
                    setSourceLanguage(lang.code)
                    setSourceSearchQuery("")
                  }}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="mx-2" onClick={swapLanguages}>
            <ArrowLeftRight className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 bg-zinc-800 text-white border-zinc-700 rounded-full hover:bg-zinc-700"
              >
                {targetLanguageName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border-zinc-700 max-h-[60vh] overflow-y-auto w-[250px]">
              <DropdownMenuLabel>Target Language</DropdownMenuLabel>
              <div className="px-2 py-1.5">
                <div className="flex items-center px-2 py-1 rounded-md bg-zinc-700">
                  <Search className="h-4 w-4 mr-2 text-zinc-400" />
                  <Input
                    placeholder="Search languages..."
                    className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={targetSearchQuery}
                    onChange={(e) => setTargetSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <DropdownMenuSeparator className="bg-zinc-700" />

              {!debouncedTargetSearch && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-zinc-400">Common Languages</DropdownMenuLabel>
                    {commonLanguages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        className="cursor-pointer hover:bg-zinc-700 text-white"
                        onClick={() => {
                          selectTargetLanguage(lang.code)
                        }}
                      >
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuLabel className="text-xs text-zinc-400">All Languages</DropdownMenuLabel>
                </>
              )}

              {filteredTargetLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  className="cursor-pointer hover:bg-zinc-700 text-white"
                  onClick={() => {
                    setTargetLanguage(lang.code)
                    setTargetSearchQuery("")
                  }}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

