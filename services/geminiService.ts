import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateVisualPrompt = async (
  scriptContent: string,
  templateContent: string,
  theme: string
): Promise<string> => {
  const ai = getClient();
  
  // 1. Pre-processing: Substitute placeholders in the template
  // We use regex to be flexible with spaces around the brackets or colons
  let processedPrompt = templateContent;

  // Replace [Theme: YYYYY]
  // Regex looks for [Theme: ... ] or [Theme:...] allowing for variation
  const themeRegex = /\[\s*Theme\s*:[^\]]*\]/gi;
  if (themeRegex.test(processedPrompt)) {
    processedPrompt = processedPrompt.replace(themeRegex, `[Theme: ${theme}]`);
  } else {
    // Fallback if placeholder isn't found exactly, just append it or warn
    // For this specific app, we'll prepend if missing, or assume the prompt instructions handle it.
    // However, the user request specifically asked to "fill in", so we try our best.
    console.warn("Theme placeholder not found in template, proceeding anyway.");
  }

  // Replace [Paste Script]
  const scriptRegex = /\[\s*Paste\s+Script\s*\]/gi;
  if (scriptRegex.test(processedPrompt)) {
    processedPrompt = processedPrompt.replace(scriptRegex, scriptContent);
  } else {
    // If [Paste Script] is missing, we append the script at the end or inject it
    processedPrompt = `${processedPrompt}\n\n[Script Content]:\n${scriptContent}`;
  }

  // 2. Add the Output Formatting Instructions
  const finalPrompt = `
${processedPrompt}

---
IMPORTANT INSTRUCTION:
Please generate the output based on the content above.

OUTPUT FORMAT

Source Context:
Source Context 1: ......
Source Context 2: ......

Prompt:
Prompt 1: ...
Prompt 2: .....

(Note:
- List only the prompts. No commentary, no spacing between lines.
- If the script implies a connection to a previous section, continue the numbering logic appropriately.)
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: finalPrompt,
    });
    
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content. Please check your API key and try again.");
  }
};