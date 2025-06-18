// import pdfParse from "pdf-parse"; // Temporarily commented out due to loading issues
import mammoth from "mammoth";
import fetch from "node-fetch";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Set the worker source for pdfjs-dist in Node.js environment
// Netlify's bundler should pick up this path. If issues persist, this path might need adjustment
// or we might need to ensure the worker file is explicitly included in the function bundle.
if (typeof window === 'undefined') { // Check if running in Node.js (not a browser)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
}

import { authenticateRequest, createSupabaseServiceRoleClient } from './utils/auth.cjs';

// Environment variables are loaded from Netlify build settings.

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

const DECK_GENERATION_COST = 10; // Define the cost for generating a deck

exports.handler = async function(event, context) {
  // Authenticate the request (optional here if generation itself is not tied to a user, but good for protecting API key usage)
  const authResult = await authenticateRequest(event);
  if (authResult.error) {
    return {
      statusCode: authResult.statusCode,
      body: JSON.stringify({ error: authResult.error, details: authResult.details }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
  const { user } = authResult; // user.id is what we need

  // --- BEGIN Token/Subscription Check --- 
  const serviceRoleSupabase = createSupabaseServiceRoleClient();
  let userProfile;

  try {
    const { data: profileData, error: profileError } = await serviceRoleSupabase
      .from('user_profiles')
      .select('token_count, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`Error fetching user profile for ${user.id}:`, profileError.message);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch user profile for token processing.', details: profileError.message }), headers: { 'Content-Type': 'application/json' } };
    }
    if (!profileData) {
       console.error(`No user profile found for ${user.id}. This might indicate an issue with profile creation upon signup.`);
       return { statusCode: 404, body: JSON.stringify({ error: 'User profile not found.' }), headers: { 'Content-Type': 'application/json' } };
    }
    userProfile = profileData;
  } catch (e) {
    console.error('Exception fetching user profile:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error while fetching user profile.', details: e.message }), headers: { 'Content-Type': 'application/json' } };
  }

  let deductTokens = false;

  if (userProfile.subscription_status === 'active') {
    console.log(`User ${user.id} is an active subscriber. Skipping token check.`);
  } else {
    if (userProfile.token_count >= DECK_GENERATION_COST) {
      console.log(`User ${user.id} has enough tokens (${userProfile.token_count}). Cost: ${DECK_GENERATION_COST}`);
      deductTokens = true;
    } else {
      console.log(`User ${user.id} has insufficient tokens (${userProfile.token_count}). Required: ${DECK_GENERATION_COST}`);
      return {
        statusCode: 402, // Payment Required
        body: JSON.stringify({ error: `Insufficient tokens. You have ${userProfile.token_count}, but ${DECK_GENERATION_COST} are required to generate a deck. Please purchase more tokens or subscribe for unlimited access.` }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
  // --- END Token/Subscription Check --- 

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }), headers: { 'Content-Type': 'application/json' } };
  }

  // Log incoming request details for debugging
  console.log(`--- INCOMING GENERATE-DECK REQUEST ---`);
  console.log(`source_type: ${requestBody.source_type}`);
  // console.log(`source_content snippet (first 100 chars): ${String(requestBody.source_content).substring(0, 100)}`); // Be careful logging potentially large base64 strings
  console.log(`deck_title: ${requestBody.deck_title}`);
  console.log(`options: ${JSON.stringify(requestBody.options)}`);

  try {
    const { 
      source_type, 
      source_content, // Expecting base64 string for files, or plain text/URL
      deck_title,  
      options = {} 
    } = requestBody;

    // Extract and set defaults for options
    const {
      card_count = 20,
      cloze_style = "single",
      instruction = ""
    } = options;

    // Validate required inputs
    if (!source_type || !source_content) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing required fields: source_type and source_content are required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 1) Extract text based on source type
    let text;
    let numPages = null; // To store page count from PDFs
    if (source_type === "pdf") {
      console.log("[PDF Processing] Started for direct PDF upload.");
      try {
        // Assuming source_content is a base64 encoded string for PDF
        const pdfData = Buffer.from(source_content, 'base64');
        const data = await pdfjsLib.getDocument({ data: pdfData }).promise;
        numPages = data.numPages;
        const pageTexts = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await data.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          pageTexts.push(pageText);
        }
        text = pageTexts.join('\n\n');
        console.log(`[PDF Processing] Extracted ${text.length} characters from ${numPages} pages.`);
      } catch (err) {
        console.error("[PDF Processing] Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process PDF file', details: err.message }), headers: { 'Content-Type': 'application/json' } };
      }
    } else if (source_type === "docx") {
      console.log("[DOCX Processing] Started.");
      try {
        const docxBuffer = Buffer.from(source_content, 'base64');
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        text = result.value;
        console.log(`[DOCX Processing] Extracted ${text.length} characters.`);
      } catch (err) {
        console.error("[DOCX Processing] Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process DOCX file', details: err.message }), headers: { 'Content-Type': 'application/json' } };
      }
    } else if (source_type === "url") {
      console.log(`[URL Processing] Started for URL: ${source_content}`);
      try {
        const response = await fetch(source_content);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} fetching URL`);
        }
        const html = await response.text();
        const doc = new JSDOM(html, { url: source_content });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        text = article ? article.textContent : '';
        console.log(`[URL Processing] Extracted ${text.length} characters from article title: ${article ? article.title : 'N/A'}`);
      } catch (err) {
        console.error("[URL Processing] Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process URL', details: err.message }), headers: { 'Content-Type': 'application/json' } };
      }
    } else if (source_type === "text") {
      console.log("[Text Processing] Started.");
      text = source_content; // Direct text input
      console.log(`[Text Processing] Received ${text.length} characters.`);
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid source_type' }), headers: { 'Content-Type': 'application/json' } };
    }

    if (!text || text.trim().length === 0) {
      console.error("Extracted text is empty or whitespace only.");
      return { statusCode: 400, body: JSON.stringify({ error: 'Extracted text is empty. Cannot generate cards.' }), headers: { 'Content-Type': 'application/json' } };
    }

    // 2) Construct the prompt for Gemini
    let prompt;
    const baseInstruction = `You are an expert flashcard creator. Based on the following text, generate a JSON array of ${card_count} flashcards. Each flashcard object should have a "front" (question or term) and a "back" (answer or definition).`;
    
    let clozeInstruction = "";
    if (cloze_style === "single") {
      clozeInstruction = "For single-word cloze deletions, use '___' to represent the blank. The 'back' should be the word that fills the blank.";
    } else if (cloze_style === "sentence") {
      clozeInstruction = "For sentence-level cloze deletions, identify a key phrase or sentence, replace it with '[...]', and the 'back' should be the original phrase/sentence.";
    } else if (cloze_style === "none") {
      clozeInstruction = "Generate standard question/answer or term/definition flashcards without cloze deletions.";
    }

    const userProvidedInstruction = instruction ? `User's specific instructions: ${instruction}` : "";

    prompt = `${baseInstruction} ${clozeInstruction} ${userProvidedInstruction}

Text to process:
---
${text}
---

Return ONLY the JSON array of flashcards. Do not include any other explanatory text or markdown formatting around the JSON.`;
    
    // Log the prompt (or a snippet of it for brevity, especially if text is large)
    console.log("--- GEMINI PROMPT (first 500 chars) ---");
    console.log(prompt.substring(0, 500) + (prompt.length > 500 ? "..." : ""));
    console.log("-------------------------------------");

    // 3) Call Gemini API
    const chat = model.startChat({
      history: [], // No history needed for single-turn generation
      safetySettings
    });

    console.log("Sending request to Gemini API...");
    const result = await chat.sendMessage(prompt);
    const geminiResponse = result.response;
    console.log("Received response from Gemini API.");

    // Check for issues in the response
    if (!geminiResponse || !geminiResponse.candidates || geminiResponse.candidates.length === 0 || !geminiResponse.candidates[0].content || !geminiResponse.candidates[0].content.parts || geminiResponse.candidates[0].content.parts.length === 0 || !geminiResponse.candidates[0].content.parts[0].text) {
        console.error('Invalid response structure from Gemini API:', JSON.stringify(geminiResponse, null, 2));
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
                 return {
                   statusCode: 400,
                   body: JSON.stringify({
                     error: 'Content generation blocked due to safety settings.',
                     details: errorDetails
                   }),
                   headers: { 'Content-Type': 'application/json' }
                 };
            }
             if (finishReason === 'RECITATION') {
                 errorDetails = 'Content generation blocked due to recitation policy.';
                 return {
                   statusCode: 400,
                   body: JSON.stringify({
                     error: 'Content generation blocked due to recitation policy.',
                     details: errorDetails
                   }),
                   headers: { 'Content-Type': 'application/json' }
                 };
            }
        }
        return { statusCode: 500, body: JSON.stringify({ error: 'Invalid or empty response from Gemini API', details: errorDetails }), headers: { 'Content-Type': 'application/json' } };
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
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to parse Gemini response. The AI may have been unable to process the input or returned an unexpected format.',
          details: geminiOutputText // Send the actual Gemini response for debugging
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Ensure cards is an array, as expected by the rest of the system
    if (!Array.isArray(cards)) {
        console.error('OpenAI response was valid JSON but not an array:', cards);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'OpenAI response was valid JSON but not the expected array format.', // Note: This error message mentions OpenAI, but the code uses Gemini. Should be updated if it's a copy-paste error.
            details: cards
          }),
          headers: { 'Content-Type': 'application/json' }
        };
    }

    // --- BEGIN Token Deduction --- 
    if (deductTokens) {
      const new_token_count = userProfile.token_count - DECK_GENERATION_COST;
      const { error: updateError } = await serviceRoleSupabase
        .from('user_profiles')
        .update({ token_count: new_token_count })
        .eq('id', user.id);

      if (updateError) {
        // CRITICAL: Generation happened, but token deduction failed.
        // Log this serious issue. For now, return cards as user got the service, but this needs monitoring.
        console.error(`CRITICAL: Failed to deduct tokens for user ${user.id} after successful generation. Error: ${updateError.message}`);
      } else {
        console.log(`Successfully deducted ${DECK_GENERATION_COST} tokens from user ${user.id}. New balance: ${new_token_count}`);
      }
    }
    // --- END Token Deduction --- 

    return {
      statusCode: 200,
      body: JSON.stringify({
        deck_title: deck_title || "Generated Deck",
        created_at: new Date().toISOString(), // This is generation time, not DB creation time
        card_count: cards.length,
        cards
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('--- ERROR IN GENERATE-DECK HANDLER ---', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during deck generation', details: err.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}
