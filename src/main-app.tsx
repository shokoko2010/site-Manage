import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './app/globals.css'

console.log('main-app.tsx executing - START');

try {
  console.log('React available:', !!React);
  console.log('ReactDOM available:', !!ReactDOM);
  console.log('App component importing...');

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  console.log('Root created:', !!root);
  
  console.log('About to render App...');
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(App)
    )
  );
  
  console.log('App render called successfully - END');
} catch (error) {
  console.error('Error in main-app.tsx:', error);
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background-color: #ffcccc; border: 2px solid red;">
        <h1>Error Loading React</h1>
        <p>There was an error loading the React application.</p>
        <pre style="background: white; padding: 10px; margin: 10px 0;">${error.message}</pre>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
  }
}