// Basic test without any imports
console.log('Test script starting...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    const rootElement = document.getElementById('root');
    
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="padding: 20px; background-color: #e0f2fe; border: 2px solid #0284c7; border-radius: 8px;">
                <h1 style="color: #0c4a6e; margin-bottom: 10px;">Basic Test Page</h1>
                <p style="color: #075985;">If you can see this, the basic HTML/JavaScript is working!</p>
                <button onclick="alert('Button clicked!')" style="background-color: #0284c7; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Click Me
                </button>
            </div>
        `;
        console.log('Content injected successfully');
    } else {
        console.error('Root element not found');
    }
});

console.log('Test script loaded');