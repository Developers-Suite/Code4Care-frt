import React, { useEffect, useState } from 'react';
import { Download, X, Zap, Lock, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface PWAInstallModalProps {
  isVisible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isVisible,
  onInstall,
  onDismiss,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header with gradient background */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#BE322D] to-[#F16365] px-6 py-8 text-white">
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Download className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold leading-tight">
                      Install Lydia Contact Center
                    </h2>
                    <p className="text-sm text-white/85 mt-1">
                      Add to your device for faster access
                    </p>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="space-y-4 mb-6">
                  {[
                    { Icon: Zap, text: 'Fast access - no app store needed' },
                    { Icon: Lock, text: 'Works offline with full functionality' },
                    { Icon: HardDrive, text: 'Minimal storage on your device' },
                  ].map((feature, idx) => {
                    const { Icon, text } = feature;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <Icon className="w-5 h-5 text-[#BE322D] flex-shrink-0" />
                        <span className="text-sm text-[#5B77B8]">{text}</span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={onInstall}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-white font-semibold shadow-lg shadow-[#F5D5D5] hover:shadow-xl transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-2 border-[#F4D6D5] text-[#BE322D] font-semibold hover:bg-[#FFF1F1]"
                  >
                    Later
                  </Button>
                </div>

                {/* Footer text */}
                <p className="text-xs text-center text-[#8E8E93] mt-4">
                  You can install anytime from Settings
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
