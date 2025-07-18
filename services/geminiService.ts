import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ArticleContent, ContentType, Language, ProductContent, SiteContext, WritingTone, ArticleLength, SeoAnalysis, InternalLinkSuggestion, GeneratedIdea, SitePost, CampaignGenerationResult } from '../types';

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

const contentCampaignSchema = {
    type: Type.OBJECT,
    properties: {
        pillarPost: articleSchema,
        clusterPosts: {
            type: Type.ARRAY,
            items: articleSchema
        }
    },
    required: ["pillarPost", "clusterPosts"]
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

const internalLinkSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            textToLink: { type: Type.STRING, description: "The exact, case-sensitive phrase from the article body to be hyperlinked." },
            linkTo: { type: Type.STRING, description: "The full URL of the existing post to link to." },
            postTitle: { type: Type.STRING, description: "The title of the existing post to link to." },
        },
        required: ["textToLink", "linkTo", "postTitle"],
    },
};

const ideaGenerationSchema = {
    type: Type.ARRAY,
    description: "An array of 5 new content ideas.",
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "The new, compelling article title." },
            justification: { type: Type.STRING, description: "A brief, one-sentence justification explaining why this is a good idea based on the user's past success." },
        },
        required: ["title", "justification"],
    }
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

    const markdownJsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const markdownMatch = jsonString.match(markdownJsonRegex);

    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
    } else {
        const firstBrace = jsonString.indexOf('{');
        const firstBracket = jsonString.indexOf('[');
        
        if (firstBrace === -1 && firstBracket === -1) {
             console.error("Could not find start of JSON ('{' or '[') in the response:", text);
             throw new Error("AI response does not appear to contain any JSON data.");
        }

        const startIndex = Math.min(
            firstBrace > -1 ? firstBrace : Infinity,
            firstBracket > -1 ? firstBracket : Infinity
        );
        
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
        const cleanedString = jsonString.replace(/,(?=\s*?[}\]])/g, '');
        return JSON.parse(cleanedString);
    } catch (error) {
        console.error("Failed to parse JSON even after cleaning.", { originalText: text, extractedString: jsonString, error });
        const parseError = error instanceof Error ? error.message : "Unknown parsing error";
        throw new Error(`AI returned a JSON block that could not be parsed. Error: ${parseError}`);
    }
};

