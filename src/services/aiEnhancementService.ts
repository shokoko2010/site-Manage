import { AIEnhancement } from '../types/types';
import ZAI from 'z-ai-web-dev-sdk';

export class AIEnhancementService {
  private static zai: any = null;

  static async initialize() {
    try {
      this.zai = await ZAI.create();
    } catch (error) {
      console.error('Failed to initialize ZAI:', error);
      throw new Error('Failed to initialize AI service');
    }
  }

  static async enhanceContent(content: string, instructions: string): Promise<AIEnhancement> {
    if (!this.zai) {
      await this.initialize();
    }

    try {
      const prompt = `Please enhance the following content based on these instructions:

Instructions: ${instructions}

Content: ${content}

Please provide:
1. An improved title
2. Enhanced content
3. A list of changes made
4. A meta description
5. Suggested tags

Format your response as JSON with the following structure:
{
  "title": "Improved title",
  "content": "Enhanced content",
  "changes": ["change1", "change2", ...],
  "metaDescription": "Meta description",
  "tags": ["tag1", "tag2", ...]
}`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content enhancer. You improve content while maintaining its original meaning and intent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const parsed = JSON.parse(response);
        return {
          title: parsed.title || content.substring(0, 50),
          content: parsed.content || content,
          changes: parsed.changes || [],
          metaDescription: parsed.metaDescription || '',
          tags: parsed.tags || []
        };
      } catch (parseError) {
        // If JSON parsing fails, return a basic enhancement
        return {
          title: content.substring(0, 50),
          content: response,
          changes: ['AI enhanced content'],
          metaDescription: '',
          tags: []
        };
      }
    } catch (error) {
      console.error('Error enhancing content:', error);
      throw new Error('Failed to enhance content');
    }
  }

  static async generateIdeas(context: string, count: number = 5): Promise<string[]> {
    if (!this.zai) {
      await this.initialize();
    }

    try {
      const prompt = `Based on the following context, generate ${count} content ideas that would perform well:

Context: ${context}

Please provide ${count} unique, engaging content ideas. Each idea should be a brief title that would make a good blog post or article.

Format your response as a JSON array of strings:
["idea1", "idea2", "idea3", ...]`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist. You generate creative, engaging content ideas based on provided context.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [response];
      } catch (parseError) {
        // If JSON parsing fails, return the response as a single idea
        return [response];
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      throw new Error('Failed to generate ideas');
    }
  }

  static async analyzeSEO(content: string): Promise<{
    score: number;
    suggestions: string[];
    keywords: string[];
  }> {
    if (!this.zai) {
      await this.initialize();
    }

    try {
      const prompt = `Analyze the following content for SEO and provide:

1. An SEO score from 1-100
2. A list of suggestions for improvement
3. Key keywords found in the content

Content: ${content}

Format your response as JSON:
{
  "score": 85,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}`;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert. You analyze content for search engine optimization and provide actionable suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const parsed = JSON.parse(response);
        return {
          score: parsed.score || 70,
          suggestions: parsed.suggestions || [],
          keywords: parsed.keywords || []
        };
      } catch (parseError) {
        // If JSON parsing fails, return default values
        return {
          score: 70,
          suggestions: ['Consider adding more keywords', 'Improve meta description'],
          keywords: []
        };
      }
    } catch (error) {
      console.error('Error analyzing SEO:', error);
      throw new Error('Failed to analyze SEO');
    }
  }
}