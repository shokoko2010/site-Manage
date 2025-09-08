import React from 'react'
import ReactDOM from 'react-dom/client'
import AppSimple from './App-simple'
import './app/globals.css'

console.log('main-simple.tsx executing - START');

try {
  console.log('React available:', !!React);
  console.log('ReactDOM available:', !!ReactDOM);
  console.log('AppSimple available:', !!AppSimple);

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  console.log('Root created:', !!root);
  
  console.log('About to render AppSimple...');
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(AppSimple)
    )
  );
  
  console.log('AppSimple render called successfully - END');
} catch (error) {
  console.error('Error in main-simple.tsx:', error);
  
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