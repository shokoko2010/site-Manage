


import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ArticleContent, ContentType, Language, ProductContent, SiteContext, WritingTone, ArticleLength, SeoAnalysis } from '../types';

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
const BRAND_VOICE_STORAGE_KEY = 'brand_voice';

/**
 * Lazily initializes the AI client.
 * Returns null if the API key is missing, allowing for graceful error handling in the UI.
 */
const getAiClient = (): GoogleGenAI | null => {
    const apiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (!apiKey) {
        return null;
    }
    try {
        return new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Error initializing GoogleGenAI:", e);
        return null;
    }
};

const MISSING_KEY_ERROR = "Gemini API Key is not configured. Please go to the Settings page to add it.";

const articleSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A compelling, SEO-friendly title for the article. It should be catchy and relevant." },
        metaDescription: { type: Type.STRING, description: "An SEO-friendly meta description, between 150-160 characters." },
        body: { type: Type.STRING, description: "The full body of the article, formatted with markdown. It must include an introduction, at least two relevant H2 (##) subheadings, and a conclusion. Use lists and bolding where appropriate." },
    },
    required: ["title", "metaDescription", "body"],
};

const productSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A catchy and descriptive product title." },
        longDescription: { type: Type.STRING, description: "A detailed, persuasive, and comprehensive description of the product, highlighting its benefits and features. Use markdown for formatting." },
        shortDescription: { type: Type.STRING, description: "A concise summary of the product, perfect for category or archive pages." },
    },
    required: ["title", "longDescription", "shortDescription"],
};

const contentStrategySchema = {
    type: Type.ARRAY,
    items: articleSchema
};

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "An overall SEO score from 0 to 100 for the article, based on keyword usage, readability, structure, and title quality." },
        suggestions: {
            type: Type.ARRAY,
            description: "A list of 3-5 concrete, actionable suggestions for improving the article's SEO.",
            items: { type: Type.STRING }
        },
    },
    required: ["score", "suggestions"],
};

/**
 * A robust JSON parser for LLM outputs. It extracts a JSON string from
 * markdown blocks or raw text, cleans common syntax errors (like trailing
 * commas), and then parses it.
 * @param text The raw text output from the AI model.
 * @returns The parsed JSON object.
 * @throws An error if JSON cannot be found or parsed.
 */
const extractJsonFromText = (text: string): any => {
    let jsonString = text.trim();

    // 1. Prioritize extracting from a markdown block, which is the expected format.
    const markdownJsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const markdownMatch = jsonString.match(markdownJsonRegex);

    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
    } else {
        // 2. Fallback: If no markdown block is found, find the largest possible JSON object/array substring.
        // This handles cases where the AI forgets the markdown wrapper but includes other text.
        const firstBrace = jsonString.indexOf('{');
        const firstBracket = jsonString.indexOf('[');
        
        // If we can't find a start, there's no JSON.
        if (firstBrace === -1 && firstBracket === -1) {
             console.error("Could not find start of JSON ('{' or '[') in the response:", text);
             throw new Error("AI response does not appear to contain any JSON data.");
        }

        const startIndex = Math.min(
            firstBrace > -1 ? firstBrace : Infinity,
            firstBracket > -1 ? firstBracket : Infinity
        );
        
        // This is a simple but more robust way to find the end of the JSON.
        // It's not perfect (doesn't handle brackets in strings), but better than lastIndexOf.
        const startChar = jsonString[startIndex];
        const endChar = startChar === '{' ? '}' : ']';
        let depth = 0;
        let endIndex = -1;

        for (let i = startIndex; i < jsonString.length; i++) {
            if (jsonString[i] === startChar) {
                depth++;
            } else if (jsonString[i] === endChar) {
                depth--;
                if (depth === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        
        if (endIndex === -1) {
            console.error("Could not find a complete JSON structure in response:", text);
            throw new Error("AI response contains an incomplete JSON structure.");
        }

        jsonString = jsonString.substring(startIndex, endIndex + 1);
    }
    
    try {
        // 3. Clean the extracted string from common LLM-generated errors.
        // The most frequent and safe-to-fix error is a trailing comma.
        const cleanedString = jsonString.replace(/,(?=\s*?[}\]])/g, '');
        return JSON.parse(cleanedString);
    } catch (error) {
        console.error("Failed to parse JSON even after cleaning.", { originalText: text, extractedString: jsonString, error });
        // Include the specific parsing error message for better debugging.
        const parseError = error instanceof Error ? error.message : "Unknown parsing error";
        throw new Error(`AI returned a JSON block that could not be parsed. Error: ${parseError}`);
    }
};

/**
 * Checks the API response for errors and returns the text content if valid.
 * Throws user-friendly errors for specific failure reasons.
 */
