import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { SafetyService } from "@/services";
import { logger } from "@/utils/logger";

interface PanicScreenProps {
  onExit: () => void;
  sessionId?: string;
}

export function PanicScreen({ onExit, sessionId }: PanicScreenProps) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState("0");
  const activationTimeRef = useRef<number>(Date.now());

  // Guard against double-firing in React Strict Mode (double-invoke) or re-renders
  const panicLoggedRef = useRef(false);

  // Log panic activation exactly once when component mounts
  useEffect(() => {
    if (!sessionId || panicLoggedRef.current) return;
    panicLoggedRef.current = true;

    SafetyService.logPanicEvent({
      session_id: sessionId,
      action: 'initiated',
      time_active_seconds: 0,
    }).catch((error) => {
      logger.error('Failed to log panic activation', error);
      // Don't block the panic screen if logging fails
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: only run once on mount, not on sessionId change

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === "0" ? num : prev + num);
  };

  const handleClear = () => setDisplay("0");
  const handleDelete = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");

  const handleEquals = () => {
    try {
      // Safe math evaluation
      const sanitized = display.replace(/[^-()\d/*+.]/g, '');
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)();
      setDisplay(result.toString());
    } catch {
      setDisplay("Error");
    }
  };

  const handlePanicExit = async () => {
    if (sessionId) {
      try {
        const timeActiveSeconds = Math.floor((Date.now() - activationTimeRef.current) / 1000);
        await SafetyService.logPanicEvent({
          session_id: sessionId,
          action: 'exited',
          time_active_seconds: timeActiveSeconds,
        });
        logger.info(`Panic screen dismissed after ${timeActiveSeconds} seconds`);
      } catch (error) {
        logger.error('Failed to log panic dismissal', error);
        // Don't block exit if logging fails
      }
    }
    onExit();
  };

  const buttons = [
    { label: "C", action: handleClear, color: "bg-slate-700 text-teal-400" },
    { label: "⌫", action: handleDelete, color: "bg-slate-700 text-teal-400" },
    { label: t('common.back', 'Back'), action: handlePanicExit, color: "bg-teal-700 text-white" },
    { label: "÷", action: () => handleNumber("/"), color: "bg-slate-700 text-orange-400" },
    { label: "7", action: () => handleNumber("7"), color: "bg-slate-800 text-white" },
    { label: "8", action: () => handleNumber("8"), color: "bg-slate-800 text-white" },
    { label: "9", action: () => handleNumber("9"), color: "bg-slate-800 text-white" },
    { label: "×", action: () => handleNumber("*"), color: "bg-slate-700 text-orange-400" },
    { label: "4", action: () => handleNumber("4"), color: "bg-slate-800 text-white" },
    { label: "5", action: () => handleNumber("5"), color: "bg-slate-800 text-white" },
    { label: "6", action: () => handleNumber("6"), color: "bg-slate-800 text-white" },
    { label: "-", action: () => handleNumber("-"), color: "bg-slate-700 text-orange-400" },
    { label: "1", action: () => handleNumber("1"), color: "bg-slate-800 text-white" },
    { label: "2", action: () => handleNumber("2"), color: "bg-slate-800 text-white" },
    { label: "3", action: () => handleNumber("3"), color: "bg-slate-800 text-white" },
    { label: "+", action: () => handleNumber("+"), color: "bg-slate-700 text-orange-400" },
    { label: "AC", action: handleClear, color: "bg-slate-800 text-white" },
    { label: "0", action: () => handleNumber("0"), color: "bg-slate-800 text-white" },
    { label: ".", action: () => handleNumber("."), color: "bg-slate-800 text-white" },
    { label: "=", action: handleEquals, color: "bg-orange-500 text-white shadow-lg shadow-orange-900/20" },
  ];

  return (
    <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-end font-sans">
      <div className="w-full max-w-md h-full flex flex-col overflow-hidden">
        {/* Calc Display */}
        <div className="flex-1 flex flex-col justify-end items-end p-8">
          <motion.div 
            key={display}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl font-light text-white tracking-tighter"
          >
            {display}
          </motion.div>
        </div>

        {/* Calc Pad */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-t-[40px] p-6 grid grid-cols-4 gap-4">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className={`h-20 w-full rounded-full text-2xl font-medium transition-transform active:scale-90 ${btn.color} ${btn.label === t('common.back', 'Back') ? 'text-base' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}