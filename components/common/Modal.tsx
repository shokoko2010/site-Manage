import React, { useContext } from 'react';
import { LanguageContext } from '../../App';
import { LanguageContextType } from '../../types';
import { CloseIcon } from '../../constants';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'lg' }) => {
  const { language } = useContext(LanguageContext as React.Context<LanguageContextType>);
  
  const sizeClasses = {
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity animate-fade-in-fast" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className={`bg-gray-800 rounded-lg shadow-2xl p-6 w-full ${sizeClasses[size]} mx-4 transform transition-all border border-gray-700`}>
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