const processApiResponse = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI returned an empty response. This may be due to a temporary issue or a problem with the prompt.");
    }

    const candidate = response.candidates[0];
    const finishReason = candidate.finishReason;

    if (finishReason === 'MAX_TOKENS') {
        throw new Error("The AI's response was too long and was cut off. Please try generating a shorter piece of content or simplifying your request.");
    }

    if (finishReason === 'SAFETY') {
        let blockMessage = "The request was blocked due to safety concerns.";
        const harmfulCategory = candidate.safetyRatings?.find(r => r.blocked)?.category;
        if (harmfulCategory) {
            blockMessage += ` (Reason: ${harmfulCategory.replace('HARM_CATEGORY_', '')})`;
        }
        throw new Error(blockMessage + ". Please modify your prompt and try again.");
    }
    
    if (finishReason === 'RECITATION') {
         throw new Error("The response was blocked because it contained content that is too similar to copyrighted material. Please try a different prompt.");
    }
    
    if (finishReason === 'OTHER') {
        throw new Error("The response was stopped for an unspecified reason. Please try again.");
    }

    // If finishReason is 'STOP', we can proceed.
    return response.text.trim();
};


export const generateArticle = async (
  topic: string, 
  keywords: string, 
  tone: WritingTone, 
  language: Language,
  articleLength: ArticleLength,
  useGoogleSearch: boolean,
  siteContext?: SiteContext
): Promise<ArticleContent> => {
  const ai = getAiClient();
  if (!ai) throw new Error(MISSING_KEY_ERROR);
  const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
  
  const systemInstruction = `You are an expert SEO content writer and a WordPress specialist. Your goal is to create high-quality, engaging, and well-structured articles that are optimized for search engines. Always follow the instructions precisely and return the content in the specified JSON format.`;

  let contextPrompt = "";
  if (siteContext) {
    contextPrompt = `
For context, here is some information about the website this article will be published on. Use this to ensure the new content is relevant, matches the site's tone, and complements existing content.
- Existing Article Titles: ${siteContext.recentPosts.map(p => `"${p.title}"`).join(", ")}
- Existing Site Categories: ${siteContext.categories.map(c => c.name).join(", ")}
`;
  }

  const userPrompt = `
    Generate a complete article based on the following specifications.
    ${useGoogleSearch ? 'Use your access to Google Search to find up-to-date, factual, and relevant information to write this article.' : ''}
    The output MUST be a single valid JSON object ${useGoogleSearch ? 'enclosed in a ```json markdown block' : 'that strictly matches the provided schema'}.
    Do not include any text, comments, or explanations outside of this JSON structure.
    All string values within the JSON must be properly escaped. For example, use \\" for double quotes inside a string, and \\n for newline characters.

    **Article Specifications:**
    - Topic/Title Idea: "${topic}"
    - Keywords to include naturally: "${keywords}"
    - Tone of voice: ${tone}
    ${brandVoice ? `- Brand Voice Guidelines: "${brandVoice}"` : ''}
    - Language: ${language}
    - Desired Length: ${articleLength}. Adhere to this length as closely as possible.
    - Structure Requirements: The article 'body' must be written in markdown and have an introduction, an appropriate number of distinct and relevant H2 (##) subheadings for the requested length, and a conclusion.

    ${contextPrompt}

    ---
    EXAMPLE OF A PERFECT JSON RESPONSE:
    \`\`\`json
    {
      "title": "Example Title in the Target Language",
      "metaDescription": "Example meta description, approximately 155 characters long, in the target language.",
      "body": "## Introduction\\n\\nThis is the first paragraph of the body.\\n\\n## Subheading 2\\n\\nThis is more text under another subheading. Lists can be included like this:\\n* Item 1\\n* Item 2\\n\\n## Conclusion\\n\\nThis is the final concluding paragraph of the article."
    }
    \`\`\`
    ---

    Now, generate the complete article based on the specifications above. The JSON output MUST contain the following keys:
    1. "title": A compelling, SEO-friendly title for the article.
    2. "metaDescription": An SEO-friendly meta description, between 150-160 characters.
    3. "body": The full body of the article, formatted with markdown.
  `;
    
  try {
    const config: any = {
        systemInstruction,
    };
    
    if (useGoogleSearch) {
        config.tools = [{googleSearch: {}}];
    } else {
        config.responseMimeType = "application/json";
        config.responseSchema = articleSchema;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: config,
    });

    const jsonText = processApiResponse(response);
    const parsed = useGoogleSearch ? extractJsonFromText(jsonText) : JSON.parse(jsonText);

    if (!parsed.title || !parsed.metaDescription || !parsed.body) {
        console.error("Invalid JSON structure received:", parsed);
        throw new Error("AI response is missing required fields (title, metaDescription, body).");
    }
    
    return {
      id: `art_${new Date().getTime()}`,
      type: ContentType.Article,
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      body: parsed.body,
      status: 'draft',
      createdAt: new Date(),
      language: language,
    };
  } catch (error) {
    console.error("Error generating article:", error);
    if (error instanceof Error && (
        error.message.includes("cut off") || 
        error.message.includes("blocked") || 
        error.message.includes("could not be parsed") || 
        error.message.includes("missing required fields") ||
        error.message.includes("incomplete") ||
        error.message.includes("does not appear to contain")
    )) {
        throw error;
    }
    throw new Error("Failed to generate article from AI. The model may have returned an invalid response or the service may be temporarily unavailable.");
  }
};


