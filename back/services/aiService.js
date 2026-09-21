// Tout ce qui touche au fournisseur d'IA est isolé ici.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent'

// Le prompt du mentor. On demande du JSON pour pouvoir l'exploiter
// facilement côté front (feedback + catégorie de cours conseillée).
function buildPrompt(categories) {
    return `You are Kalon Mentor, a warm and encouraging art mentor.
Analyse the drawing and give constructive feedback on anatomy, perspective,
composition and values. Never be harsh: point out what works before what
can be improved.

Answer ONLY with a valid JSON object, no markdown, no backticks:
{
  "summary": "one or two encouraging sentences about the drawing",
  "strengths": ["what the artist did well", "..."],
  "improvements": [
    { "area": "anatomy | perspective | composition | values", "comment": "concrete, actionable advice" }
  ],
  "category": "the single weakest area, chosen from: ${categories.join(', ')}"
}`
}

async function analyseDrawing(imageBuffer, categories) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing in .env')
    }

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: buildPrompt(categories) },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageBuffer.toString('base64'),
                            },
                        },
                    ],
                },
            ],
        }),
    })

    if (!response.ok) {
        throw new Error(`AI request failed (${response.status})`)
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
        throw new Error('Empty response from the AI')
    }

    // Le modèle entoure parfois le JSON de ```json ... ```, on nettoie
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    return JSON.parse(cleaned)
}

module.exports = { analyseDrawing }