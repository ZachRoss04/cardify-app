// import pdfParse from "pdf-parse"; // Temporarily commented out due to loading issues
import mammoth from "mammoth";
import fetch from "node-fetch";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import dotenv from "dotenv";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist");

// Load environment variables
dotenv.config();

// Configure Gemini API
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const modelName = "gemini-2.5-flash-preview-04-17"; // As per user request

const generationConfig = {
  temperature: 0.2,
  maxOutputTokens: 8190, // Increased from 8000, Gemini 1.5 Flash has 8192 output limit
  responseMimeType: "application/json",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const model = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig,
  safetySettings
});

export default async function handler(req, res) {
  // Only allow POST method
  // Log incoming request details for debugging
  console.log(`--- INCOMING REQUEST ---`);
  console.log(`source_type: ${req.body.source_type}`);
  console.log(`source_content snippet (first 100 chars): ${String(req.body.source_content).substring(0, 100)}`);
  console.log(`deck_title: ${req.body.deck_title}`);
  console.log(`options: ${JSON.stringify(req.body.options)}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      source_type, 
      source_content,
      deck_title,  
      options = {} 
    } = req.body;

    // Extract and set defaults for options
    const {
      card_count = 20,
      cloze_style = "single",
      instruction = ""
    } = options;

    // Validate required inputs
    if (!source_type || !source_content) {
      return res.status(400).json({ 
        error: 'Missing required fields: source_type and source_content are required' 
      });
    }

    // 1) Extract text based on source type
    let text;
    let numPages = null; // To store page count from PDFs
    if (source_type === "pdf") {
      console.log("[PDF Processing] Started for direct PDF upload.");
      try {
        console.log("[PDF Processing] Started for direct PDF upload with pdfjs-dist.");
        const dataBuffer = Buffer.from(source_content, "base64");
        const pdfDocument = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
        numPages = pdfDocument.numPages;
        let extractedText = "";
        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const tokenizedText = await page.getTextContent();
          extractedText += tokenizedText.items.map(token => token.str).join(" ") + "\n"; 
        }
        text = extractedText.trim();
        
        if (!text) { 
          console.warn("[PDF Processing] Extracted text from PDF (pdfjs-dist) is empty.");
          return res.status(400).json({ error: 'The PDF provided appears to have no readable text content (pdfjs-dist).' });
        }
        console.log(`[PDF Processing] Extracted text from PDF (pdfjs-dist). Length: ${text.length}, Pages: ${numPages}`);
        console.log(`[PDF Processing] Text snippet (first 100 chars): ${text.substring(0,100)}`);
      } catch (err) {
        console.error("[PDF Processing] Error parsing direct PDF upload (pdfjs-dist):", err);
        if (err.name === 'PasswordException') {
            return res.status(400).json({ error: 'The PDF is password-protected and cannot be processed.' });
        } else if (err.name === 'InvalidPDFException') {
            return res.status(400).json({ error: 'The PDF is invalid or corrupted.' });
        }
        return res.status(500).json({ error: 'Failed to parse the uploaded PDF file with pdfjs-dist. It might be corrupted or an unsupported format.' });
      }
    } else if (source_type === "url") {
      try {
        console.log(`Fetching content from URL: ${source_content}`);
        const resp = await fetch(source_content);
        if (!resp.ok) {
          console.error(`Failed to fetch URL: ${source_content}, status: ${resp.status}`);
          return res.status(500).json({ error: `Failed to fetch URL: ${resp.statusText}` });
        }

        const contentType = resp.headers.get("content-type") || ""; // Default to empty string if null
        console.log(`[URL Processing] Content-Type: ${contentType}`);

        if (contentType.includes("application/pdf")) {
          console.log("[URL Processing] Detected PDF content from URL. Starting PDF parse.");
          try {
            console.log("[URL Processing] Detected PDF content from URL. Starting PDF parse with pdfjs-dist.");
            const pdfArrayBuffer = await resp.arrayBuffer();
            const uint8Array = new Uint8Array(pdfArrayBuffer);
            const pdfDocument = await pdfjsLib.getDocument({ data: uint8Array }).promise;
            numPages = pdfDocument.numPages;
            let extractedText = "";
            for (let i = 1; i <= numPages; i++) {
              const page = await pdfDocument.getPage(i);
              const tokenizedText = await page.getTextContent();
              extractedText += tokenizedText.items.map(token => token.str).join(" ") + "\n";
            }
            text = extractedText.trim();

            if (!text) { 
              console.warn(`[URL Processing] Extracted text from PDF URL ${source_content} (pdfjs-dist) is empty.`);
              return res.status(400).json({ error: 'The PDF URL provided (pdfjs-dist) appears to have no readable text content.' });
            }
            console.log(`[URL Processing] Extracted text from PDF URL (pdfjs-dist). Length: ${text.length}, Pages: ${numPages}`);
            console.log(`[URL Processing] PDF URL text snippet (first 100 chars): ${text.substring(0,100)}`);
          } catch (err) {
            console.error(`[URL Processing] Error parsing PDF from URL ${source_content} (pdfjs-dist):`, err);
            if (err.name === 'PasswordException') {
                return res.status(400).json({ error: 'The PDF from URL is password-protected and cannot be processed.' });
            } else if (err.name === 'InvalidPDFException') {
                return res.status(400).json({ error: 'The PDF from URL is invalid or corrupted.' });
            }
            return res.status(500).json({ error: 'Failed to parse the PDF content from the URL with pdfjs-dist. The file might be corrupted or an unsupported format.' });
          }
        } else if (contentType.includes("text/html")) {
          console.log("[URL Processing] Detected HTML content. Using Readability.");
          const html = await resp.text();
          const doc = new JSDOM(html);
          const reader = new Readability(doc.window.document);
          const article = reader.parse();
          
          if (!article || !article.textContent) {
            console.error(`[URL Processing] Readability failed to extract content from HTML URL: ${source_content}`);
            return res.status(500).json({ error: 'Failed to extract readable content from the HTML URL using Readability.' });
          }
          text = article.textContent;

          if (text && text.trim()) {
            console.log(`[URL Processing] Extracted HTML text length: ${text.length}`);
            console.log(`[URL Processing] Extracted HTML text snippet (first 100): ${text.substring(0,100)}`);
          } else {
            console.log(`[URL Processing] Text extracted by Readability is null, empty, or only whitespace for URL: ${source_content}`);
            return res.status(400).json({ error: 'The HTML URL provided appears to have no readable content after processing or only whitespace.' });
          }
        } else {
          console.warn(`[URL Processing] Unsupported content type: '${contentType}' from URL: ${source_content}`);
          return res.status(400).json({ error: `Unsupported content type '${contentType}' from URL. Only HTML and PDF URLs are currently processed.` });
        }
      } catch (e) {
        console.error(`Error processing URL ${source_content}:`, e);
        return res.status(500).json({ error: 'An error occurred while processing the URL.' });
      }
    } else if (source_type === "docx") {
      console.log("[DOCX Processing] Started for DOCX upload.");
      try {
        const buffer = Buffer.from(source_content, "base64");
        const { value: rawText } = await mammoth.extractRawText({ buffer });
        text = rawText;
        if (!text || !text.trim()) {
          console.warn("[DOCX Processing] Extracted text from DOCX is empty or only whitespace.");
          return res.status(400).json({ error: 'The DOCX provided appears to have no readable text content or only whitespace.' });
        }
        console.log(`[DOCX Processing] Extracted text from DOCX. Length: ${text.length}`);
        console.log(`[DOCX Processing] Text snippet (first 100): ${text.substring(0,100)}`);
      } catch (err) {
        console.error("[DOCX Processing] Error parsing DOCX file:", err);
        return res.status(500).json({ error: 'Failed to parse the DOCX file. It might be corrupted or an unsupported format.' });
      }
    } else {
      // Assume it's raw text
      console.log("[Raw Text Processing] Processing raw text input.");
      text = source_content;
      if (!text || !text.trim()) {
        console.warn("[Raw Text Processing] Input text is empty or only whitespace.");
        return res.status(400).json({ error: 'The provided text is empty or only whitespace.' });
      }
      console.log(`[Raw Text Processing] Text length: ${text.length}`);
      console.log(`[Raw Text Processing] Text snippet (first 100): ${text.substring(0,100)}`);
    }

    // Log text state before building prompt
    console.log(`[Pre-Gemini] Final text length for Gemini: ${text ? text.length : 'undefined or null'}`);
    console.log(`[Pre-Gemini] Final text snippet for Gemini (first 100): ${text ? text.substring(0,100) : 'N/A'}`);

    // 2) Construct the prompt for Gemini
    let cardStyleInstructions = '';
    if (cloze_style === 'single') {
      cardStyleInstructions = `
Card Style (Single Cloze):
- Create statements with ONE blank using "____" (e.g., "The capital of France is ____.").
- The 'back' of the card should be the word(s) that fill the blank (e.g., "Paris").
- Ensure blanks are meaningful and test key information.
`;
    } else if (cloze_style === 'multi') {
      cardStyleInstructions = `
Card Style (Multi-Cloze):
- Create statements with MULTIPLE blanks using "____" (e.g., "____ is the capital of ____, known for the ____.").
- The 'back' of the card should be a JSON array of strings corresponding to the blanks in order (e.g., ["Paris", "France", "Eiffel Tower"]).
- Ensure blanks are meaningful and test key information.
`;
    } else if (cloze_style === 'qa') {
      cardStyleInstructions = `
Card Style (Question & Answer):
- Generate clear and concise questions for the 'front' of the card.
- Provide accurate and direct answers for the 'back' of the card.
- Do NOT use cloze deletion (e.g., {{c1::...}}) for this style.
- Focus on testing key information through well-formed questions and answers.
`;
    }

    const fullPrompt = `
You are an expert AI assistant specializing in creating high-quality educational flashcards.

${cardStyleInstructions}

When creating each flashcard, adhere to these critical guidelines for selecting the blank (the '____' part) and its corresponding answer:

When creating each flashcard, adhere to these critical guidelines for selecting the blank (the '____' part) and its corresponding answer:

1.  **Crucial & Specific Information**: The blank (____) MUST replace a piece of *specific and crucial information* that represents a core concept, key finding, methodology, or unique terminology from the text. Prioritize nouns, verbs, specific adjectives/adverbs, dates, names, or technical terms. The goal is for the user to recall this *precise* information. Avoid blanking out information that is overly general if more specific, important details are available from the text.
2.  **Natural Placement**: The blank should be placed where the information naturally occurs in the sentence. The sentence should still read grammatically correctly with the blank.
3.  **Testability & Uniqueness**: The information replaced by the blank should be specific enough to be a good test of knowledge and ideally have a unique or very limited set of correct answers *within the context of the provided text*. Avoid blanks that could have many plausible general answers if more specific testable information exists. Also, avoid making blanks for information that is common knowledge or not central to the main topic of the provided text.
4.  **Avoid Trivial Blanks**: Do not replace articles (a, an, the), simple prepositions, or conjunctions unless they are part of a key phrase or idiom that is the learning objective.
5.  **Variety in Position and Type**: If generating multiple cards from a single piece of text, vary the *type* of information blanked out and its *position* in the sentence. **Actively try to place blanks at the beginning, middle, and end of sentences when pedagogically appropriate and natural. For example, '____ was the first person to walk on the moon.' is a valid and good format.**
6.  **Context is Key**: Ensure enough context remains so the user can reasonably deduce the answer. The front of the card should not be ambiguous.
7.  **Single Blank Per Card (for "single" cloze_style)**: If cloze_style is "single", ensure only ONE blank (____) per "front" of the card.
8.  **Multiple Blanks (for "multiple" cloze_style)**: If cloze_style is "multiple", you can use several blanks in a single "front", but ensure they are related and the card remains a fair test.
9.  **Embrace Initial Blanks**: Do not shy away from placing a blank at the beginning of a sentence if it tests a key piece of information that would naturally start a statement or question. E.g., '____ is the powerhouse of the cell.' or 'The term ____ refers to the study of insects.'
10. **Prefer Specifics over Generalities**: When choosing what to blank out, if there's a choice between a general term (e.g., 'data', 'information', 'method') and a more specific term used in the article (e.g., 'pixel data', 'semantic information', 'contrastive learning method'), prefer blanking out the *more specific term* as it's likely more central to the article's unique contribution and testable value. 

Your entire response must be *only* a valid JSON array of flashcards. Do not include any explanatory text, markdown formatting, or anything else before or after the JSON array itself.

JSON Schema:
[
  {
    "front": "<For cloze: A complete, natural-sounding sentence derived from the source text, with a crucial keyword or short phrase replaced by a cloze blank (e.g., ____). For Q&A: A clear and concise question.>",
    "back": "<For single cloze: The exact keyword or short phrase that was removed. For multi-cloze: A JSON array of strings for each blank in order (e.g., [\"Paris\", \"France\"]). For Q&A: An accurate and direct answer.>",  
    "source_page": <Page number from the source text if available, otherwise null.>,
    "context_snippet": "<A brief (approx. 20 words) snippet from the source text that provides context for the flashcard, ideally containing the 'back' term. This snippet MUST be valid UTF-8 text and should exclude any binary data or unescaped control characters. If the original snippet contains such characters, rephrase or omit them to ensure JSON validity.>"
  }
]

From the provided "Text" below, you MUST generate a JSON array containing exactly ${card_count} flashcards, following all the guidelines and the JSON schema above.
Respect the custom instruction: "${instruction}".

Text:
${text}
`.trim();

    // 3) Call Gemini
    console.log(`Sending request to Gemini model: ${modelName} with text length: ${text.length}`);
    const geminiResult = await model.generateContent(fullPrompt);
    const geminiResponse = geminiResult.response;
    
    if (!geminiResponse || !geminiResponse.candidates || geminiResponse.candidates.length === 0 || !geminiResponse.candidates[0].content || !geminiResponse.candidates[0].content.parts || geminiResponse.candidates[0].content.parts.length === 0) {
        console.error('Invalid response structure from Gemini:', geminiResponse);
        let errorDetails = 'No specific details provided by API.';
        let finishReason = null;

        if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates[0]) {
            finishReason = geminiResponse.candidates[0].finishReason;
            console.error('Gemini finishReason:', finishReason);
            if (geminiResponse.candidates[0].safetyRatings) {
                console.error('Gemini safetyRatings:', geminiResponse.candidates[0].safetyRatings);
            }
            if (finishReason === 'SAFETY') {
                 errorDetails = geminiResponse.promptFeedback || 'Content generation blocked due to safety settings.';
                 return res.status(400).json({
                    error: 'Content generation blocked due to safety settings.',
                    details: errorDetails
                });
            }
             if (finishReason === 'RECITATION') {
                 errorDetails = 'Content generation blocked due to recitation policy.';
                 return res.status(400).json({
                    error: 'Content generation blocked due to recitation policy.',
                    details: errorDetails
                });
            }
        }
        return res.status(500).json({ error: 'Invalid or empty response from Gemini API', details: errorDetails });
    }

    const geminiOutputText = geminiResponse.candidates[0].content.parts[0].text;
    console.log('Raw Gemini Output (first 500 chars):', geminiOutputText.substring(0, 500)); // Log a snippet of raw output

    // Parse the response and return the deck with metadata
    let cards;
    try {
      // Gemini might sometimes wrap JSON in markdown backticks if not explicitly told not to.
      // Attempt to strip markdown if present.
      const cleanedJsonText = geminiOutputText.replace(/^```json\n|```json|```$/g, '').trim();
      cards = JSON.parse(cleanedJsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Gemini response content (that failed to parse):', geminiOutputText);
      return res.status(500).json({
        error: 'Failed to parse Gemini response. The AI may have been unable to process the input or returned an unexpected format.',
        details: geminiOutputText // Send the actual Gemini response for debugging
      });
    }

    // Ensure cards is an array, as expected by the rest of the system
    if (!Array.isArray(cards)) {
        console.error('OpenAI response was valid JSON but not an array:', cards);
        return res.status(500).json({
            error: 'OpenAI response was valid JSON but not the expected array format.',
            details: cards
        });
    }
    
    // It's important to use the res object passed into the handler
    res.json({ 
      deck_title: deck_title || "Generated Deck",
      created_at: new Date().toISOString(),
      card_count: cards.length,
      cards 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