export const generateProduct = async (
  productName: string, 
  features: string, 
  language: Language
): Promise<ProductContent> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';

    const prompt = `
        Generate complete product page content for a WooCommerce store. The output MUST be a valid JSON object matching the provided schema. All string values within the JSON must be properly escaped (e.g., newlines as \\n, double quotes as \\").

        - Product Name: "${productName}"
        - Key Features and Specifications: 
          ${features.split('\n').map(f => `- ${f}`).join('\n')}
        - Language: ${language}
        ${brandVoice ? `- Brand Voice Guidelines: "${brandVoice}"` : ''}

        Create compelling copy that persuades customers to buy. Use markdown for formatting in the descriptions.
    `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: productSchema,
        },
    });

    const jsonText = processApiResponse(response);
    const parsed = JSON.parse(jsonText);

    if (!parsed.title || !parsed.longDescription || !parsed.shortDescription) {
        throw new Error("AI response is missing required product fields.");
    }

    return {
      id: `prod_${new Date().getTime()}`,
      type: ContentType.Product,
      title: parsed.title,
      longDescription: parsed.longDescription,
      shortDescription: parsed.shortDescription,
      status: 'draft',
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating product content:", error);
    if (error instanceof Error && (error.message.includes("cut off") || error.message.includes("blocked") || error.message.includes("could not be parsed") || error.message.includes("missing required fields"))) {
        throw error;
    }
    throw new Error("Failed to generate product content from AI. The model may have returned an invalid response or the service may be temporarily unavailable.");
  }
};

export const generateFeaturedImage = async (prompt: string): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("AI model did not return any images.");
        }

        return response.generatedImages.map(img => img.image.imageBytes);

    } catch (error) {
        console.error("Error generating featured image:", error);
        throw new Error("Failed to generate image from AI. The service may be temporarily unavailable or the prompt may have been rejected.");
    }
};

