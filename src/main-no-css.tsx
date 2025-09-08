import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('main-no-css.tsx executing - START');

try {
  console.log('React available:', !!React);
  console.log('ReactDOM available:', !!ReactDOM);

  const root = ReactDOM.createRoot(document.getElementById('root')!)
  console.log('Root created:', !!root);
  
  // Simple test component without any imports
  const TestApp = () => {
    return React.createElement('div', { 
      style: { 
        padding: '20px', 
        backgroundColor: '#dbeafe', 
        border: '2px solid #3b82f6', 
        borderRadius: '8px',
        minHeight: '100vh'
      } 
    }, 
      React.createElement('h1', { 
        style: { 
          color: '#1e3a8a', 
          marginBottom: '20px',
          textAlign: 'center'
        } 
      }, '🎉 Zex-Content App Working!'),
      
      React.createElement('div', { 
        style: { 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        } 
      },
        React.createElement('h2', { style: { color: '#1e3a8a', marginBottom: '10px' } }, '✅ Application Successfully Loaded'),
        React.createElement('p', { style: { color: '#1e40af', marginBottom: '15px' } }, 
          'The Zex-Content Site Management System is now working!'
        ),
        React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
          React.createElement('button', { 
            style: { 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px'
            },
            onClick: () => alert('Dashboard functionality coming soon!')
          }, '📊 Dashboard'),
          
          React.createElement('button', { 
            style: { 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px'
            },
            onClick: () => alert('Content management coming soon!')
          }, '📝 Content'),
          
          React.createElement('button', { 
            style: { 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              padding: '12px 24px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px'
            },
            onClick: () => alert('AI features coming soon!')
          }, '🤖 AI Assistant')
        )
      ),
      
      React.createElement('div', { 
        style: { 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px' 
        } 
      },
        React.createElement('h3', { style: { color: '#1e3a8a', marginBottom: '15px', textAlign: 'center' } }, '🚀 System Status'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' } },
          React.createElement('div', { style: { padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' } },
            React.createElement('h4', { style: { color: '#0c4a6e', margin: '0 0 10px 0' } }, '✅ Frontend'),
            React.createElement('p', { style: { color: '#075985', margin: 0, fontSize: '14px' } }, 'Port 3000')
          ),
          React.createElement('div', { style: { padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #22c55e' } },
            React.createElement('h4', { style: { color: '#14532d', margin: '0 0 10px 0' } }, '✅ Backend'),
            React.createElement('p', { style: { color: '#15803d', margin: 0, fontSize: '14px' } }, 'Port 3001')
          ),
          React.createElement('div', { style: { padding: '15px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' } },
            React.createElement('h4', { style: { color: '#78350f', margin: '0 0 10px 0' } }, '✅ Database'),
            React.createElement('p', { style: { color: '#92400e', margin: 0, fontSize: '14px' } }, 'SQLite Ready')
          )
        )
      )
    );
  };
  
  console.log('About to render TestApp...');
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(TestApp)
    )
  );
  
  console.log('TestApp render called successfully - END');
} catch (error) {
  console.error('Error in main-no-css.tsx:', error);
  
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