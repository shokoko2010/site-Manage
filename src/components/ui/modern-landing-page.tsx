"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggleLarge } from "@/components/theme-toggle"
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Zap, 
  Shield,
  Star,
  Globe,
  Calendar,
  PenTool,
  BarChart3,
  MessageSquare
} from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "Multi-Site Management",
    description: "Manage multiple WordPress sites from a single dashboard. Save time and streamline your workflow."
  },
  {
    icon: PenTool,
    title: "AI-Powered Content",
    description: "Generate high-quality content using advanced AI. Create articles, product descriptions, and marketing copy."
  },
  {
    icon: Calendar,
    title: "Content Calendar",
    description: "Plan and schedule your content with our intuitive calendar. Never miss a publishing date."
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track performance with detailed analytics. Understand what works and what doesn't."
  },
  {
    icon: TrendingUp,
    title: "SEO Optimization",
    description: "Built-in SEO tools to help your content rank higher. Optimize meta tags, keywords, and more."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work seamlessly with your team. Assign roles, manage permissions, and collaborate effectively."
  }
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Manager",
    company: "TechCorp",
    content: "This platform has revolutionized how we manage our content. The AI-powered tools save us hours every week, and the analytics help us make data-driven decisions.",
    rating: 5
  },
  {
    name: "Mike Chen",
    role: "Digital Marketing Director",
    company: "GrowthHackers",
    content: "The multi-site management feature is a game-changer. We manage 15 different websites, and this platform has made our workflow 10x more efficient.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "SEO Specialist",
    company: "RankUp Agency",
    content: "As an SEO professional, I love the built-in optimization tools. The content suggestions and keyword analysis have helped our clients rank higher than ever.",
    rating: 5
  }
]

const pricingPlans = [
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
    cta: "Get Started",
    popular: false
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
    cta: "Contact Sales",
    popular: false
  }
]

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-3xl font-bold text-primary">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex mb-2">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4 italic">
          "{testimonial.content}"
        </p>
        <div>
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.role} at {testimonial.company}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function PricingCard({ plan }: { plan: typeof pricingPlans[0] }) {
  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground">/{plan.period}</span>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
        >
          {plan.cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ModernLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold text-xl">Zex-Content</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</a>
              <a href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</a>
              <a href="#testimonials" className="transition-colors hover:text-foreground/80 text-foreground/60">Testimonials</a>
            </nav>
            <div className="flex items-center space-x-2">
              <ThemeToggleLarge />
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-4 w-4 mr-1" />
            AI-Powered Content Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Revolutionize Your
            <span className="text-primary block">Content Strategy</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            AI-powered content management system for WordPress. Generate, optimize, and schedule content across multiple sites from one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={Users} value="10,000+" label="Active Users" />
            <StatCard icon={PenTool} value="50,000+" label="Articles Generated" />
            <StatCard icon={Globe} value="5,000+" label="WordPress Sites" />
            <StatCard icon={Shield} value="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed to streamline your content creation and management workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Content Creators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what our users have to say about their experience with Zex-Content.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that works best for your team. All plans include a 14-day free trial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of content creators who are already saving time and producing better content with Zex-Content.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}