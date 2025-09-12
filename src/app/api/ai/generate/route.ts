import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const { prompt, type, tone, length, keywords } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Construct the AI prompt based on content type and parameters
    let aiPrompt = `Generate ${type || 'article'} content based on the following requirements:\n\n`;
    aiPrompt += `Topic/Request: ${prompt}\n\n`;
    
    if (tone) {
      aiPrompt += `Tone: ${tone}\n`;
    }
    
    if (length) {
      aiPrompt += `Length: ${length}\n`;
    }
    
    if (keywords && keywords.length > 0) {
      aiPrompt += `Keywords to include: ${keywords.join(', ')}\n`;
    }
    
    aiPrompt += `\nPlease generate well-structured, engaging content that is ready for publication. `;
    aiPrompt += `Include a compelling title and meta description. `;
    aiPrompt += `Format the response as JSON with the following structure:\n`;
    aiPrompt += `{\n`;
    aiPrompt += `  "title": "Generated title",\n`;
    aiPrompt += `  "content": "Generated content body",\n`;
    aiPrompt += `  "metaDescription": "Generated meta description",\n`;
    aiPrompt += `  "tags": ["tag1", "tag2", "tag3"]\n`;
    aiPrompt += `}`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer specializing in creating high-quality, engaging articles, product descriptions, and marketing campaigns. You always respond with valid JSON format when requested.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No content generated');
      }

      // Parse the JSON response
      let generatedContent;
      try {
        generatedContent = JSON.parse(responseContent);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        const lines = responseContent.split('\n');
        const title = lines[0] || 'Generated Content';
        const content = lines.slice(1).join('\n').trim();
        
        generatedContent = {
          title: title,
          content: content,
          metaDescription: content.substring(0, 160) + '...',
          tags: extractTagsFromContent(content)
        };
      }

      // Log AI generation activity
      // Note: You might want to add an activity log for AI usage

      return NextResponse.json({
        success: true,
        content: generatedContent
      });

    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return NextResponse.json(
        { 
          error: 'Failed to generate content with AI',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('AI content generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract potential tags from content
function extractTagsFromContent(content: string): string[] {
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
    }
  });
  
  // Get top 5 most frequent words as tags
  const sortedWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return sortedWords;
}