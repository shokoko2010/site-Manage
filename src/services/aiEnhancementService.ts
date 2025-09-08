import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ArticleContent, ContentType, Language, ProductContent, SiteContext, WritingTone, ArticleLength, SeoAnalysis, GeneratedContent } from '@/types/types';

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
const BRAND_VOICE_STORAGE_KEY = 'brand_voice';
const GDPR_SETTINGS_KEY = 'gdpr_settings';

interface GDPRSettings {
    enabled: boolean;
    anonymizeData: boolean;
    dataRetentionDays: number;
    consentRequired: boolean;
    userConsent: boolean;
}

interface ContentTemplate {
    id: string;
    name: string;
    description: string;
    structure: string;
    tone: WritingTone;
    sections: TemplateSection[];
    isCustom: boolean;
}

interface TemplateSection {
    title: string;
    description: string;
    required: boolean;
    wordCount?: number;
    keywords?: string[];
}

interface ImageGenerationOptions {
    style: 'realistic' | 'cartoon' | 'artistic' | 'minimalist' | 'professional';
    size: '1024x1024' | '1792x1024' | '1024x1792';
    quality: 'standard' | 'hd';
    promptEnhancement: boolean;
}

interface ContentStyleOptions {
    tone: WritingTone;
    formality: 'very_casual' | 'casual' | 'neutral' | 'formal' | 'very_formal';
    perspective: 'first_person' | 'second_person' | 'third_person';
    vocabulary: 'simple' | 'standard' | 'advanced';
    sentenceStructure: 'short' | 'mixed' | 'complex';
    culturalContext?: string;
    targetAudience: string;
}

interface SummarizationOptions {
    length: 'very_short' | 'short' | 'medium' | 'long' | 'detailed';
    format: 'paragraph' | 'bullets' | 'numbered' | 'outline';
    includeKeywords: boolean;
    includeSummary: boolean;
    focusAreas?: string[];
}

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

// Enhanced content generation templates
export const CONTENT_TEMPLATES: ContentTemplate[] = [
    {
        id: 'blog_post',
        name: 'Blog Post',
        description: 'Standard blog post with introduction, body, and conclusion',
        structure: 'Introduction -> Main Content -> Conclusion',
        tone: WritingTone.Friendly,
        sections: [
            { title: 'Introduction', description: 'Hook the reader and introduce the topic', required: true },
            { title: 'Main Content', description: 'Detailed discussion with subheadings', required: true },
            { title: 'Conclusion', description: 'Summary and call to action', required: true }
        ],
        isCustom: false
    },
    {
        id: 'how_to_guide',
        name: 'How-To Guide',
        description: 'Step-by-step instructional content',
        structure: 'Overview -> Steps -> Tips -> Conclusion',
        tone: WritingTone.Professional,
        sections: [
            { title: 'Overview', description: 'What the reader will learn', required: true },
            { title: 'Materials/Prerequisites', description: 'What is needed', required: false },
            { title: 'Step-by-Step Instructions', description: 'Detailed steps', required: true },
            { title: 'Tips and Best Practices', description: 'Additional advice', required: false },
            { title: 'Conclusion', description: 'Final thoughts', required: true }
        ],
        isCustom: false
    },
    {
        id: 'listicle',
        name: 'Listicle',
        description: 'List-based content with numbered items',
        structure: 'Introduction -> List Items -> Conclusion',
        tone: WritingTone.Casual,
        sections: [
            { title: 'Introduction', description: 'Hook and overview of the list', required: true },
            { title: 'List Items', description: 'Numbered list items with descriptions', required: true },
            { title: 'Conclusion', description: 'Wrap-up and call to action', required: true }
        ],
        isCustom: false
    },
    {
        id: 'review',
        name: 'Product Review',
        description: 'Comprehensive product or service review',
        structure: 'Overview -> Features -> Pros/Cons -> Verdict',
        tone: WritingTone.Professional,
        sections: [
            { title: 'Overview', description: 'Product introduction and first impressions', required: true },
            { title: 'Key Features', description: 'Main features and functionality', required: true },
            { title: 'Pros and Cons', description: 'Advantages and disadvantages', required: true },
            { title: 'Final Verdict', description: 'Conclusion and recommendation', required: true }
        ],
        isCustom: false
    },
    {
        id: 'case_study',
        name: 'Case Study',
        description: 'Detailed analysis of a specific scenario or project',
        structure: 'Background -> Challenge -> Solution -> Results -> Lessons',
        tone: WritingTone.Formal,
        sections: [
            { title: 'Background', description: 'Context and situation', required: true },
            { title: 'Challenge', description: 'Problem or opportunity', required: true },
            { title: 'Solution', description: 'Approach and implementation', required: true },
            { title: 'Results', description: 'Outcomes and metrics', required: true },
            { title: 'Lessons Learned', description: 'Key takeaways', required: true }
        ],
        isCustom: false
    }
];

