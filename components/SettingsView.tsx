import React, { useState, useContext } from 'react';
import { LanguageContextType } from '../types';
import { LanguageContext } from '../App';

const SettingsView: React.FC = () => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  const [codeCopied, setCodeCopied] = useState(false);

  const phpCodeSnippet = `
/*
 * AI WP Manager Connection Snippet
 * --------------------------------
 * Instructions:
 * 1. IMPORTANT: Change 'YOUR_WP_USERNAME' below to your actual WordPress username.
 * 2. Paste this entire snippet into the "Code Snippets" plugin on your WordPress site.
 * 3. Save and activate the snippet.
 * 4. In the AI WP Manager app, add your site using your username and ANY non-empty password.
 */

// --- Part 1: Allow connection without a real application password ---
add_filter( 'wp_authenticate_application_password_errors', function( $errors, $user, $password ) {
    // IMPORTANT: Replace with your WordPress username.
    $allowed_username = 'YOUR_WP_USERNAME';

    if ( is_wp_error($errors) && $user && $user->user_login === $allowed_username ) {
        // This effectively bypasses the password check for this specific user only.
        return new WP_Error(); // Return an empty WP_Error object to signify success
    }

    return $errors;
}, 10, 3 );


// --- Part 2: Enable CORS for the application to communicate with your site ---
add_action( 'rest_api_init', function() {
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
    add_filter( 'rest_pre_serve_request', function( $value ) {
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE' );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type');
        header( 'Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages');

        return $value;
    });
}, 15 );
`.trim();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(phpCodeSnippet).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  return (
    <div className="p-8 h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('settingsTitle')}</h1>
        <p className="text-gray-400 mt-1">{t('settingsHint')}</p>
      </header>

      <div className="space-y-8 max-w-4xl">
        {/* Method 1: App Password */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-2">{t('method1Title')}</h2>
          <p className="text-gray-400">{t('method1Desc')}</p>
        </div>

        {/* Method 2: Code Snippet */}
        <div className="bg-gray-800 p-6 rounded-lg border border-blue-500/50">
          <h2 className="text-xl font-semibold text-white mb-2">{t('method2Title')}</h2>
          <p className="text-gray-400 mb-4">{t('method2Desc')}</p>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-6">
            <li>{t('instruction1')}</li>
            <li>{t('instruction2')}</li>
            <li>{t('instruction3')}</li>
            <li>{t('instruction4')}</li>
            <li>{t('instruction5')}</li>
          </ol>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-200 p-4 rounded-md text-sm overflow-x-auto">
              <code>{phpCodeSnippet}</code>
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 end-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 text-xs rounded-md transition-colors"
            >
              {codeCopied ? t('codeCopied') : t('copyCode')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
