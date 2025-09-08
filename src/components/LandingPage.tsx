'use client';

import React, { useState, useEffect } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update document title and meta tags
  useEffect(() => {
    document.title = 'Zex-Content - AI-Powered Content Management System for WordPress';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Streamline your content creation with Zex-Content. The ultimate AI-powered platform for managing multiple WordPress sites, generating SEO-optimized content, and scheduling publications.';
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = 'content management, WordPress, AI content generation, SEO optimization, content calendar, multi-site management, digital marketing';
    
    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = 'Zex-Content - AI-Powered Content Management System';
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = 'Revolutionize your content strategy with AI-powered tools for WordPress sites. Generate, optimize, and schedule content effortlessly.';
    
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.content = 'website';
    
    // Twitter Card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.name = 'twitter:card';
      document.head.appendChild(twitterCard);
    }
    twitterCard.content = 'summary_large_image';
    
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.name = 'twitter:title';
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.content = 'Zex-Content - AI-Powered Content Management System';
    
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.name = 'twitter:description';
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.content = 'Streamline content creation with AI. Manage multiple WordPress sites from one dashboard.';
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://zex-content.com';
    
    // Robots meta
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'index, follow';
  }, []);

  const features: Feature[] = [
    {
      title: "Multi-Site Management",
      description: "Manage multiple WordPress sites from a single dashboard. Save time and streamline your workflow.",
      icon: "🌐"
    },
    {
      title: "AI-Powered Content",
      description: "Generate high-quality content using advanced AI. Create articles, product descriptions, and marketing copy.",
      icon: "🤖"
    },
    {
      title: "Content Calendar",
      description: "Plan and schedule your content with our intuitive calendar. Never miss a publishing date.",
      icon: "📅"
    },
    {
      title: "SEO Optimization",
      description: "Built-in SEO tools to help your content rank higher. Optimize meta tags, keywords, and more.",
      icon: "🔍"
    },
    {
      title: "Analytics & Insights",
      description: "Track performance with detailed analytics. Understand what works and what doesn't.",
      icon: "📊"
    },
    {
      title: "Team Collaboration",
      description: "Work seamlessly with your team. Assign roles, manage permissions, and collaborate effectively.",
      icon: "👥"
    }
  ];

  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "Content Manager",
      company: "TechCorp",
      content: "This platform has revolutionized how we manage our content. The AI-powered tools save us hours every week, and the analytics help us make data-driven decisions.",
      avatar: "SJ"
    },
    {
      name: "Mike Chen",
      role: "Digital Marketing Director",
      company: "GrowthHackers",
      content: "The multi-site management feature is a game-changer. We manage 15 different websites, and this platform has made our workflow 10x more efficient.",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "SEO Specialist",
      company: "RankUp Agency",
      content: "As an SEO professional, I love the built-in optimization tools. The content suggestions and keyword analysis have helped our clients rank higher than ever.",
      avatar: "ER"
    }
  ];

  const pricingPlans: PricingPlan[] = [
    {
      name: "Starter",
      price: "$29",
      period: "month",
      description: "Perfect for individuals and small teams",
      features: [
        "Up to 3 WordPress sites",
        "AI content generation (10 articles/month)",
        "Basic analytics",
        "Content calendar",
        "Email support"
      ],
      cta: "Get Started"
    },
    {
      name: "Professional",
      price: "$79",
      period: "month",
      description: "For growing businesses and agencies",
      features: [
        "Up to 10 WordPress sites",
        "AI content generation (50 articles/month)",
        "Advanced analytics",
        "Content calendar & scheduling",
        "SEO optimization tools",
        "Priority support",
        "Team collaboration (5 users)"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "month",
      description: "For large organizations and enterprises",
      features: [
        "Unlimited WordPress sites",
        "Unlimited AI content generation",
        "Custom analytics dashboard",
        "Advanced content scheduling",
        "Comprehensive SEO suite",
        "24/7 dedicated support",
        "Unlimited team members",
        "Custom integrations",
        "White-label options"
      ],
      cta: "Contact Sales"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    setEmail('');
    alert('Thank you for your interest! We\'ll contact you soon.');
  };

  return (
    <>
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">Zex-Content</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                  <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                  <a href="#testimonials" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Testimonials</a>
                  <a href="#faq" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">FAQ</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </a>
              <a href="/dashboard" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Revolutionize Your
              <span className="text-blue-600 block">Content Strategy</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              AI-powered content management system for WordPress. Generate, optimize, and schedule content across multiple sites from one powerful dashboard.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/dashboard" className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center">
                Start Free Trial
              </a>
              <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 transition-colors">
                Watch Demo
              </button>
            </div>
            <div className="mt-12 flex justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                No credit card required
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                14-day free trial
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to streamline your content creation and management workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Articles Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">WordPress Sites</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Loved by Content Creators Worldwide
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users have to say about their experience with Zex-Content.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for your team. All plans include a 14-day free trial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-xl shadow-lg border-2 ${plan.popular ? 'border-blue-600' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="/dashboard" className={`w-full py-3 rounded-lg font-semibold transition-colors text-center block ${
                    plan.popular 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of content creators who are already using Zex-Content to streamline their workflow.
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button type="submit" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started
            </button>
          </form>
          <div className="mt-4">
            <a href="/dashboard" className="text-blue-100 hover:text-white underline">
              Or sign in directly to your account
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What is Zex-Content?</h3>
              <p className="text-gray-600">Zex-Content is an AI-powered content management system designed specifically for WordPress sites. It helps you create, optimize, and schedule content across multiple websites from one centralized dashboard.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the AI content generation work?</h3>
              <p className="text-gray-600">Our AI uses advanced natural language processing to generate high-quality, SEO-optimized content based on your requirements. You can specify topics, keywords, tone, and length to get content that matches your needs.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I manage multiple WordPress sites?</h3>
              <p className="text-gray-600">Yes! Depending on your plan, you can manage anywhere from 3 to unlimited WordPress sites from a single Zex-Content dashboard.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial available?</h3>
              <p className="text-gray-600">Yes, all plans come with a 14-day free trial. No credit card is required to start your trial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Zex-Content</h3>
              <p className="text-gray-400">AI-powered content management for WordPress sites.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Zex-Content. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;