export const generateContentStrategy = async (
    topic: string,
    numArticles: number,
    language: Language
): Promise<ArticleContent[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
    
    const systemInstruction = `You are an expert content strategist and SEO writer. Your task is to generate a complete content plan for a given topic. You must generate a JSON array containing the specified number of full, ready-to-publish articles. Each article object in the array must conform to the provided schema.`;

    const userPrompt = `
        Generate a content strategy consisting of ${numArticles} full articles on the main topic of "${topic}".
        Each article should be unique, target a different sub-topic or keyword, and be engaging for readers.
        The output MUST be a single, valid JSON array of article objects. Do not include any text outside of the JSON array. All string values within the JSON must be properly escaped (e.g., newlines as \\n, double quotes as \\").
        Each object in the array must strictly adhere to this schema: { title, metaDescription, body }.
        The language for all articles must be ${language}.
        ${brandVoice ? `Adhere to this Brand Voice Guideline for all articles: "${brandVoice}"` : ''}
        The body of each article must be formatted in markdown and be well-structured with an introduction, H2 subheadings, and a conclusion.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: contentStrategySchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsedArticles: any[] = JSON.parse(jsonText);

        if (!Array.isArray(parsedArticles)) {
             throw new Error("AI response was not a JSON array.");
        }

        return parsedArticles.map((parsed, index) => {
            if (!parsed.title || !parsed.metaDescription || !parsed.body) {
                console.warn(`Invalid JSON structure for article ${index} in strategy. Skipping.`, parsed);
                return null;
            }
            return {
                id: `art_${new Date().getTime()}_${index}`,
                type: ContentType.Article,
                title: parsed.title,
                metaDescription: parsed.metaDescription,
                body: parsed.body,
                status: 'draft',
                createdAt: new Date(),
                language: language,
            };
        }).filter((article): article is ArticleContent => article !== null);

    } catch (error) {
        console.error("Error generating content strategy:", error);
        if (error instanceof Error && (error.message.includes("cut off") || error.message.includes("blocked") || error.message.includes("could not be parsed") || error.message.includes("not a JSON array"))) {
            throw error;
        }
        throw new Error("Failed to generate content strategy from AI. The model may have returned an invalid format or the service is unavailable.");
    }
};

export const refineArticle = async (
  currentArticle: ArticleContent, 
  instruction: string,
  language: Language
): Promise<Pick<ArticleContent, 'title' | 'body' | 'metaDescription'>> => {
  const ai = getAiClient();
  if (!ai) throw new Error(MISSING_KEY_ERROR);
  
  const systemInstruction = `You are an expert SEO content editor and writer. Your goal is to intelligently modify and improve an existing article based on a user's request, while maintaining the overall structure and quality. Always return the complete, updated article in the specified JSON format.`;

  const refinementInstruction = instruction.trim()
    ? `**User's Instruction:** "${instruction}"`
    : `**User's Instruction:** The user did not provide a specific instruction. Please perform a general refinement of the article. Improve its clarity, flow, SEO, and overall quality. You can fix typos, improve sentence structure, and make the content more engaging.`;


  const userPrompt = `
    Please refine the following article based on the provided instruction.

    ${refinementInstruction}

    **Current Article:**
    - Title: "${currentArticle.title}"
    - Meta Description: "${currentArticle.metaDescription}"
    - Body (Markdown):
    ---
    ${currentArticle.body}
    ---

    **Your Task:**
    Apply the instruction to the article. You might need to rewrite sections, add new content, remove content, or change the tone.
    The output MUST be a single valid JSON object that strictly matches the provided schema, containing the full, updated content for the article. All string values within the JSON must be properly escaped (e.g., newlines as \\n, double quotes as \\").
    The language of the article must remain ${language}.

    Return the JSON object with the "title", "metaDescription", and "body" keys.
  `;
    
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: articleSchema,
        },
    });

    const jsonText = processApiResponse(response);
    const parsed = JSON.parse(jsonText);

    if (!parsed.title || !parsed.metaDescription || !parsed.body) {
        throw new Error("AI response is missing required fields for refinement.");
    }
    
    return {
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      body: parsed.body,
    };
  } catch (error) {
    console.error("Error refining article:", error);
     if (error instanceof Error && (error.message.includes("cut off") || error.message.includes("blocked") || error.message.includes("could not be parsed") || error.message.includes("missing required fields"))) {
        throw error;
    }
    throw new Error("Failed to refine article from AI. The model may have returned an invalid response.");
  }
};

export const analyzeSeo = async (title: string, body: string): Promise<SeoAnalysis> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);

    const systemInstruction = `You are a world-class SEO expert. Your task is to analyze an article and provide an SEO score and actionable feedback. The response must be a valid JSON object matching the provided schema.`;

    const userPrompt = `
        Please analyze the following article for its Search Engine Optimization (SEO) quality.
        Provide a score out of 100 and a list of specific, actionable suggestions for improvement.

        **Article Title:**
        "${title}"

        **Article Body:**
        ---
        ${body}
        ---

        Evaluate based on factors like:
        - Readability and structure (headings, paragraphs, lists).
        - How well the title reflects the content.
        - Potential for ranking on search engines.
        - Natural integration of potential keywords.

        Return your analysis as a single, valid JSON object. All string values within the JSON must be properly escaped (e.g., newlines as \\n, double quotes as \\").
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: seoAnalysisSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText) as SeoAnalysis;

        if (typeof parsed.score !== 'number' || !Array.isArray(parsed.suggestions)) {
            throw new Error("AI response is missing required SEO analysis fields.");
        }
        return parsed;

    } catch (error) {
        console.error("Error analyzing SEO:", error);
        if (error instanceof Error && (error.message.includes("cut off") || error.message.includes("blocked") || error.message.includes("could not be parsed") || error.message.includes("missing required fields"))) {
            throw error;
        }
        throw new Error("Failed to get SEO analysis from AI. The model may have returned an invalid format.");
    }
};

export const modifyText = async (
    text: string,
    instruction: string,
    language: Language,
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);

    const systemInstruction = `You are an AI text editor. Your sole purpose is to modify the given text based on the user's instruction.
    - Return ONLY the modified text.
    - Do NOT add any extra explanations, greetings, comments, or markdown formatting like \`\`\`.
    - Preserve the original language of the text, which is ${language}.
    - If the original text uses markdown, preserve it in your output.`;
    
    const userPrompt = `
        Instruction: "${instruction}"

        Text to modify:
        ---
        ${text}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
            }
        });

        // We expect a plain text response, so we just return it.
        return processApiResponse(response);

    } catch(error) {
        console.error("Error modifying text:", error);
        if (error instanceof Error && (error.message.includes("cut off") || error.message.includes("blocked"))) {
            throw error;
        }
        throw new Error("Failed to modify text with AI. The service might be unavailable.");
    }
};
