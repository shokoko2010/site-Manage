import React, { useState, useContext } from 'react';
import { WordPressSite, LanguageContextType } from '../types';
import Modal from './common/Modal';
import Spinner from './common/Spinner';
import { addSite } from '../services/wordpressService';
import { LanguageContext } from '../App';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSite: (site: WordPressSite) => void;
  sites: WordPressSite[];
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, onClose, onAddSite, sites }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  
  const [addMode, setAddMode] = useState<'connected' | 'virtual'>('connected');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteUsername, setNewSiteUsername] = useState('');
  const [newSitePassword, setNewSitePassword] = useState('');
  const [virtualSiteName, setVirtualSiteName] = useState('');
  const [virtualSiteUrl, setVirtualSiteUrl] = useState('');
  
  const cleanup = () => {
    setIsAdding(false);
    setError('');
    setNewSiteUrl('');
    setNewSiteUsername('');
    setNewSitePassword('');
    setVirtualSiteUrl('');
    setVirtualSiteName('');
  };

  const handleClose = () => {
      cleanup();
      onClose();
  }

  const handleAddConnectedSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim() || !newSiteUsername.trim() || !newSitePassword.trim()) {
      setError(t('errorAllFieldsRequired'));
      return;
    }
    setError('');
    setIsAdding(true);
    try {
      const newSite = await addSite(newSiteUrl, newSiteUsername, newSitePassword);
      onAddSite(newSite);
      handleClose();
    } catch (err) {
       if (err instanceof Error && (err.message.includes("already been added") || err.message.includes("exists"))) {
          setError(t('errorUrlExists'));
      } else {
        setError(err instanceof Error ? err.message : t('errorUnknown'));
      }
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleAddVirtualSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!virtualSiteUrl.trim() || !virtualSiteName.trim()) {
        setError(t('errorAllFieldsRequired'));
        return;
    }
    let cleanedUrl: string;
    try {
        cleanedUrl = new URL(virtualSiteUrl).origin;
    } catch (err) {
        setError(t('errorInvalidUrl'));
        return;
    }
    
    if (sites.some(s => s.id === cleanedUrl)) {
        setError(t('errorUrlExists'));
        return;
    }

    setError('');
    const newVirtualSite: WordPressSite = {
        id: cleanedUrl,
        url: cleanedUrl,
        name: virtualSiteName,
        isVirtual: true,
        stats: { posts: 0, pages: 0, products: 0 },
        username: '',
        appPassword: ''
    };
    onAddSite(newVirtualSite);
    handleClose();
  };

  const renderConnectedForm = () => (
      <form onSubmit={handleAddConnectedSite} className="space-y-4">
        <div>
          <label htmlFor="siteUrl" className="text-sm font-medium text-gray-300 mb-1 block">{t('siteUrl')}</label>
          <input id="siteUrl" type="url" value={newSiteUrl} onChange={(e) => setNewSiteUrl(e.target.value)} placeholder={t('siteUrlPlaceholder')} className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:outline-none" disabled={isAdding} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wpUser" className="text-sm font-medium text-gray-300 mb-1 block">{t('username')}</label>
            <input id="wpUser" type="text" value={newSiteUsername} onChange={(e) => setNewSiteUsername(e.target.value)} placeholder={t('usernamePlaceholder')} className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:outline-none" disabled={isAdding} />
          </div>
          <div>
            <label htmlFor="wpAppPass" className="text-sm font-medium text-gray-300 mb-1 block">{t('appPassword')}</label>
            <input id="wpAppPass" type="password" value={newSitePassword} onChange={(e) => setNewSitePassword(e.target.value)} placeholder={t('appPasswordPlaceholder')} className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-sky-500 focus:outline-none" disabled={isAdding} />
          </div>
        </div>
        <p className="text-xs text-gray-400">Find this in your WP profile. Use <a href="#" onClick={() => { /* TODO: navigate to settings */ }} className="underline text-sky-400">the snippet</a> if it's not available.</p>
        <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed" disabled={isAdding}>
          {isAdding ? <Spinner size="sm"/> : t('connectSite')}
        </button>
      </form>
  );

  const renderVirtualForm = () => (
      <form onSubmit={handleAddVirtualSite} className="space-y-4">
          <p className="text-sm text-gray-400">{t('virtualSiteDesc')}</p>
          <div>
              <label htmlFor="virtualSiteName" className="text-sm font-medium text-gray-300 mb-1 block">{t('siteName')}</label>
              <input id="virtualSiteName" type="text" value={virtualSiteName} onChange={(e) => setVirtualSiteName(e.target.value)} placeholder={t('siteNamePlaceholder')} className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
              <label htmlFor="virtualSiteUrl" className="text-sm font-medium text-gray-300 mb-1 block">{t('siteUrl')}</label>
              <input id="virtualSiteUrl" type="url" value={virtualSiteUrl} onChange={(e) => setVirtualSiteUrl(e.target.value)} placeholder={t('siteUrlPlaceholder')} className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors">
              {t('addVirtualSite')}
          </button>
      </form>
  );

  if (!isOpen) return null;

  return (
    <Modal title={t('addNewSite')} onClose={handleClose}>
        <div className="flex border-b border-gray-700 mb-4">
            <button onClick={() => setAddMode('connected')} className={`py-2 px-4 text-sm font-medium ${addMode === 'connected' ? 'border-b-2 border-sky-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t('connectSite')}
            </button>
            <button onClick={() => setAddMode('virtual')} className={`py-2 px-4 text-sm font-medium ${addMode === 'virtual' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {t('addVirtualSite')}
            </button>
        </div>
        <div className="p-1">
            {addMode === 'connected' ? renderConnectedForm() : renderVirtualForm()}
            {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        </div>
    </Modal>
  );
};

export default AddSiteModal;