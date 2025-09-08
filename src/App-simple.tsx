import React from 'react'

console.log('App-simple.tsx loaded');

const AppSimple = () => {
  console.log('AppSimple component rendering');
  
  return React.createElement('div', { 
    style: { 
      padding: '20px', 
      backgroundColor: '#ecfdf5', 
      border: '2px solid #10b981', 
      borderRadius: '8px',
      minHeight: '100vh'
    } 
  }, 
    React.createElement('h1', { 
      style: { 
        color: '#064e3b', 
        marginBottom: '20px',
        textAlign: 'center'
      } 
    }, 'Zex-Content Site Management System'),
    
    React.createElement('div', { 
      style: { 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      } 
    },
      React.createElement('h2', { style: { color: '#064e3b', marginBottom: '10px' } }, 'Welcome to Zex-Content'),
      React.createElement('p', { style: { color: '#047857', marginBottom: '15px' } }, 
        'This is a comprehensive site management system with AI-powered content generation.'
      ),
      React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
        React.createElement('button', { 
          style: { 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          },
          onClick: () => alert('Dashboard clicked!')
        }, 'Dashboard'),
        
        React.createElement('button', { 
          style: { 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          },
          onClick: () => alert('Content clicked!')
        }, 'Content'),
        
        React.createElement('button', { 
          style: { 
            backgroundColor: '#8b5cf6', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          },
          onClick: () => alert('Sites clicked!')
        }, 'Sites')
      )
    ),
    
    React.createElement('div', { 
      style: { 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px' 
      } 
    },
      React.createElement('h3', { style: { color: '#064e3b', marginBottom: '10px' } }, 'Features'),
      React.createElement('ul', { style: { color: '#047857', paddingLeft: '20px' } },
        React.createElement('li', null, 'AI-powered content generation'),
        React.createElement('li', null, 'WordPress site integration'),
        React.createElement('li', null, 'Content scheduling and calendar'),
        React.createElement('li', null, 'Multi-language support'),
        React.createElement('li', null, 'Analytics and reporting')
      )
    )
  );
};

export default AppSimple;