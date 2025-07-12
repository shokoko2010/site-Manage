import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, LanguageContextType, ContentType } from '../types';
import { AppTitle, DashboardIcon, PlusCircleIcon, LibraryIcon, SettingsIcon, CalendarIcon, LanguageIcon, ArticleIcon, StrategyIcon, ProductIcon } from '../constants';
import { LanguageContext } from '../App';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onQuickAction: (type: ContentType) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, view, currentView, onClick }) => {
  const isActive = currentView === view;
  const { language } = useContext(LanguageContext as React.Context<LanguageContextType>);
  const textAlignment = language === 'ar' ? 'text-right' : 'text-left';

  return (
    <button
      onClick={() => onClick(view)}
      className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="mx-3">{label}</span>
    </button>
  );
};

const QuickActionButton = ({ onAction }: { onAction: (type: ContentType) => void }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type: ContentType) => {
        onAction(type);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 shadow-lg hover:shadow-indigo-500/50"
            >
                <PlusCircleIcon />
                <span className="mx-3">{t('newContent')}</span>
            </button>
            {isOpen && (
                 <div className="absolute bottom-full mb-2 w-full bg-gray-700 rounded-lg shadow-2xl z-10 p-1.5 border border-gray-600 animate-fade-in-fast">
                    <button onClick={() => handleSelect(ContentType.Article)} className="flex items-center w-full p-2 text-sm text-gray-200 hover:bg-gray-600 rounded-md"><ArticleIcon className="me-2"/>{t('article')}</button>
                    <button onClick={() => handleSelect(ContentType.Product)} className="flex items-center w-full p-2 text-sm text-gray-200 hover:bg-gray-600 rounded-md"><ProductIcon className="me-2"/>{t('product')}</button>
                    <button onClick={() => handleSelect(ContentType.Strategy)} className="flex items-center w-full p-2 text-sm text-gray-200 hover:bg-gray-600 rounded-md"><StrategyIcon className="me-2"/>{t('contentStrategy')}</button>
                </div>
            )}
        </div>
    );
};


const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useContext(LanguageContext as React.Context<LanguageContextType>);

    const handleSwitch = () => {
        const newLang = language === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
    };

    return (
        <button
            onClick={handleSwitch}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-colors duration-200"
        >
            <LanguageIcon />
            <span className="mx-3">{t('switchToLang')}</span>
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onQuickAction }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between border-r border-gray-700/50">
      <div>
        <div className="flex items-center mb-8 px-2">
          <img src="https://gemini.google.com/static/images/gemini-sparkle-blue.svg" alt="Logo" className="w-8 h-8 me-2"/>
          <h1 className="text-xl font-bold text-white text-gradient bg-gradient-to-r from-sky-400 to-indigo-400">{t('appName')}</h1>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<DashboardIcon />} label={t('dashboard')} view={View.Dashboard} currentView={currentView} onClick={setCurrentView} />
          <NavItem icon={<LibraryIcon />} label={t('contentLibrary')} view={View.ContentLibrary} currentView={currentView} onClick={setCurrentView} />
          <NavItem icon={<CalendarIcon />} label={t('calendar')} view={View.Calendar} currentView={currentView} onClick={setCurrentView} />
        </nav>
      </div>
      <div className="space-y-2">
         <QuickActionButton onAction={onQuickAction} />
         <NavItem icon={<SettingsIcon />} label={t('settings')} view={View.Settings} currentView={currentView} onClick={setCurrentView} />
         <LanguageSwitcher />
      </div>
    </aside>
  );
};

export default Sidebar;