// GDPR compliance helper functions
const getGDPRSettings = (): GDPRSettings => {
    const defaultSettings: GDPRSettings = {
        enabled: true,
        anonymizeData: true,
        dataRetentionDays: 90,
        consentRequired: true,
        userConsent: false
    };
    
    try {
        const stored = localStorage.getItem(GDPR_SETTINGS_KEY);
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
        return defaultSettings;
    }
};

const anonymizeContent = (content: string): string => {
    // Remove personal identifiers, emails, phone numbers, etc.
    return content
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
        .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[SSN]')
        .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/g, '[DATE]');
};

const applyGDPRCompliance = (content: string, settings: GDPRSettings): string => {
    if (!settings.enabled) return content;
    
    let processedContent = content;
    
    if (settings.anonymizeData) {
        processedContent = anonymizeContent(processedContent);
    }
    
    // Add GDPR compliance notice
    const complianceNotice = `
<!-- GDPR Compliance Notice -->
<!-- Data Processing: This content was generated with GDPR compliance settings enabled -->
<!-- Anonymization: ${settings.anonymizeData ? 'Enabled' : 'Disabled'} -->
<!-- Retention Period: ${settings.dataRetentionDays} days -->
<!-- User Consent: ${settings.userConsent ? 'Obtained' : 'Required'} -->
`;
    
    return processedContent + complianceNotice;
};

