import React, { useContext } from 'react';
import { View, LanguageContextType } from '../types';
import { AppTitle, DashboardIcon, PlusCircleIcon, LibraryIcon, SettingsIcon, CalendarIcon } from '../constants';
import { LanguageContext } from '../App';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
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
      className={`flex items-center w-full px-4 py-3 text-sm font-medium ${textAlignment} rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="mx-3">{label}</span>
    </button>
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
            className="w-full px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200 text-center"
        >
            {t('switchToLang')}
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center mb-8 px-2">
          <img src="https://gemini.google.com/static/images/gemini-sparkle-blue.svg" alt="Logo" className="w-8 h-8 me-2"/>
          <h1 className="text-xl font-bold text-white">{AppTitle}</h1>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<DashboardIcon />} label={t('dashboard')} view={View.Dashboard} currentView={currentView} onClick={setCurrentView} />
          <NavItem icon={<PlusCircleIcon />} label={t('newContent')} view={View.NewContent} currentView={currentView} onClick={setCurrentView} />
          <NavItem icon={<LibraryIcon />} label={t('contentLibrary')} view={View.ContentLibrary} currentView={currentView} onClick={setCurrentView} />
          <NavItem icon={<CalendarIcon />} label={t('calendar')} view={View.Calendar} currentView={currentView} onClick={setCurrentView} />
        </nav>
      </div>
      <div>
         <NavItem icon={<SettingsIcon />} label={t('settings')} view={View.Settings} currentView={currentView} onClick={setCurrentView} />
         <LanguageSwitcher />
      </div>
    </aside>
  );
};

export default Sidebar;