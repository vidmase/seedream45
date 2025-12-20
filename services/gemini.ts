const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`;

export const enhancePrompt = async (currentPrompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key");
  }
  const systemInstruction = `You are a professional prompt engineer for AI image generation (e.g. Midjourney, Stable Diffusion). 
  Your task is to take a simple user prompt and enhance it into a highly detailed, descriptive, and artistic prompt.
  
  Guidelines:
  - Add details about lighting, texture, composition, style, and mood.
  - Keep it under 100 words.
  - Do NOT add explanations or conversational filler. Return ONLY the enhanced prompt.
  - If the prompt references specific variables like @image1, preserve them exactly.
  - Use comma-separated descriptors.
  
  Example Input: "A cat sitting on a wall"
  Example Output: "A fluffy cinematic cat sitting on a weathered stone wall, golden hour lighting, depth of field, highly detailed, 8k, photorealistic, warm atmosphere"`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\nInput Prompt: "${currentPrompt}"\n\nEnhanced Prompt:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API detailed error:", errorData);
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const enhancedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return enhancedText ? enhancedText.trim() : currentPrompt;
  } catch (error) {
    console.error("Failed to enhance prompt:", error);
    throw error;
  }
};
