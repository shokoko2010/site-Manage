import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('main-fixed.tsx executing - START');

try {
  console.log('React available:', !!React);
  console.log('ReactDOM available:', !!ReactDOM);

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  console.log('Root created:', !!root);
  
  // Try to import the App component dynamically
  import('./App.js').then(({ default: App }) => {
    console.log('App component imported successfully');
    
    console.log('About to render App...');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App)
      )
    );
    
    console.log('App render called successfully - END');
  }).catch(error => {
    console.error('Failed to import App component:', error);
    
    // Fallback to a simple component
    const FallbackApp = () => {
      return React.createElement('div', { 
        style: { 
          padding: '20px', 
          backgroundColor: '#fef3c7', 
          border: '2px solid #f59e0b', 
          borderRadius: '8px' 
        } 
      }, 
        React.createElement('h1', { style: { color: '#78350f', marginBottom: '10px' } }, 'Zex-Content App'),
        React.createElement('p', { style: { color: '#92400e' } }, 'The application is loading, but there might be an import issue.'),
        React.createElement('div', { style: { marginTop: '10px', fontSize: '12px', color: '#78350f' } },
          React.createElement('p', null, 'Error: ' + error.message)
        )
      );
    };
    
    root.render(React.createElement(FallbackApp));
  });
  
} catch (error) {
  console.error('Error in main-fixed.tsx:', error);
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background-color: #ffcccc; border: 2px solid red;">
        <h1>Error Loading React</h1>
        <p>There was an error loading the React application.</p>
        <pre style="background: white; padding: 10px; margin: 10px 0;">${error.message}</pre>
      </div>
    `;
  }
}