import ZAI from 'z-ai-web-dev-sdk';

export interface GeneratedIdea {
  title: string;
  justification: string;
  confidence: number;
}

export interface PostPerformance {
  title: string;
  views: number;
  comments: number;
  shares: number;
  publishDate: string;
}

export async function generateIdeasFromAnalytics(topPosts: PostPerformance[]): Promise<GeneratedIdea[]> {
  try {
    const zai = await ZAI.create();

    // Create a prompt for AI to generate content ideas based on performance data
    const prompt = `Based on the following top-performing blog posts, generate 5 new content ideas that are likely to perform well. 

Top Performing Posts:
${topPosts.map((post, index) => `
${index + 1}. "${post.title}"
   - Views: ${post.views}
   - Comments: ${post.comments}
   - Shares: ${post.shares}
   - Published: ${post.publishDate}
`).join('\n')}

Analyze the patterns in these successful posts and suggest new content ideas that:
1. Follow similar themes or topics that are working well
2. Fill content gaps in the successful topics
3. Explore related subtopics that readers might be interested in
4. Address questions that come up in the comments
5. Build on successful formats or structures

Please respond with a JSON array of objects, each containing:
- title: A compelling title for the new content idea
- justification: Brief explanation of why this idea is likely to perform well
- confidence: A number from 1-10 indicating confidence in this idea

Example format:
[
  {
    "title": "10 Advanced Tips for [Topic]",
    "justification": "This builds on the success of 'Basic Tips for [Topic]' which got 15,000 views, showing readers want more advanced content.",
    "confidence": 8
  }
]`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist and SEO specialist. You analyze performance data to generate high-potential content ideas. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No ideas generated');
    }

    // Parse the JSON response
    let ideas: GeneratedIdea[];
    try {
      ideas = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse generated ideas');
    }

    // Validate the response format
    if (!Array.isArray(ideas)) {
      throw new Error('Invalid response format: expected array');
    }

    // Validate each idea
    ideas = ideas.filter(idea => 
      idea.title && 
      idea.justification && 
      typeof idea.confidence === 'number'
    );

    if (ideas.length === 0) {
      throw new Error('No valid ideas generated');
    }

    return ideas;

  } catch (error) {
    console.error('Error generating ideas from analytics:', error);
    throw new Error(`Failed to generate ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateContentIdea(topic: string, context: string = ''): Promise<GeneratedIdea> {
  try {
    const zai = await ZAI.create();

    const prompt = `Generate a compelling content idea about "${topic}".

${context ? `Additional context: ${context}` : ''}

Please provide a single content idea with:
- A catchy, SEO-friendly title
- A strong justification for why this content would perform well
- A confidence score (1-10) based on market demand and competition

Respond with a JSON object containing:
{
  "title": "The content title",
  "justification": "Why this idea will work well",
  "confidence": 8
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist who creates compelling, data-driven content ideas. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No idea generated');
    }

    const idea = JSON.parse(responseContent);
    
    if (!idea.title || !idea.justification || typeof idea.confidence !== 'number') {
      throw new Error('Invalid idea format');
    }

    return idea;

  } catch (error) {
    console.error('Error generating content idea:', error);
    throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeContentQuality(content: string): Promise<{
  score: number;
  strengths: string[];
  improvements: string[];
  seoScore: number;
  readabilityScore: number;
}> {
  try {
    const zai = await ZAI.create();

    const prompt = `Analyze the following content for quality, SEO, and readability:

Content:
"""
${content}
"""

Please provide a comprehensive analysis including:
1. Overall quality score (1-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. SEO score (1-100) based on keyword usage, structure, and optimization
5. Readability score (1-100) based on clarity, flow, and accessibility

Respond with a JSON object:
{
  "score": 85,
  "strengths": ["Good keyword usage", "Clear structure"],
  "improvements": ["Add more examples", "Improve introduction"],
  "seoScore": 80,
  "readabilityScore": 90
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert content analyst specializing in SEO, readability, and content quality assessment. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No analysis generated');
    }

    const analysis = JSON.parse(responseContent);
    
    return analysis;

  } catch (error) {
    console.error('Error analyzing content quality:', error);
    throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}