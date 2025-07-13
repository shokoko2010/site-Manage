import React, { useState, useContext, useEffect } from 'react';
import { LanguageContextType, Notification } from '../types';
import { LanguageContext } from '../App';

interface SettingsViewProps {
  showNotification: (notification: Notification) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showNotification }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  const [codeCopied, setCodeCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [brandVoice, setBrandVoice] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key') || '';
    setApiKey(storedKey);
    const storedBrandVoice = localStorage.getItem('brand_voice') || '';
    setBrandVoice(storedBrandVoice);
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    showNotification({ message: t('apiKeySaved'), type: 'success' });
  };
  
  const handleSaveBrandVoice = () => {
    localStorage.setItem('brand_voice', brandVoice);
    showNotification({ message: t('brandVoiceSaved'), type: 'success' });
  };

  const phpCodeSnippet = `
/*
 * AI WP Manager Connection Snippet (v4 - Improved CORS)
 * -----------------------------------------------------------------
 * Instructions:
 * 1. IMPORTANT: Change 'YOUR_WP_USERNAME' below to your actual WordPress username.
 * 2. Paste this entire snippet into the "Code Snippets" plugin on your WordPress site.
 * 3. Save and activate the snippet. This should resolve CORS or connection errors.
 * 4. This version adds performance tracking (Views, Comments). Ensure you have a post
 *    view counter plugin active that uses 'post_views_count' meta key for best results.
 */

// --- Part 1: Allow connection without a real application password ---
add_filter( 'wp_authenticate_application_password_errors', function( $errors, $user, $password ) {
    // IMPORTANT: Replace with your WordPress username.
    $allowed_username = 'YOUR_WP_USERNAME';

    if ( is_wp_error($errors) && $user && $user->user_login === $allowed_username ) {
        // This bypasses the password check for this specific user, allowing any password to work.
        return new WP_Error(); // Return an empty WP_Error object to signify success
    }

    return $errors;
}, 10, 3 );


// --- Part 2: REST API Enhancements (CORS & Custom Fields) ---
// This runs early to set up CORS headers before other plugins can interfere.
add_action('init', function() {
    // Set a very late priority to ensure these headers are applied last.
    $priority = 99;

    // Remove the default WordPress CORS handling.
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers', 10);

    // Add custom, more permissive CORS handling.
    add_filter('rest_pre_serve_request', function($value) {
        // Allow requests from any origin.
        header('Access-Control-Allow-Origin: *');
        // Define allowed HTTP methods.
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        // Allow credentials to be sent.
        header('Access-Control-Allow-Credentials: true');
        // Define allowed headers in requests.
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        // Expose headers needed by the application.
        header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, Link');

        // Handle pre-flight OPTIONS requests from browsers.
        if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) {
            status_header(200);
            exit();
        }

        return $value;
    }, $priority);
}, $priority);

// Register custom fields for the REST API
add_action( 'rest_api_init', function() {
    // --- Expose Performance Stats ---
    register_rest_field( 'post', 'performance_stats', array(
        'get_callback' => function( $post_arr ) {
            // Assumes a post view counter plugin is saving data to 'post_views_count' meta key.
            $views = get_post_meta( $post_arr['id'], 'post_views_count', true );
            $comments_count = get_comments_number( $post_arr['id'] );

            return array(
                'views' => $views ? (int) $views : 0,
                'comments' => (int) $comments_count,
            );
        },
        'schema' => array(
            'description' => 'Post performance statistics.',
            'type'        => 'object',
            'properties'  => array(
                'views' => array('type' => 'integer'),
                'comments' => array('type' => 'integer'),
            ),
        ),
    ) );
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
        {/* Gemini API Settings */}
        <div className="bg-gray-800 p-6 rounded-xl border border-sky-500/30">
          <h2 className="text-xl font-semibold text-white mb-2">{t('apiSettingsTitle')}</h2>
          <p className="text-gray-400 mb-4">{t('apiSettingsDesc')}</p>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex-grow">
              <label htmlFor="gemini-api-key" className="sr-only">{t('geminiApiKey')}</label>
              <input
                id="gemini-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('geminiApiKeyPlaceholder')}
                className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveApiKey}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </div>
        
        {/* Brand Voice Settings */}
        <div className="bg-gray-800 p-6 rounded-xl border border-indigo-500/30">
          <h2 className="text-xl font-semibold text-white mb-2">{t('brandVoice')}</h2>
          <p className="text-gray-400 mb-4">{t('brandVoiceHint')}</p>
          <textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder={t('brandVoicePlaceholder')}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows={4}
          />
          <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveBrandVoice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {t('save')}
              </button>
          </div>
        </div>

        {/* Connection Methods */}
        <h2 className="text-2xl font-bold text-white pt-4 border-t border-gray-700">{t('method1Title')}</h2>
        <div className="bg-gray-800 p-6 rounded-xl">
          <p className="text-gray-400">{t('method1Desc')}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-2">{t('method2Title')}</h3>
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
              className="absolute top-2 end-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 text-xs rounded-lg transition-colors"
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