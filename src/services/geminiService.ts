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

// Mock AI service for development
export async function generateIdeasFromAnalytics(topPosts: PostPerformance[]): Promise<GeneratedIdea[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock ideas based on the posts
  return [
    {
      title: "Advanced Strategies for Content Marketing",
      justification: "Based on your top-performing posts about marketing basics, readers are ready for more advanced content.",
      confidence: 8
    },
    {
      title: "10 Common Content Marketing Mistakes to Avoid",
      justification: "Your audience wants to improve their skills, and learning from mistakes is highly engaging.",
      confidence: 9
    },
    {
      title: "The Future of AI in Content Creation",
      justification: "Given the interest in your tech-related posts, this forward-looking topic would perform well.",
      confidence: 7
    }
  ];
}

export async function generateContentIdea(topic: string, context: string = ''): Promise<GeneratedIdea> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    title: `Comprehensive Guide to ${topic}`,
    justification: `This topic addresses a clear need in your market and builds on your existing content about ${context || 'related subjects'}.`,
    confidence: 8
  };
}

export async function analyzeContentQuality(content: string): Promise<{
  score: number;
  strengths: string[];
  improvements: string[];
  seoScore: number;
  readabilityScore: number;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple mock analysis based on content length and basic metrics
  const wordCount = content.split(' ').length;
  const score = Math.min(100, Math.max(60, 70 + (wordCount / 100)));
  
  return {
    score,
    strengths: [
      "Good content structure",
      "Clear and concise writing",
      "Relevant topic coverage"
    ],
    improvements: [
      "Add more specific examples",
      "Include relevant statistics",
      "Optimize meta description"
    ],
    seoScore: Math.min(100, score - 5),
    readabilityScore: Math.min(100, score + 5)
  };
}