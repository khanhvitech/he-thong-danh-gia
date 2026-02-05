import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from './Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  subMessage?: string;
  hideButton?: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Thành công!',
  message = 'Đánh giá của bạn đã được gửi thành công!',
  subMessage = 'Cảm ơn bạn đã dành thời gian tham gia khảo sát.',
  hideButton = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 px-8 pt-10 pb-16 text-center">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {title}
          </h2>
        </div>
        
        {/* Content */}
        <div className="px-8 pb-8 -mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            {/* Success animation */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-25" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Message */}
            <p className="text-lg font-medium text-gray-800 mb-2">
              {message}
            </p>
            <p className="text-gray-500 mb-6">
              {subMessage}
            </p>
            
            {/* Decorative elements */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  🎉
                </span>
              ))}
            </div>
            
            {/* Button */}
            {!hideButton && (
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 rounded-xl transition-all transform hover:scale-[1.02]"
              >
                Hoàn tất
              </Button>
            )}
          </div>
        </div>
        
        {/* Confetti decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDuration: '2s' }} />
          <div className="absolute top-20 right-16 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
          <div className="absolute top-14 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
          <div className="absolute top-24 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.1s' }} />
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
