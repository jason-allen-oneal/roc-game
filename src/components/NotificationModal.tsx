'use client';

import { useEffect } from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  isOpen,
  message,
  type = 'info',
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-green-500',
          icon: '✅'
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-red-500',
          icon: '❌'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-600',
          border: 'border-yellow-500',
          icon: '⚠️'
        };
      default:
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-500',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-earth-gradient border-2 ${styles.border} rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all duration-300 scale-100`}>
        <div className="flex items-start space-x-3">
          <div className="text-2xl flex-shrink-0">
            {styles.icon}
          </div>
          <div className="flex-1">
            <p className="text-gold-light text-sm leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gold-light hover:text-gold transition-colors duration-200 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="mt-4 w-full bg-forest-dark rounded-full h-1">
            <div 
              className={`${styles.bg} h-1 rounded-full transition-all duration-300 ease-linear`}
              style={{ 
                width: '100%',
                animation: `shrink ${autoCloseDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 