/**
 * Checks the API response for errors and returns the text content if valid.
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

    return response.text.trim();
};

const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error in ${context}:`, error);

    if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            return new Error("You have exceeded your API quota. Please check your plan and billing details, or try again later.");
        }
        if (error.message.includes("API key not valid")) {
            return new Error(MISSING_KEY_ERROR);
        }
        // Return known content-related or parsing errors directly
        if (error.message.includes("cut off") || error.message.includes("blocked") || error.message.includes("could not be parsed") || error.message.includes("missing required fields") || error.message.includes("incomplete") || error.message.includes("does not appear to contain")) {
            return error;
        }
    }
    
    return new Error(`Failed to ${context}. The model may have returned an invalid response or the service may be temporarily unavailable.`);
};


export const generateArticle = async (
  topic: string, 
  keywords: string, 
  tone: WritingTone, 
  language: Language,
  articleLength: ArticleLength,
  useGoogleSearch: boolean,
  isThinkingEnabled: boolean,
  siteContext?: SiteContext
): Promise<ArticleContent> => {
  const ai = getAiClient();
  if (!ai) throw new Error(MISSING_KEY_ERROR);
  const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
  
  const systemInstruction = `You are an expert SEO content writer and a WordPress specialist. Your goal is to create high-quality, engaging, and well-structured articles that are optimized for search engines. Always follow the instructions precisely and return the content in the specified JSON format.`;

  let contextPrompt = "";
  if (siteContext) {
      let contextString = '';
      if (siteContext.recentPosts?.length > 0) {
          contextString += `- Existing Article Titles: ${siteContext.recentPosts.map(p => `"${p.title}"`).join(", ")}\n`;
      }
      if (siteContext.categories?.length > 0) {
          contextString += `- Existing Site Categories: ${siteContext.categories.map(c => c.name).join(", ")}\n`;
      }
      if (siteContext.tags?.length > 0) {
          contextString += `- Popular Site Tags: ${siteContext.tags.map(t => t.name).join(", ")}\n`;
      }
      
      if (contextString) {
          contextPrompt = `
For context, here is some information about the website this article will be published on. Use this to ensure the new content is relevant, matches the site's tone, and complements existing content.
${contextString}
`;
      }
  }

  const userPrompt = `
    Generate a complete article based on the following specifications.
    ${useGoogleSearch ? 'Use your access to Google Search to find up-to-date, factual, and relevant information for this article.' : ''}
    
    **CRITICAL OUTPUT REQUIREMENTS:**
    Your output MUST be a single, valid JSON object ${useGoogleSearch ? 'enclosed in a ```json markdown block' : 'that strictly matches the provided schema'}.
    Do NOT include any text, comments, or explanations outside of this JSON structure.

    **JSON FORMATTING RULES (APPLY THESE STRICTLY):**
    1.  The entire output MUST be a single JSON object.
    2.  The value for the "body" key contains markdown. This entire string value MUST be correctly escaped to be a valid JSON string.
    3.  All newline characters (breaks between paragraphs) within the "body" string MUST be represented as a double backslash 'n' (like so: \\n).
    4.  All double quotes (") within any string value (like title, metaDescription, or body) MUST be escaped with a single backslash (like so: \\").

    ---
    EXAMPLE OF A PERFECTLY FORMATTED JSON RESPONSE:
    \`\`\`json
    {
      "title": "Example Title with \\"Quotes\\" in the Target Language",
      "metaDescription": "Example meta description, approximately 155 characters long, also in the target language.",
      "body": "## Introduction\\n\\nThis is the first paragraph of the body. It can have multiple lines.\\n\\nThis is a second paragraph.\\n\\n## Subheading About \\"Something Important\\"\\n\\nThis is more text under another subheading. Lists can be included like this:\\n* Item 1\\n* Item 2\\n\\nThis is required for valid JSON."
    }
    \`\`\`
    ---

    **ARTICLE SPECIFICATIONS:**
    - Topic/Title Idea: "${topic}"
    - Keywords to include naturally: "${keywords}"
    - Tone of voice: ${tone}
    ${brandVoice ? `- Brand Voice Guidelines: "${brandVoice}"` : ''}
    - Language: ${language}
    - Desired Length: ${articleLength}. Adhere to this length as closely as possible.
    - Structure Requirements: The article 'body' must be written in markdown and have an introduction, an appropriate number of distinct and relevant H2 (##) subheadings for the requested length, and a conclusion.

    ${contextPrompt}

    Now, generate the complete article based on the specifications above. Your final output must be only the JSON object, formatted exactly as described.
  `;
    
  try {
    const config: any = {
        systemInstruction,
    };
    
    if (!isThinkingEnabled) {
        config.thinkingConfig = { thinkingBudget: 0 };
    }

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
    throw handleApiError(error, 'generate article');
  }
};

export const generateBilingualArticles = async (
  topic: string, 
  keywords: string, 
  tone: WritingTone, 
  languages: [Language, Language],
  articleLength: ArticleLength,
  useGoogleSearch: boolean,
  isThinkingEnabled: boolean,
  siteContext?: SiteContext
): Promise<ArticleContent[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';

    const bilingualArticleSchema = {
        type: Type.ARRAY,
        description: `An array containing exactly two article objects. The first must be in ${languages[0]} and the second in ${languages[1]}.`,
        items: articleSchema
    };

    const systemInstruction = `You are an expert SEO content writer and a WordPress specialist, fluent in multiple languages. Your goal is to create two versions of the same high-quality article in two different languages as specified. You must strictly adhere to the JSON output format.`;

    const userPrompt = `
    Generate two complete versions of the same article based on the specifications below.
    One version should be in ${languages[0]}, and the other in ${languages[1]}.

    **CRITICAL OUTPUT REQUIREMENTS:**
    - Your output MUST be a single, valid JSON array containing exactly two article objects.
    - The first object in the array MUST be the article in ${languages[0]}.
    - The second object in the array MUST be the article in ${languages[1]}.
    ${useGoogleSearch ? '- The output must be enclosed in a ```json markdown block.' : ''}
    - All string values must be properly escaped for JSON.

    **ARTICLE SPECIFICATIONS (apply to both language versions):**
    - Topic: "${topic}"
    - Keywords: "${keywords}" (translate or adapt these naturally for each language)
    - Tone: ${tone}
    - Length: ${articleLength}
    ${brandVoice ? `- Brand Voice: "${brandVoice}"` : ''}
    - Structure: Each article 'body' must be in markdown with an introduction, H2 subheadings, and a conclusion.

    Now, generate the JSON array with the two articles.
    `;

    try {
        const config: any = { systemInstruction };
        if (!isThinkingEnabled) config.thinkingConfig = { thinkingBudget: 0 };

        if (useGoogleSearch) {
            config.tools = [{googleSearch: {}}];
        } else {
            config.responseMimeType = "application/json";
            config.responseSchema = bilingualArticleSchema;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config,
        });

        const jsonText = processApiResponse(response);
        const parsedArray = useGoogleSearch ? extractJsonFromText(jsonText) : JSON.parse(jsonText);

        if (!Array.isArray(parsedArray) || parsedArray.length !== 2) {
            throw new Error("AI response was not an array of two articles.");
        }

        return parsedArray.map((parsed: any, index: number) => {
            if (!parsed.title || !parsed.metaDescription || !parsed.body) {
                throw new Error(`Article at index ${index} is missing required fields.`);
            }
            return {
                id: `art_${new Date().getTime()}_${index}`,
                type: ContentType.Article,
                title: parsed.title,
                metaDescription: parsed.metaDescription,
                body: parsed.body,
                status: 'draft',
                createdAt: new Date(),
                language: languages[index],
            };
        });

    } catch (error) {
        throw handleApiError(error, 'generate bilingual articles');
    }
};


export const generateProduct = async (
  productName: string, 
  features: string, 
  language: Language,
  isThinkingEnabled: boolean
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
    const config: any = {
        responseMimeType: "application/json",
        responseSchema: productSchema,
    };

    if (!isThinkingEnabled) {
        config.thinkingConfig = { thinkingBudget: 0 };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config,
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
    throw handleApiError(error, 'generate product content');
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
        throw handleApiError(error, 'generate featured image');
    }
};

const freeImages = {
    workspace: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSEhIVFRUVFRUVFRUVFRUVFRUVFRUXFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OFxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAFBgMEAAIHAQj/xABFEAABAwMCAwQHBgMFBAgDAAABAgMRAAQSIQUxQVETImFxBhQygZGhI0KxwVLR8FJicpLh8gczQ4OistI0Y6PT4hX/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/EACERAQEAAgICAwEBAQAAAAAAAAABEQIhMRJBUSIyYXGB/9oADAMBAAIRAxEAPwDuVFFFABRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRWHfuBDJIA7kga++gM1FFFABRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRzXzXivEOJLZaU66oIQhJUpSjAAG5JoD20V5LF4lxCHT4StSUleMlJUAopJ5EgkeoNeugCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCiiigCg6GiigPxH8bOHOIvXtqUkqLyyDGoWSoH2gg+xr2fs4fD17eXKFttrbaQpK1urBCAEnUE/aWRyGfcCv1Hxb4ds7olbtu0tR+8UBK/+ZKTV7w3giGkJbaQltCRCUISAkD0A0FBlw3DkNNoaQAlCEpSkDQJSBAA9gKzKKKAKKKKAKKKKAKKKKAKKKKAKKKKAKg41xhphSHXVpbR4iElSiAAVlKUjJ1KoADqSBV5X5x/bR+I+06myaV8LSAVOwdVuAEJJ/hSdR3JH3a/9k=",
    coffee: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEBUSEhIVFRUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAFBgMEAAIHAQj/xABEEAACAQMCAwUFBgMFBAoDAAABAgMABBESIQUxQVEGEyJhcTKBkaEHI0KxwdFSYnLwFUNzgpKy4YKi0vFDY5OzwjRT/QAGgEAAwEBAQEAAAAAAAAAAAAAAgMEAQUABv/EAC8RAAICAQQBAgQFAwUAAAAAAAABAhEDBBIhMUEFE1FhcSIygZGh0fAUQrHB4TP/2gAMAwEAAhEDEQA/AO4UUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUBzL8SuIyw2kcKkhbhyHIOPlQGQH3YqPauYftN8M3PE9zDLaNEiRwlG8R2Us29iQAFYdCB1rF+IuxfG+EIZ728kgaKKMs3hyu8mB0A3IoJ9gSK6j2L4lJdeG7GVtzQZjb1aM7QT6kAEH2rgUHH7+2uJJ4bu4hnlzvlimdHfJydwBGcnrXW/wCz9x+7vxd/SLqW42eHseIy+zdvzjA67VrQHWKKKKAKKKKAKKKKAKKzPEeIJDG0shwqKWPt7D1FeS8N8TiuYhLEwZDke4I6gjqCKA99FFFFAFFFFAFFFc97ZduP8AhM8cHgb/AJkRl3b9m3cQNuATn5etAdCorl/CPxQWaeSO6i8BFUssiuzEEDOHXA2k+oOKd+A9p7W/O2FwX/oYEM30VgCaA6BRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQHm4hAskbxuAVIYEHkQeYNfnjGbhPCb6S3lOZbVlUE9WjI3Rk+p2kr9K/SNcb/ABG7KySyfhC1PysBKo/EQBuH1AB+h60ByS77G3sdobx1RUChyiud4U8ty7doPsc+1TezX2Yu33xW/wAhB5LGo3uPcsciMew3Z9q71+G3hTw29p9JuvnuxhB/yoiDtA9Cx3N/wAK6NQHH+AfhqtbTa9wWupBzhvlj+iKTn6tmuwRxKihVAVVGAAMADoAKVRQBRRRQBXyvuiiigPyhRRRQBRXorP0Nfm7ivae/aNYjdzFFHlEjmMqq+gAOMDyrn9FAfpfsd2kiv4ApIE6KBKnXpw6/wBIP5V1KuJ/s29mpY3N/OpTMZWEL8pBYHe3qBtO0epz0FdsoCq1lYoqyMcKoLE+gGSakPGe0MMBCs25/wCFAQx+vT8TXLe0HHJLpwGPw1zlVHUn+ljzPt0qS30aYnJj6pDPHaDjD3shmk5kYVR8qKOFUdAPxJ5mvDX0V9U0IJJJ0j5lUVVz8KKKKQgooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooD//Z",
    city: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEBUSEhIVFRUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAFBgMEAAIHAQj/xABEEAACAQMCAwUFBgMFBAoDAAABAgMABBESIQUxQVEGEyJhcTKBkaEHI0KxwdFSYnLwFUNzgpKy4YKi0vFDY5OzwjRT/QAGgEAAwEBAQEAAAAAAAAAAAAAAgMEAQUABv/EAC8RAAICAQQBAgQFAwUAAAAAAAABAhEDBBIhMUEFE1FhcSIygZGh0fAUQrHB4TP/2gAMAwEAAhEDEQA/AO4UUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUBzL8SuIyw2kcKkhbhyHIOPlQGQH3YqPauYftN8M3PE9zDLaNEiRwlG8R2Us29iQAFYdCB1rF+IuxfG+EIZ728kgaKKMs3hyu8mB0A3IoJ9gSK6j2L4lJdeG7GVtzQZjb1aM7QT6kAEH2rgUHH7+2uJJ4bu4hnlzvlimdHfJydwBGcnrXW/wCz9x+7vxd/SLqW42eHseIy+zdvzjA67VrQHWKKKKAKKKKAKKKKAKKzPEeIJDG0shwqKWPt7D1FeS8N8TiuYhLEwZDke4I6gjqCKA99FFFFAFFFFAFFFc97ZduP8AhM8cHgb/AJkRl3b9m3cQNuATn5etAdCorl/CPxQWaeSO6i8BFUssiuzEEDOHXA2k+oOKd+A9p7W/O2FwX/oYEM30VgCaA6BRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQHm4hAskbxuAVIYEHkQeYNfnjGbhPCb6S3lOZbVlUE9WjI3Rk+p2kr9K/SNcb/ABG7KySyfhC1PysBKo/EQBuH1AB+h60ByS77G3sdobx1RUChyiud4U8ty7doPsc+1TezX2Yu33xW/wAhB5LGo3uPcsciMew3Z9q71+G3hTw29p9JuvnuxhB/yoiDtA9Cx3N/wAK6NQHH+AfhqtbTa9wWupBzhvlj+iKTn6tmuwRxKihVAVVGAAMADoAKVRQBRRRQBXyvuiiigPyhRRRQBRXorP0Nfm7ivae/aNYjdzFFHlEjmMqq+gAOMDyrn9FAfpfsd2kiv4ApIE6KBKnXpw6/wBIP5V1KuJ/s29mpY3N/OpTMZWEL8pBYHe3qBtO0epz0FdsoCq1lYoqyMcKoLE+gGSakPGe0MMBCs25/wCFAQx+vT8TXLe0HHJLpwGPw1zlVHUn+ljzPt0qS30aYnJj6pDPHaDjD3shmk5kYVR8qKOFUdAPxJ5mvDX0V9U0IJJJ0j5lUVVz8KKKKQgooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooD//Z",
    writing: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEBUSEhIVFRUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAKgBLAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAFBgMEAAIHAQj/xABEEAACAQMCAwUFBgMFBAoDAAABAgMABBESIQUxQVEGEyJhcTKBkaEHI0KxwdFSYnLwFUNzgpKy4YKi0vFDY5OzwjRT/QAGgEAAwEBAQEAAAAAAAAAAAAAAgMEAQUABv/EAC8RAAICAQQBAgQFAwUAAAAAAAABAhEDBBIhMUEFE1FhcSIygZGh0fAUQrHB4TP/2gAMAwEAAhEDEQA/AO4UUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUAUUUUBzL8SuIyw2kcKkhbhyHIOPlQGQH3YqPauYftN8M3PE9zDLaNEiRwlG8R2Us29iQAFYdCB1rF+IuxfG+EIZ728kgaKKMs3hyu8mB0A3IoJ9gSK6j2L4lJdeG7GVtzQZjb1aM7QT6kAEH2rgUHH7+2uJJ4bu4hnlzvlimdHfJydwBGcnrXW/wCz9x+7vxd/SLqW42eHseIy+zdvzjA67VrQHWKKKKAKKKKAKKKKAKKzPEeIJDG0shwqKWPt7D1FeS8N8TiuYhLEwZDke4I6gjqCKA99FFFFAFFFFAFFFc97ZduP8AhM8cHgb/AJkRl3b9m3cQNuATn5etAdCorl/CPxQWaeSO6i8BFUssiuzEEDOHXA2k+oOKd+A9p7W/O2FwX/oYEM30VgCaA6BRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQBRRRQHm4hAskbxuAVIYEHkQeYNfnjGbhPCb6S3lOZbVlUE9WjI3Rk+p2kr9K/SNcb/ABG7KySyfhC1PysBKo/EQBuH1AB+h60ByS77G3sdobx1RUChyiud4U8ty7doPsc+1TezX2Yu33xW/wAhB5LGo3uPcsciMew3Z9q71+G3hTw29p9JuvnuxhB/yoiDtA9Cx3N/wAK6NQHH+AfhqtbTa9wWupBzhvlj+iKTn6tmuwRxKihVAVVGAAMADoAKVRQBRRRQBXyvuiiigPyhRRRQBRXorP0Nfm7ivae/aNYjdzFFHlEjmMqq+gAOMDyrn9FAfpfsd2kiv4ApIE6KBKnXpw6/wBIP5V1KuJ/s29mpY3N/OpTMZWEL8pBYHe3qBtO0epz0FdsoCq1lYoqyMcKoLE+gGSakPGe0MMBCs25/wCFAQx+vT8TXLe0HHJLpwGPw1zlVHUn+ljzPt0qS30aYnJj6pDPHaDjD3shmk5kYVR8qKOFUdAPxJ5mvDX0V9U0IJJJ0j5lUVVz8KKKKQgooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooAooooD//Z"
};

export const generateFreePlaceholderImages = async (topic: string): Promise<string[]> => {
    console.log(`Simulating free image search for topic: ${topic}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In a real app, you'd fetch from an API like Unsplash, Pexels, etc.
    // For this demo, we return a static list of royalty-free images to avoid needing more API keys and handling CORS.
    return Promise.resolve(Object.values(freeImages));
};


export const generateContentCampaign = async (
    topic: string,
    numArticles: number,
    language: Language,
    isThinkingEnabled: boolean
): Promise<CampaignGenerationResult> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
    
    const systemInstruction = `You are an expert content strategist and SEO writer, specializing in the Pillar-Cluster model. Your task is to generate a complete, interconnected content campaign. You must generate one comprehensive 'pillar' post and a specified number of 'cluster' posts that link back to the pillar. The output MUST be a single JSON object that strictly conforms to the provided schema.`;

    const userPrompt = `
        Generate a complete content campaign based on the Pillar-Cluster model.
        The campaign should center around the main topic: "${topic}".
        It must consist of exactly ONE Pillar Post and ${numArticles} Cluster Posts.

        **Pillar Post Requirements:**
        - It should be a comprehensive, long-form article covering the main topic broadly.
        - It should serve as the central hub for this topic.

        **Cluster Posts Requirements:**
        - Each cluster post must dive deep into a specific sub-topic related to the main topic.
        - Each cluster post must be unique.
        - CRITICAL: The body of each cluster post MUST naturally include a markdown link back to the Pillar Post. The anchor text for this link should be the main topic itself or a very close variant. Use "#" as a placeholder for the URL, for example: "[main topic text](#)".

        **General Requirements:**
        - Language for all articles: ${language}.
        - ${brandVoice ? `Adhere to this Brand Voice Guideline for all articles: "${brandVoice}"` : ''}
        - The body of every article must be well-structured in markdown with an introduction, multiple H2 (##) subheadings, and a conclusion.

        **Output Format:**
        The output MUST be a single, valid JSON object. Do not include any text, comments, or explanations outside this object. All string values must be properly escaped. The object must contain two keys:
        1. "pillarPost": An object for the main article, conforming to the article schema.
        2. "clusterPosts": A JSON array containing exactly ${numArticles} article objects for the cluster posts.
    `;

    try {
        const config: any = {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: contentCampaignSchema,
        };

        if (!isThinkingEnabled) {
            config.thinkingConfig = { thinkingBudget: 0 };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config,
        });

        const jsonText = processApiResponse(response);
        const parsedCampaign = JSON.parse(jsonText);

        if (!parsedCampaign.pillarPost || !Array.isArray(parsedCampaign.clusterPosts)) {
             throw new Error("AI response was not in the expected campaign format.");
        }
        
        const pillarPost: ArticleContent = {
            id: `art_pillar_${new Date().getTime()}`,
            type: ContentType.Article,
            ...parsedCampaign.pillarPost,
            status: 'draft',
            createdAt: new Date(),
            language: language,
        };

        const clusterPosts: ArticleContent[] = parsedCampaign.clusterPosts.map((parsed: any, index: number) => {
            if (!parsed.title || !parsed.metaDescription || !parsed.body) {
                console.warn(`Invalid JSON structure for cluster article ${index}. Skipping.`, parsed);
                return null;
            }
            return {
                id: `art_cluster_${new Date().getTime()}_${index}`,
                type: ContentType.Article,
                ...parsed,
                status: 'draft',
                createdAt: new Date(),
                language: language,
            };
        }).filter((article): article is ArticleContent => article !== null);

        return { pillarPost, clusterPosts };

    } catch (error) {
        throw handleApiError(error, 'generate content campaign');
    }
};

export const refineArticle = async (
  currentArticle: ArticleContent, 
  instruction: string,
  language: Language
): Promise<Pick<ArticleContent, 'title' | 'body' | 'metaDescription'>> => {
  const ai = getAiClient();
  if (!ai) throw new Error(MISSING_KEY_ERROR);
  
  const systemInstruction = `You are an expert SEO content editor. Your primary function is to intelligently modify an existing article based on a user's request, while adhering to one critical rule.
**CRITICAL RULE: YOU MUST PRESERVE THE ORIGINAL LANGUAGE OF THE ARTICLE. Your highest priority is to ensure the output language matches the input language. If the article is in Arabic, the entire output MUST be in Arabic. DO NOT translate to English.**
Always return the complete, updated article in the specified JSON format.`;

  const userPrompt = `
    Your most important and primary task is to refine the article below based on the user's instruction while strictly preserving its original language.

    **CRITICAL, NON-NEGOTIABLE RULES:**
    1.  **ABSOLUTE LANGUAGE PRESERVATION:** The original language of this article is **${language}**. Your entire output, including the title, meta description, and body, MUST remain in **${language}**. DO NOT translate any part of it to English or any other language under any circumstances. This is your highest priority. Before generating the final JSON, double-check that every word is in **${language}**.
    2.  **JSON OUTPUT ONLY:** The output MUST be a single, valid JSON object that strictly conforms to the provided schema. Do not include any text, explanations, or comments outside of the JSON object.

    **User's Refinement Instruction:**
    "${instruction}"

    **Current Article to Refine (Language: ${language}):**
    - Title: "${currentArticle.title}"
    - Meta Description: "${currentArticle.metaDescription}"
    - Body (Markdown):
    ---
    ${currentArticle.body}
    ---

    Now, apply the instruction and generate the complete, updated article. The entire JSON response, including all its string values, must be in **${language}**.
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
    throw handleApiError(error, 'refine article');
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
        throw handleApiError(error, 'analyze SEO');
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

        return processApiResponse(response);

    } catch(error) {
        throw handleApiError(error, 'modify text');
    }
};

export const generateInternalLinks = async (
    articleBody: string,
    siteContext: SiteContext
): Promise<InternalLinkSuggestion[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    if (!siteContext.recentPosts || siteContext.recentPosts.length === 0) {
        return []; // No posts to link to.
    }

    const systemInstruction = `You are an expert SEO specialist with a deep understanding of internal linking strategies. Your task is to analyze a new article and suggest relevant internal links to existing posts on the same website. The response must be a valid JSON array matching the provided schema.`;
    
    const userPrompt = `
    I have written a new article and I need you to suggest internal links to my existing posts.

    **Here is the content of the new article (in Markdown):**
    ---
    ${articleBody}
    ---

    **Here is a list of my existing posts on the website:**
    ${siteContext.recentPosts.map(p => `- Title: "${p.title}", URL: "${p.link}"`).join('\n')}

    **Your Task:**
    1. Read through the new article.
    2. Identify phrases or keywords in the new article that would be a natural and relevant anchor text for a link to one of the existing posts.
    3. You can suggest up to 5 high-quality links. Do not suggest a link if it is not highly relevant.
    4. The "textToLink" value in your response MUST be an exact, case-sensitive match to a phrase found in the new article's body.

    **Output Format:**
    Return a single, valid JSON array of objects. Each object represents a single link suggestion.
    Do not include any text or explanations outside of the JSON array.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: internalLinkSuggestionSchema,
            },
        });
        
        const jsonText = processApiResponse(response);
        const parsedSuggestions = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedSuggestions)) {
            throw new Error("AI response for internal links was not a JSON array.");
        }

        // Final validation
        return parsedSuggestions.filter(s => s.textToLink && s.linkTo && s.postTitle);

    } catch (error) {
        throw handleApiError(error, 'generate internal links');
    }
};

export const generateIdeasFromAnalytics = async (topPosts: SitePost[]): Promise<GeneratedIdea[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const systemInstruction = `You are an expert content strategist. Your task is to analyze a user's most successful articles and generate 5 new, data-driven content ideas. The response must be a valid JSON array matching the provided schema.`;

    const userPrompt = `
        Based on the following list of my top-performing articles, please identify common themes, topics, and styles that are clearly resonating with my audience. Then, generate 5 new, specific, and compelling article titles that I can create to build on this success.

        **My Most Successful Articles (by views and comments):**
        ${topPosts.map(p => `- "${p.title.rendered}"`).join('\n')}

        **Your Task:**
        1. Analyze the themes in the provided titles.
        2. Generate 5 new article titles that are similar in theme or style but explore new angles.
        3. For each new title, provide a brief, one-sentence justification explaining why it's a good idea based on the success of the provided list.

        **Output Format:**
        Return a single, valid JSON array of objects. Each object represents a single content idea and must have "title" and "justification" keys.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: ideaGenerationSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsedIdeas = JSON.parse(jsonText) as GeneratedIdea[];

        if (!Array.isArray(parsedIdeas) || parsedIdeas.some(idea => !idea.title || !idea.justification)) {
            throw new Error("AI response for idea generation was not in the expected format.");
        }
        
        return parsedIdeas;

    } catch (error) {
        throw handleApiError(error, 'generate content ideas');
    }
};

export const refreshArticleContent = async (
    originalPost: SitePost,
    originalMarkdown: string
): Promise<Pick<ArticleContent, 'title' | 'metaDescription' | 'body'>> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);

    const systemInstruction = `You are an expert SEO content editor specializing in refreshing and updating existing articles. Your goal is to take an old article, use Google Search to find the latest information, and produce a fully rewritten, up-to-date, and improved version. You must return the result in the specified JSON format.`;

    const userPrompt = `
    Please refresh the following article. Use Google Search to find the most recent developments, facts, and data related to its topic. Rewrite the article to be more current, accurate, and engaging. Improve the SEO by naturally incorporating relevant, modern keywords.

    **CRITICAL OUTPUT REQUIREMENTS:**
    Your output MUST be a single, valid JSON object enclosed in a \`\`\`json markdown block.
    Do NOT include any text, comments, or explanations outside of this JSON structure.

    **JSON FORMATTING RULES (APPLY THESE STRICTLY):**
    1.  The entire output MUST be a single JSON object.
    2.  The value for the "body" key contains markdown. This entire string value MUST be correctly escaped to be a valid JSON string.
    3.  All newline characters (breaks between paragraphs) within the "body" string MUST be represented as a double backslash 'n' (like so: \\n).
    4.  All double quotes (") within any string value (like title, metaDescription, or body) MUST be escaped with a single backslash (like so: \\").

    ---
    EXAMPLE OF A PERFECTLY FORMATTED JSON RESPONSE:
    \`\`\`json
    {
      "title": "Example Refreshed Title with \\"Quotes\\"",
      "metaDescription": "Example refreshed meta description, approximately 155 characters long.",
      "body": "## Introduction\\n\\nThis is the first paragraph of the refreshed body.\\n\\n## A New Section about \\"Recent Events\\"\\n\\nThis section discusses something important. This is required for valid JSON."
    }
    \`\`\`
    ---

    **ORIGINAL ARTICLE TO REFRESH:**
    - Title: "${originalPost.title.rendered}"
    - Body (Markdown):
    ---
    ${originalMarkdown}
    ---

    **YOUR TASK:**
    1.  Analyze the original article's topic.
    2.  Use Google Search to find the latest information.
    3.  Write a completely new, refreshed version of the article with a new title, meta description, and body.
    
    Now, generate the complete, refreshed article. Your final output must be only the JSON object, formatted exactly as described.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = extractJsonFromText(jsonText);

        if (!parsed.title || !parsed.metaDescription || !parsed.body) {
            throw new Error("AI response is missing required fields (title, metaDescription, body) for the refreshed article.");
        }

        return {
            title: parsed.title,
            metaDescription: parsed.metaDescription,
            body: parsed.body,
        };
    } catch (error) {
        throw handleApiError(error, 'refresh article content');
    }
};