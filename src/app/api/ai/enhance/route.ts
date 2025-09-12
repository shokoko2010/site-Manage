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

    const { title, content, enhancementType } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Construct the AI enhancement prompt
    let aiPrompt = `Please enhance the following content. `;
    
    switch (enhancementType) {
      case 'grammar':
        aiPrompt += 'Fix any grammar, spelling, and punctuation errors. Improve sentence structure and clarity while maintaining the original meaning and tone.\n\n';
        break;
      case 'seo':
        aiPrompt += 'Optimize this content for SEO by improving keyword usage, readability, and search engine friendliness. Add relevant headings and structure where appropriate.\n\n';
        break;
      case 'engagement':
        aiPrompt += 'Make this content more engaging and compelling. Add hooks, improve flow, and make it more interesting to read while maintaining the core message.\n\n';
        break;
      case 'professional':
        aiPrompt += 'Make this content more professional and polished. Improve language, structure, and tone to make it suitable for business or formal contexts.\n\n';
        break;
      case 'casual':
        aiPrompt += 'Make this content more casual and conversational. Use simpler language, add personality, and make it more relatable while keeping the core information intact.\n\n';
        break;
      default:
        aiPrompt += 'Improve this content by enhancing its quality, clarity, and effectiveness.\n\n';
    }

    aiPrompt += `Title: ${title || 'Untitled'}\n\n`;
    aiPrompt += `Content:\n${content}\n\n`;
    aiPrompt += `Please provide the enhanced content in JSON format with the following structure:\n`;
    aiPrompt += `{\n`;
    aiPrompt += `  "title": "Enhanced title",\n`;
    aiPrompt += `  "content": "Enhanced content body",\n`;
    aiPrompt += `  "changes": ["Description of key changes made"]\n`;
    aiPrompt += `}`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content editor specializing in enhancing and improving written content. You always respond with valid JSON format when requested.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2000
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No enhancement generated');
      }

      // Parse the JSON response
      let enhancedContent;
      try {
        enhancedContent = JSON.parse(responseContent);
      } catch (parseError) {
        // If JSON parsing fails, use the original content with a simple enhancement
        enhancedContent = {
          title: title || 'Enhanced Content',
          content: responseContent,
          changes: ['General content improvement applied']
        };
      }

      return NextResponse.json({
        success: true,
        content: enhancedContent
      });

    } catch (aiError) {
      console.error('AI enhancement error:', aiError);
      return NextResponse.json(
        { 
          error: 'Failed to enhance content with AI',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('AI content enhancement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}