import { safeStorage } from '@/utils/safeStorage';
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface PanicButtonProps {
  onPanic: () => void;
  selectedLanguage: string;
}

export function PanicButton({ onPanic, selectedLanguage }: PanicButtonProps) {
  const labels = {
    en: "Quick Exit",
    twi: "Fi hɔ ntɛm",
    ewe: "Do go kaba"
  };

  const handlePanic = () => {
    safeStorage.setItem('lydiacontactcenter_panic_triggered', 'true');
    onPanic();
  };

  return (
    <Button
      onClick={handlePanic}
      className="rounded-full px-4 py-2 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
      style={{ 
        backgroundColor: '#ff4444', 
        color: 'white',
        boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)'
      }}
    >
      <AlertTriangle className="w-4 h-4" />
      {labels[selectedLanguage as keyof typeof labels] || labels.en}
    </Button>
  );
}
