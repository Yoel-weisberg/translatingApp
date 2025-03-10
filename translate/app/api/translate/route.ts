import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json()

    // Google Translate API endpoint
    const url = "https://translation.googleapis.com/language/translate/v2"

    // Call Google Translate API
    const response = await fetch(`${url}?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: "text",
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("Google Translate API error:", data.error)
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const translation = data.data.translations[0].translatedText

    return NextResponse.json({ translation })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Failed to translate text" }, { status: 500 })
  }
}

