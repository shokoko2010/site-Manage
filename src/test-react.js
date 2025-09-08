import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('React test starting...');

try {
    console.log('React available:', !!React);
    console.log('ReactDOM available:', !!ReactDOM);
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    console.log('Root created:', !!root);
    
    const TestComponent = () => {
        return React.createElement('div', { 
            style: { 
                padding: '20px', 
                backgroundColor: '#dcfce7', 
                border: '2px solid #16a34a', 
                borderRadius: '8px' 
            } 
        }, 
            React.createElement('h1', { style: { color: '#14532d', marginBottom: '10px' } }, 'React Test Page'),
            React.createElement('p', { style: { color: '#15803d' } }, 'If you can see this, React is working!'),
            React.createElement('button', { 
                onClick: () => alert('React button clicked!'),
                style: { 
                    backgroundColor: '#16a34a', 
                    color: 'white', 
                    padding: '8px 16px', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    marginTop: '10px' 
                }
            }, 'Click Me')
        );
    };
    
    root.render(React.createElement(TestComponent));
    console.log('React test completed successfully');
    
} catch (error) {
    console.error('React test failed:', error);
    
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="padding: 20px; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px;">
                <h1 style="color: #7f1d1d;">React Error</h1>
                <p style="color: #991b1b;">There was an error loading React:</p>
                <pre style="background: white; padding: 10px; margin: 10px 0; color: #7f1d1d;">${error.message}</pre>
            </div>
        `;
    }
}