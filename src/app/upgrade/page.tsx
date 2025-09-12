import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Zap, Shield } from 'lucide-react';

const plans = [
  {
    name: "Basic",
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
      "Custom analytics appboard",
      "Advanced content scheduling",
      "Comprehensive SEO suite",
      "24/7 dedicated support",
      "Unlimited team members",
      "Custom integrations",
      "White-label options"
    ],
    popular: false
  }
];

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="mr-4 flex">
            <Link href="/appboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold">Back to Appboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
              <Star className="h-4 w-4 mr-1" />
              Upgrade Your Account
            </div>
            <h1 className="text-3xl font-bold">Unlock More Features</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upgrade your plan to access premium features and take your content management to the next level.
            </p>
          </div>

          {/* Current Plan Status */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Current Plan: Free</span>
              </CardTitle>
              <CardDescription>
                You're currently on the Free plan. Upgrade to unlock more features and increase your limits.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
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
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <Zap className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.name === 'Free' ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>See what's included in each plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      <th className="text-center p-2">Free</th>
                      <th className="text-center p-2">Basic</th>
                      <th className="text-center p-2">Professional</th>
                      <th className="text-center p-2">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">WordPress Sites</td>
                      <td className="text-center p-2">1</td>
                      <td className="text-center p-2">3</td>
                      <td className="text-center p-2">10</td>
                      <td className="text-center p-2">∞</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">AI Content Generation</td>
                      <td className="text-center p-2">5/month</td>
                      <td className="text-center p-2">10/month</td>
                      <td className="text-center p-2">50/month</td>
                      <td className="text-center p-2">∞</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Advanced Analytics</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Team Collaboration</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">5 users</td>
                      <td className="text-center p-2">∞</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Priority Support</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">✗</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">24/7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}