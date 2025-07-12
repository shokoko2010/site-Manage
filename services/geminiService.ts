import { GoogleGenAI, Type } from "@google/genai";
import { ArticleContent, ContentType, Language, ProductContent, SiteContext, WritingTone, ArticleLength } from '../types';

/**
 * Lazily initializes the AI client.
 * Returns null if the API key is missing, allowing for graceful error handling in the UI.
 */
const getAiClient = (): GoogleGenAI | null => {
    if (!process.env.API_KEY) {
        return null;
    }
    try {
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (e) {
        console.error("Error initializing GoogleGenAI:", e);
        return null;
    }
};

const MISSING_KEY_ERROR = "Gemini API Key is not configured. Please set the API_KEY environment variable in your deployment platform's settings.";

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

const extractJsonFromText = (text: string): any => {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
             console.error("Failed to parse extracted JSON block:", e);
        }
    }
    // Fallback for when the model doesn't use a markdown block
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse the full response as JSON:", text);
        throw new Error("AI returned a response that could not be parsed as JSON.");
    }
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
    The output MUST be a single valid JSON object ${useGoogleSearch ? 'enclosed in a ```json markdown block' : 'that strictly matches the provided schema'}. Do not include any text outside of the JSON object.

    **Article Specifications:**
    - Topic/Title Idea: "${topic}"
    - Keywords to include naturally: "${keywords}"
    - Tone of voice: ${tone}
    - Language: ${language}
    - Desired Length: ${articleLength}. Adhere to this length as closely as possible.
    - Structure Requirements: The article 'body' must be written in markdown and have an introduction, an appropriate number of distinct and relevant H2 (##) subheadings for the requested length, and a conclusion.

    ${contextPrompt}

    Now, generate the complete article. The JSON output MUST contain the following keys:
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

    const jsonText = response.text.trim();
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
    };
  } catch (error) {
    console.error("Error generating article:", error);
    if (error instanceof Error && (error.message.includes("could not be parsed") || error.message.includes("missing required fields"))) {
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

    const prompt = `
        Generate complete product page content for a WooCommerce store. The output MUST be a valid JSON object matching the provided schema.

        - Product Name: "${productName}"
        - Key Features and Specifications: 
          ${features.split('\n').map(f => `- ${f}`).join('\n')}
        - Language: ${language}

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

    const jsonText = response.text.trim();
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
    
    const systemInstruction = `You are an expert content strategist and SEO writer. Your task is to generate a complete content plan for a given topic. You must generate a JSON array containing the specified number of full, ready-to-publish articles. Each article object in the array must conform to the provided schema.`;

    const userPrompt = `
        Generate a content strategy consisting of ${numArticles} full articles on the main topic of "${topic}".
        Each article should be unique, target a different sub-topic or keyword, and be engaging for readers.
        The output MUST be a single, valid JSON array of article objects. Do not include any text outside of the JSON array.
        Each object in the array must strictly adhere to this schema: { title, metaDescription, body }.
        The language for all articles must be ${language}.
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

        const jsonText = response.text.trim();
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
            };
        }).filter((article): article is ArticleContent => article !== null);

    } catch (error) {
        console.error("Error generating content strategy:", error);
        throw new Error("Failed to generate content strategy from AI. The model may have returned an invalid format or the service is unavailable.");
    }
};
