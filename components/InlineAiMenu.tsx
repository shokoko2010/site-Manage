
import React, { useContext, useState } from 'react';
import { ExpandIcon, FaceSmileIcon, ScissorsIcon, WandIcon } from '../constants';
import { LanguageContext } from '../App';
import { LanguageContextType, WritingTone } from '../types';
import Spinner from './common/Spinner';

interface InlineAiMenuProps {
    position: { top: number; left: number };
    onAction: (instruction: string) => void;
    isLoading: boolean;
}

const InlineAiMenu: React.FC<InlineAiMenuProps> = ({ position, onAction, isLoading }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);

    const handleAction = (instruction: string) => {
        setIsToneMenuOpen(false);
        onAction(instruction);
    };

    const menuStyle: React.CSSProperties = {
        top: `${position.top - 50}px`,
        left: `${position.left}px`,
        position: 'absolute',
        zIndex: 50,
    };

    const ActionButton = ({ instruction, children }: { instruction: string; children: React.ReactNode }) => (
        <button
            onClick={() => handleAction(instruction)}
            className="flex items-center space-x-2 rtl:space-x-reverse text-sm px-3 py-1.5 hover:bg-gray-600 w-full text-left"
            disabled={isLoading}
            aria-label={instruction}
        >
            {children}
        </button>
    );
    
    const ToneButton = ({ tone }: { tone: WritingTone }) => (
         <button
            onClick={() => handleAction(`Change the tone to ${tone}`)}
            className="flex items-center space-x-2 rtl:space-x-reverse text-sm px-3 py-1.5 hover:bg-gray-500 w-full text-left"
            disabled={isLoading}
        >
            <span>{t(`aiMagicMenu.${tone.toLowerCase()}` as any)}</span>
        </button>
    );

    return (
        <div style={menuStyle} className="bg-gray-700 rounded-md shadow-2xl animate-fade-in-fast flex text-white overflow-hidden border border-gray-600">
            {isLoading ? (
                <div className="p-2 flex items-center justify-center w-full h-full">
                    <Spinner size="sm" />
                </div>
            ) : (
                <>
                    <button onClick={() => onAction('Improve the writing')} className="p-2 hover:bg-gray-600" title={t('aiMagicMenu.improve')}><WandIcon /></button>
                    <button onClick={() => onAction('Make this shorter')} className="p-2 hover:bg-gray-600" title={t('aiMagicMenu.shorter')}><ScissorsIcon /></button>
                    <button onClick={() => onAction('Make this longer')} className="p-2 hover:bg-gray-600" title={t('aiMagicMenu.longer')}><ExpandIcon /></button>
                    <div className="relative">
                        <button onClick={() => setIsToneMenuOpen(prev => !prev)} className="p-2 hover:bg-gray-600 h-full" title={t('aiMagicMenu.tone')}><FaceSmileIcon /></button>
                        {isToneMenuOpen && (
                            <div className="absolute bottom-full mb-1 left-0 bg-gray-600 rounded-md shadow-lg border border-gray-500 w-32">
                                <ToneButton tone={WritingTone.Professional} />
                                <ToneButton tone={WritingTone.Friendly} />
                                <ToneButton tone={WritingTone.Casual} />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default InlineAiMenu;
