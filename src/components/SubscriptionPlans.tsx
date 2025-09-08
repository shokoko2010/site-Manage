import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: 'free' | 'basic' | 'premium' | 'enterprise';
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out the platform',
    features: [
      { name: 'View Dashboard', included: true },
      { name: 'View Own Content', included: true },
      { name: 'Create Content', included: false },
      { name: 'Edit Content', included: false },
      { name: 'Delete Content', included: false },
      { name: 'View Analytics', included: false },
      { name: 'Manage Users', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9',
    description: 'Great for individuals and small teams',
    features: [
      { name: 'View Dashboard', included: true },
      { name: 'View Own Content', included: true },
      { name: 'Create Content', included: true },
      { name: 'Edit Content', included: true },
      { name: 'Delete Content', included: false },
      { name: 'View Analytics', included: false },
      { name: 'Manage Users', included: false },
      { name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29',
    description: 'For growing businesses',
    features: [
      { name: 'View Dashboard', included: true },
      { name: 'View Own Content', included: true },
      { name: 'Create Content', included: true },
      { name: 'Edit Content', included: true },
      { name: 'Delete Content', included: true },
      { name: 'View Analytics', included: true },
      { name: 'Manage Users', included: false },
      { name: 'Priority Support', included: true },
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    description: 'For large organizations',
    features: [
      { name: 'View Dashboard', included: true },
      { name: 'View Own Content', included: true },
      { name: 'Create Content', included: true },
      { name: 'Edit Content', included: true },
      { name: 'Delete Content', included: true },
      { name: 'View Analytics', included: true },
      { name: 'Manage Users', included: true },
      { name: 'Priority Support', included: true },
    ],
  },
];

export const SubscriptionPlans: React.FC = () => {
  const { user } = useAuth();

  const handleUpgrade = (planId: string) => {
    // In a real app, this would integrate with a payment system
    alert(`Upgrade to ${planId} plan would be processed here`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Select the perfect plan for your needs
        </p>
        {user && (
          <p className="mt-2 text-sm text-gray-500">
            Current plan: <span className="font-semibold">{user.plan}</span>
          </p>
        )}
      </div>

      <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-x-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-8 bg-white border-2 rounded-2xl shadow-sm ${
              plan.popular
                ? 'border-blue-500 ring-2 ring-blue-500'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex px-4 py-1 text-xs font-semibold leading-5 tracking-wider text-white uppercase bg-blue-600 rounded-full">
                  Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
            </div>

            <ul className="mt-6 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature.name} className="flex items-start">
                  <div className="flex-shrink-0">
                    {feature.included ? (
                      <svg
                        className="h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`ml-3 text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={user?.plan === plan.id}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  user?.plan === plan.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {user?.plan === plan.id ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};