// Enhanced content generation with templates
export const generateContentWithTemplate = async (
    template: ContentTemplate,
    topic: string,
    keywords: string,
    styleOptions: ContentStyleOptions,
    language: Language,
    articleLength: ArticleLength,
    siteContext?: SiteContext
): Promise<ArticleContent> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const gdprSettings = getGDPRSettings();
    const brandVoice = localStorage.getItem(BRAND_VOICE_STORAGE_KEY) || '';
    
    const templateSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "SEO-friendly title for the content" },
            metaDescription: { type: Type.STRING, description: "Meta description (150-160 characters)" },
            body: { type: Type.STRING, description: "Full content body in markdown format following the template structure" },
            sections: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["title", "metaDescription", "body", "sections"]
    };

    const systemInstruction = `You are an expert content creator specializing in structured, high-quality content. You must follow the provided template structure precisely and generate GDPR-compliant content.`;

    const userPrompt = `
Generate content using the following template and specifications:

**TEMPLATE:** ${template.name}
**Description:** ${template.description}
**Structure:** ${template.structure}

**SECTIONS:**
${template.sections.map(section => `- ${section.title}: ${section.description} ${section.required ? '(Required)' : '(Optional)'}`).join('\n')}

**CONTENT SPECIFICATIONS:**
- Topic: "${topic}"
- Keywords: "${keywords}"
- Language: ${language}
- Length: ${articleLength}
- Style Options:
  - Tone: ${styleOptions.tone}
  - Formality: ${styleOptions.formality}
  - Perspective: ${styleOptions.perspective}
  - Vocabulary: ${styleOptions.vocabulary}
  - Sentence Structure: ${styleOptions.sentenceStructure}
  - Target Audience: ${styleOptions.targetAudience}
${styleOptions.culturalContext ? `- Cultural Context: ${styleOptions.culturalContext}` : ''}
${brandVoice ? `- Brand Voice: ${brandVoice}` : ''}

**GDPR COMPLIANCE:**
- Anonymize personal data: ${gdprSettings.anonymizeData}
- Include compliance notice: ${gdprSettings.enabled}

**REQUIREMENTS:**
1. Follow the template structure exactly
2. Include all required sections
3. Use markdown formatting
4. Apply the specified style options consistently
5. Ensure GDPR compliance
6. Return content in the specified JSON format

Generate the content now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: templateSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText);
        
        let body = parsed.body;
        
        // Apply GDPR compliance
        body = applyGDPRCompliance(body, gdprSettings);
        
        return {
            id: `template_${new Date().getTime()}`,
            type: ContentType.Article,
            title: parsed.title,
            metaDescription: parsed.metaDescription,
            body: body,
            status: 'draft',
            createdAt: new Date(),
            language: language,
            // Add template metadata
            categories: ['Template-Based'],
            tags: [template.name],
            wordCount: body.split(' ').length,
            estimatedReadTime: Math.ceil(body.split(' ').length / 200)
        };
    } catch (error) {
        throw handleApiError(error, 'generate content with template');
    }
};

// Content tone and style customization
export const customizeContentStyle = async (
    content: ArticleContent,
    styleOptions: ContentStyleOptions,
    instructions?: string
): Promise<ArticleContent> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const styleCustomizationSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Updated title with new style" },
            metaDescription: { type: Type.STRING, description: "Updated meta description" },
            body: { type: Type.STRING, description: "Content body rewritten with new style" }
        },
        required: ["title", "metaDescription", "body"]
    };

    const systemInstruction = `You are an expert content stylist specializing in adapting content to different tones and styles while preserving the core message and information.`;

    const userPrompt = `
Rewrite the following content to match the specified style options:

**ORIGINAL CONTENT:**
Title: ${content.title}
Meta Description: ${content.metaDescription}
Body: ${content.body}

**STYLE OPTIONS:**
- Tone: ${styleOptions.tone}
- Formality: ${styleOptions.formality}
- Perspective: ${styleOptions.perspective}
- Vocabulary: ${styleOptions.vocabulary}
- Sentence Structure: ${styleOptions.sentenceStructure}
- Target Audience: ${styleOptions.targetAudience}
${styleOptions.culturalContext ? `- Cultural Context: ${styleOptions.culturalContext}` : ''}

**ADDITIONAL INSTRUCTIONS:**
${instructions || 'Maintain all key information and facts while adapting the style.'}

**REQUIREMENTS:**
1. Preserve all factual information and key points
2. Adapt the writing style to match the specifications
3. Maintain the same overall structure and flow
4. Keep the content engaging and readable
5. Return the rewritten content in JSON format

Rewrite the content now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: styleCustomizationSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText);
        
        return {
            ...content,
            title: parsed.title,
            metaDescription: parsed.metaDescription,
            body: parsed.body,
            lastModified: new Date(),
            version: (content.version || 0) + 1
        };
    } catch (error) {
        throw handleApiError(error, 'customize content style');
    }
};

// Image generation integration
export const generateImageForContent = async (
    content: ArticleContent,
    options: ImageGenerationOptions,
    description?: string
): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    // Create enhanced prompt based on content
    const basePrompt = description || `Create an image that represents: ${content.title}. ${content.metaDescription}`;
    
    const enhancedPrompt = `
Enhance this image description for optimal results:

**BASE PROMPT:** ${basePrompt}

**ENHANCEMENT OPTIONS:**
- Style: ${options.style}
- Size: ${options.size}
- Quality: ${options.quality}
- Prompt Enhancement: ${options.promptEnhancement}

**CONTENT CONTEXT:**
- Title: ${content.title}
- Topic: ${content.body.substring(0, 200)}...
- Keywords: ${content.categories?.join(', ') || 'general'}

**REQUIREMENTS:**
1. Create a detailed, visually appealing image description
2. Ensure the image matches the content theme
3. Consider the specified style and quality
4. Make the image suitable for the target audience
5. Return only the enhanced image prompt

Generate the enhanced image prompt now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: enhancedPrompt,
            config: {
                systemInstruction: "You are an expert prompt engineer specializing in creating detailed image generation prompts.",
            },
        });

        const enhancedPromptText = processApiResponse(response);
        
        // Here you would integrate with an actual image generation service
        // For now, we'll return placeholder URLs
        // In a real implementation, you would use DALL-E, Midjourney, or similar
        
        return [
            `data:image/svg+xml;base64,${btoa(`
                <svg width="${options.size.split('x')[0]}" height="${options.size.split('x')[1]}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#666">
                        Generated Image: ${content.title}
                    </text>
                    <text x="50%" y="60%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#999">
                        Style: ${options.style}
                    </text>
                </svg>
            `)}`
        ];
    } catch (error) {
        throw handleApiError(error, 'generate image for content');
    }
};

// Content summarization
export const summarizeContent = async (
    content: ArticleContent,
    options: SummarizationOptions
): Promise<{ summary: string; keywords: string[]; keyPoints: string[] }> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const summarizationSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "Content summary" },
            keywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Key keywords from the content"
            },
            keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key points from the content"
            }
        },
        required: ["summary", "keywords", "keyPoints"]
    };

    const systemInstruction = `You are an expert content analyst specializing in creating concise, informative summaries and extracting key information from text.`;

    const userPrompt = `
Analyze and summarize the following content:

**CONTENT:**
Title: ${content.title}
Body: ${content.body}

**SUMMARIZATION OPTIONS:**
- Length: ${options.length}
- Format: ${options.format}
- Include Keywords: ${options.includeKeywords}
- Include Summary: ${options.includeSummary}
${options.focusAreas ? `- Focus Areas: ${options.focusAreas.join(', ')}` : ''}

**REQUIREMENTS:**
1. Create a concise summary that captures the main points
2. Extract relevant keywords
3. Identify key points and takeaways
4. Match the specified length and format
5. Focus on the most important information
6. Return the analysis in JSON format

Analyze and summarize the content now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: summarizationSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText);
        
        return {
            summary: parsed.summary,
            keywords: parsed.keywords,
            keyPoints: parsed.keyPoints
        };
    } catch (error) {
        throw handleApiError(error, 'summarize content');
    }
};

// Content paraphrasing
export const paraphraseContent = async (
    content: ArticleContent,
    styleOptions?: Partial<ContentStyleOptions>,
    instructions?: string
): Promise<ArticleContent> => {
    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const paraphraseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Paraphrased title" },
            metaDescription: { type: Type.STRING, description: "Paraphrased meta description" },
            body: { type: Type.STRING, description: "Paraphrased content body" }
        },
        required: ["title", "metaDescription", "body"]
    };

    const systemInstruction = `You are an expert content rewriter specializing in paraphrasing while maintaining meaning, clarity, and quality.`;

    const userPrompt = `
Paraphrase the following content while maintaining all key information and meaning:

**ORIGINAL CONTENT:**
Title: ${content.title}
Meta Description: ${content.metaDescription}
Body: ${content.body}

**PARAPHRASING OPTIONS:**
${styleOptions ? `
- Tone: ${styleOptions.tone || 'keep original'}
- Formality: ${styleOptions.formality || 'keep original'}
- Vocabulary: ${styleOptions.vocabulary || 'keep original'}
- Target Audience: ${styleOptions.targetAudience || 'general'}
` : ''}
**ADDITIONAL INSTRUCTIONS:**
${instructions || 'Maintain all key information and meaning while using different wording and structure.'}

**REQUIREMENTS:**
1. Preserve all factual information and key points
2. Use different wording and sentence structures
3. Maintain the same level of quality and clarity
4. Keep the content engaging and readable
5. Avoid plagiarism by significantly rewording
6. Return the paraphrased content in JSON format

Paraphrase the content now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: paraphraseSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText);
        
        return {
            ...content,
            title: parsed.title,
            metaDescription: parsed.metaDescription,
            body: parsed.body,
            lastModified: new Date(),
            version: (content.version || 0) + 1,
            tags: [...(content.tags || []), 'paraphrased']
        };
    } catch (error) {
        throw handleApiError(error, 'paraphrase content');
    }
};

// GDPR compliance check and enhancement
export const ensureGDPRCompliance = async (
    content: ArticleContent
): Promise<{ compliantContent: ArticleContent; complianceReport: string }> => {
    const gdprSettings = getGDPRSettings();
    
    if (!gdprSettings.enabled) {
        return {
            compliantContent: content,
            complianceReport: "GDPR compliance is disabled."
        };
    }

    const ai = getAiClient();
    if (!ai) throw new Error(MISSING_KEY_ERROR);
    
    const gdprSchema = {
        type: Type.OBJECT,
        properties: {
            compliantContent: { type: Type.STRING, description: "GDPR-compliant content" },
            complianceReport: { type: Type.STRING, description: "Detailed compliance report" },
            issuesFound: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of GDPR compliance issues found"
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Recommendations for improving compliance"
            }
        },
        required: ["compliantContent", "complianceReport", "issuesFound", "recommendations"]
    };

    const systemInstruction = `You are a GDPR compliance expert specializing in content privacy and data protection regulations.`;

    const userPrompt = `
