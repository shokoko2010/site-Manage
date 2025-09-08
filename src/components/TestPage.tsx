import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Test Page</h1>
        <p className="text-lg text-gray-700">If you can see this, React is working!</p>
      </div>
    </div>
  );
};

export default TestPage;