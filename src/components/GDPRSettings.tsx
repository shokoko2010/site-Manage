import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getGDPRSettings, type GDPRSettings } from '../services/aiEnhancementService';
import { ShieldCheckIcon, DocumentTextIcon, ClockIcon, UsersIcon, TrashIcon, CheckCircleIcon } from '../lib/constants';

interface GDPRSettingsProps {
    onSettingsUpdate: (settings: GDPRSettings) => void;
}

const GDPRSettings: React.FC<GDPRSettingsProps> = ({ onSettingsUpdate }) => {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<GDPRSettings>(getGDPRSettings());
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const storedSettings = getGDPRSettings();
        setSettings(storedSettings);
    }, []);

    const handleSettingChange = (key: keyof GDPRSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setHasChanges(true);
    };

    const saveSettings = () => {
        localStorage.setItem('gdpr_settings', JSON.stringify(settings));
        onSettingsUpdate(settings);
        setHasChanges(false);
    };

    const resetSettings = () => {
        const defaultSettings: GDPRSettings = {
            enabled: true,
            anonymizeData: true,
            dataRetentionDays: 90,
            consentRequired: true,
            userConsent: false
        };
        setSettings(defaultSettings);
        setHasChanges(true);
    };

    const clearData = () => {
        if (confirm('Are you sure you want to clear all stored content data? This action cannot be undone.')) {
            localStorage.removeItem('content_library');
            localStorage.removeItem('gdpr_settings');
            const defaultSettings = getGDPRSettings();
            setSettings(defaultSettings);
            setHasChanges(false);
            alert('All data has been cleared successfully.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                    <ShieldCheckIcon className="w-6 h-6 text-green-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">GDPR Compliance Settings</h3>
                </div>
                
                <p className="text-gray-400 mb-6">
                    Configure how your content generation and data handling complies with GDPR regulations. 
                    These settings help ensure privacy and data protection for your users.
                </p>

                <div className="space-y-6">
                    {/* Main Compliance Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Enable GDPR Compliance</h4>
                                <p className="text-sm text-gray-400">Apply GDPR rules to all content processing</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Data Anonymization */}
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                                <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Anonymize Personal Data</h4>
                                <p className="text-sm text-gray-400">Remove emails, phones, and personal identifiers</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.anonymizeData}
                                onChange={(e) => handleSettingChange('anonymizeData', e.target.checked)}
                                disabled={!settings.enabled}
                                className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                settings.enabled 
                                    ? 'bg-gray-600 peer-focus:outline-none peer-checked:bg-blue-500' 
                                    : 'bg-gray-800 cursor-not-allowed'
                            } peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                        </label>
                    </div>

                    {/* Data Retention */}
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                                <ClockIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Data Retention Period</h4>
                                <p className="text-sm text-gray-400">How long to keep generated content data</p>
                            </div>
                        </div>
                        <select
                            value={settings.dataRetentionDays}
                            onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                            disabled={!settings.enabled}
                            className={`w-full px-3 py-2 rounded-lg text-white ${
                                settings.enabled 
                                    ? 'bg-gray-600 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500' 
                                    : 'bg-gray-800 border border-gray-700 cursor-not-allowed'
                            }`}
                        >
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days (Recommended)</option>
                            <option value={180}>180 days</option>
                            <option value={365}>1 year</option>
                        </select>
                    </div>

                    {/* User Consent */}
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                                <UsersIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Require User Consent</h4>
                                <p className="text-sm text-gray-400">Need explicit consent for data processing</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.consentRequired}
                                onChange={(e) => handleSettingChange('consentRequired', e.target.checked)}
                                disabled={!settings.enabled}
                                className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                settings.enabled 
                                    ? 'bg-gray-600 peer-focus:outline-none peer-checked:bg-purple-500' 
                                    : 'bg-gray-800 cursor-not-allowed'
                            } peer-checked:after:translate-x-full peer-checked:after:border-white`}></div>
                        </label>
                    </div>

                    {/* Current Consent Status */}
                    {settings.consentRequired && (
                        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg mr-3">
                                        {settings.userConsent ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">User Consent Status</h4>
                                        <p className="text-sm text-gray-400">
                                            {settings.userConsent ? 'Consent has been granted' : 'Consent is required'}
                                        </p>
                                    </div>
                                </div>
                                {!settings.userConsent && (
                                    <button
                                        onClick={() => handleSettingChange('userConsent', true)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                                    >
                                        Grant Consent
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Compliance Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-700/50">
                    <h4 className="font-medium text-white mb-2">Compliance Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                            <CheckCircleIcon className={`w-4 h-4 mr-2 ${settings.enabled ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={settings.enabled ? 'text-green-300' : 'text-gray-400'}>
                                GDPR Compliance: {settings.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircleIcon className={`w-4 h-4 mr-2 ${settings.anonymizeData ? 'text-blue-400' : 'text-gray-500'}`} />
                            <span className={settings.anonymizeData ? 'text-blue-300' : 'text-gray-400'}>
                                Data Anonymization: {settings.anonymizeData ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircleIcon className={`w-4 h-4 mr-2 ${settings.consentRequired ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={settings.consentRequired ? 'text-purple-300' : 'text-gray-400'}>
                                Consent Required: {settings.consentRequired ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-2 text-yellow-400" />
                            <span className="text-yellow-300">
                                Retention: {settings.dataRetentionDays} days
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <div className="space-x-3">
                    <button
                        onClick={resetSettings}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={clearData}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Clear All Data
                    </button>
                </div>
                
                {hasChanges && (
                    <button
                        onClick={saveSettings}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center"
                    >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Save Settings
                    </button>
                )}
            </div>

            {/* Information Section */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">About GDPR Compliance</h4>
                <div className="text-sm text-blue-200 space-y-2">
                    <p>
                        <strong>General Data Protection Regulation (GDPR)</strong> is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area.
                    </p>
                    <p>
                        These settings help ensure that your content generation and data handling practices comply with GDPR requirements, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Lawful, fair, and transparent data processing</li>
                        <li>Data minimization and anonymization</li>
                        <li>Appropriate data retention periods</li>
                        <li>User consent management</li>
                        <li>Data subject rights protection</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GDPRSettings;