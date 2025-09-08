import React from 'react';
import { Link } from 'react-router-dom';

const LandingPageSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">Zex-Content</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/app" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Log In</Link>
              <Link to="/app" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">Get Started Free</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Transform Your Content Strategy with
              <span className="text-indigo-600 block">AI-Powered Excellence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create, manage, and optimize content across multiple WordPress sites with advanced AI technology. 
              Boost your productivity and content quality like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/app" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors transform hover:scale-105">
                Start Free Trial
              </Link>
              <a href="#features" className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors">
                View Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Powerful Features for Content Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and optimize your content strategy
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Content Generation",
                description: "Create high-quality articles, product descriptions, and marketing content with advanced AI technology.",
                icon: "🤖"
              },
              {
                title: "Multi-Site Management",
                description: "Manage multiple WordPress sites from a single dashboard with seamless integration.",
                icon: "🌐"
              },
              {
                title: "Content Calendar",
                description: "Plan and schedule your content strategy with an intuitive calendar interface.",
                icon: "📅"
              },
              {
                title: "SEO Optimization",
                description: "Built-in SEO tools to help your content rank higher in search results.",
                icon: "🔍"
              },
              {
                title: "Analytics & Performance",
                description: "Track content performance with detailed analytics and insights.",
                icon: "📊"
              },
              {
                title: "Team Collaboration",
                description: "Collaborate with your team with user roles and permissions.",
                icon: "👥"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Trusted by Content Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers have to say about their experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Marketing Manager",
                company: "TechCorp Inc.",
                content: "Zex-Content has revolutionized our content creation process. We've seen a 300% increase in productivity and our content quality has improved dramatically.",
                avatar: "https://randomuser.me/api/portraits/women/1.jpg"
              },
              {
                name: "Michael Chen",
                role: "SEO Specialist",
                company: "Digital Agency Pro",
                content: "The AI-powered content generation is incredible. It helps us create SEO-optimized content that actually ranks. A game-changer for our agency!",
                avatar: "https://randomuser.me/api/portraits/men/2.jpg"
              },
              {
                name: "Emily Rodriguez",
                role: "E-commerce Manager",
                company: "ShopSmart",
                content: "Managing multiple WordPress sites used to be a nightmare. Zex-Content makes it effortless. Highly recommended!",
                avatar: "https://randomuser.me/api/portraits/women/3.jpg"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-indigo-600">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Transform Your Content Strategy?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of content creators who are already using Zex-Content to boost their productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Free Trial
            </Link>
            <a href="#features" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Zex-Content</h3>
              <p className="text-gray-400">
                AI-powered content management platform for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
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
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Zex-Content. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageSimple;