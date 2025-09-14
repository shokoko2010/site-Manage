import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import './app/globals.css'

console.log('main-app.tsx executing - START');

try {
  console.log('React available:', !!React);
  console.log('ReactDOM available:', !!ReactDOM);

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  console.log('Root created:', !!root);
  
  console.log('About to render AppRouter...');
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(AppRouter)
    )
  );
  
  console.log('AppRouter render called successfully - END');
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