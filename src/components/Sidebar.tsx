import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { View, LanguageContextType, ContentType } from '../types/types';
import { AppTitle, DashboardIcon, PlusCircleIcon, LibraryIcon, SettingsIcon, CalendarIcon, LanguageIcon, ArticleIcon, CampaignIcon, ProductIcon, UsersIcon, CreditCardIcon, LogoutIcon } from '../lib/constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  user?: any;
  onLogout?: () => void;
  showNotification?: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  requiredPermission?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, requiredPermission }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const textAlignment = language === 'ar' ? 'text-right' : 'text-left';

  // Check if user has permission to view this item
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return (
    <Link
      to={to}
      className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="mx-3">{label}</span>
    </Link>
  );
};

const QuickActionButton = () => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
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
        navigate(`/content/new/${type}`);
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
                    <button onClick={() => handleSelect(ContentType.Campaign)} className="flex items-center w-full p-2 text-sm text-gray-200 hover:bg-gray-600 rounded-md"><CampaignIcon className="me-2"/>{t('campaign')}</button>
                </div>
            )}
        </div>
    );
};


const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useLanguage();

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

const UserInfo = ({ user, onLogout }: { user?: any; onLogout?: () => void }) => {
    const { t } = useLanguage();

    return (
        <div className="border-t border-gray-700 pt-4">
            <div className="px-3 py-2">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-400">{user?.email || ''}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {user?.plan || 'free'}
                        </span>
                    </div>
                </div>
            </div>
            {onLogout && (
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg transition-colors duration-200"
                >
                    <LogoutIcon />
                    <span className="mx-3">{t('logout') || 'Logout'}</span>
                </button>
            )}
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, showNotification }) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between border-r border-gray-700/50">
      <div>
        <div className="flex items-center mb-8 px-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 me-2"/>
          <h1 className="text-xl font-bold text-white text-gradient bg-gradient-to-r from-sky-400 to-indigo-400">{t('appName')}</h1>
        </div>
        <nav className="space-y-2">
          <NavItem icon={<DashboardIcon />} label={t('appboard')} to="/appboard" requiredPermission="view_appboard" />
          <NavItem icon={<LibraryIcon />} label={t('contentLibrary')} to="/content" requiredPermission="view_own_content" />
          <NavItem icon={<CalendarIcon />} label={t('calendar')} to="/calendar" requiredPermission="view_own_content" />
          {hasPermission('manage_users') && (
            <NavItem icon={<UsersIcon />} label="User Management" to="/users" requiredPermission="manage_users" />
          )}
          <NavItem icon={<CreditCardIcon />} label="Subscription Plans" to="/subscription" />
        </nav>
      </div>
      <div className="space-y-2">
         <QuickActionButton />
         <NavItem icon={<SettingsIcon />} label={t('settings')} to="/settings" />
         <LanguageSwitcher />
         <UserInfo user={user} onLogout={onLogout} />
      </div>
    </aside>
  );
};

export default Sidebar;