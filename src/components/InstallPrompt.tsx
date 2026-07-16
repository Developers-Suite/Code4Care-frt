import React from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface InstallPromptProps {
  isVisible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  isVisible,
  onInstall,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-40 sm:bottom-6 sm:left-6 sm:right-6 sm:max-w-md sm:mx-auto"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#F4D6D5] overflow-hidden">
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#BE322D] to-[#F16365]" />

            {/* Content */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                    Install Lydia Contact Center
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Add to your home screen for quick access
                  </p>
                </div>
                <button
                  onClick={onDismiss}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Dismiss install prompt"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={onInstall}
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-white font-semibold text-sm"
                >
                  Install
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  className="flex-1 h-10 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