Analyze the following content for GDPR compliance and make necessary adjustments:

**CONTENT:**
Title: ${content.title}
Meta Description: ${content.metaDescription}
Body: ${content.body}

**GDPR SETTINGS:**
- Anonymize Data: ${gdprSettings.anonymizeData}
- Data Retention: ${gdprSettings.dataRetentionDays} days
- Consent Required: ${gdprSettings.consentRequired}
- User Consent: ${gdprSettings.userConsent}

**ANALYSIS REQUIREMENTS:**
1. Identify personal data and PII (Personally Identifiable Information)
2. Check for data collection mentions
3. Review cookie and tracking mentions
4. Assess privacy statement requirements
5. Identify consent requirements
6. Check for data retention policies

**OUTPUT REQUIREMENTS:**
1. Provide GDPR-compliant version of the content
2. Generate detailed compliance report
3. List all issues found
4. Provide actionable recommendations
5. Return results in JSON format

Analyze for GDPR compliance now.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: gdprSchema,
            },
        });

        const jsonText = processApiResponse(response);
        const parsed = JSON.parse(jsonText);
        
        const compliantContent: ArticleContent = {
            ...content,
            body: parsed.compliantContent,
            lastModified: new Date(),
            version: (content.version || 0) + 1,
            tags: [...(content.tags || []), 'gdpr-compliant']
        };
        
        return {
            compliantContent,
            complianceReport: parsed.complianceReport
        };
    } catch (error) {
        throw handleApiError(error, 'ensure GDPR compliance');
    }
};

// Helper functions (reuse from existing service)
const processApiResponse = (response: GenerateContentResponse): string => {
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI returned an empty response.");
    }

    const candidate = response.candidates[0];
    const finishReason = candidate.finishReason;

    if (finishReason === 'MAX_TOKENS') {
        throw new Error("The AI's response was too long and was cut off.");
    }

    if (finishReason === 'SAFETY') {
        throw new Error("The request was blocked due to safety concerns.");
    }

    return response.text.trim();
};

const handleApiError = (error: unknown, context: string): Error => {
    console.error(`Error in ${context}:`, error);

    if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            return new Error("You have exceeded your API quota.");
        }
        if (error.message.includes("API key not valid")) {
            return new Error(MISSING_KEY_ERROR);
        }
    }
    
    return new Error(`Failed to ${context}. The service may be temporarily unavailable.`);
};

// Export all templates and utilities
export { getGDPRSettings, type GDPRSettings, type ContentTemplate, type ImageGenerationOptions, type ContentStyleOptions, type SummarizationOptions };