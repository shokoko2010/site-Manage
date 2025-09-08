console.log('Pure JavaScript test starting...');

// Function to inject content
function injectContent() {
    console.log('Injecting content...');
    
    const rootElement = document.getElementById('root');
    console.log('Root element found:', !!rootElement);
    
    if (rootElement) {
        rootElement.innerHTML = `
            <div style="padding: 20px; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;">
                <h1 style="color: #78350f; margin-bottom: 10px;">Pure JavaScript Test</h1>
                <p style="color: #92400e;">If you can see this, pure JavaScript is working!</p>
                <button onclick="alert('Pure JS button clicked!')" style="background-color: #f59e0b; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Click Me
                </button>
            </div>
        `;
        console.log('Content injected successfully');
    } else {
        console.error('Root element not found');
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM still loading, adding event listener...');
    document.addEventListener('DOMContentLoaded', injectContent);
} else {
    console.log('DOM already loaded, injecting content immediately...');
    injectContent();
}

console.log('Pure JavaScript test loaded');