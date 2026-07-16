import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface IntroScreenProps {
  onStart: () => void;
  selectedLanguage: string;
  onSkip?: () => void;
}

export function IntroScreen({ onStart, selectedLanguage, onSkip }: IntroScreenProps) {
  const content = {
    en: {
      title: "Welcome to Lydia Contact Center",
      subtitle: "A safe space for your health questions",
      description: "Get confidential, judgment-free information about sexual and reproductive health. Your privacy is our priority.",
      features: [
        "Anonymous conversations",
        "No registration required",
        "Auto-delete options",
        "Instant panic exit"
      ],
      button: "Start Anonymous Chat",
      footer: "This service is free and confidential"
    },
    twi: {
      title: "Akwaaba wɔ Lydia Contact Center",
      subtitle: "Baabi a w'ahobammɔ wɔ hɔ ma wo akwahosan nsɛm",
      description: "Nya nsɛm a wɔmmu w'ani wɔ akwahosan ne awoɔ ho. Yɛhwɛ wo kokoamsɛm yie.",
      features: [
        "Nkɔmmɔbɔ a wonnim wo",
        "Enhia sɛ wokyerɛw wo din",
        "Wutumi yi nneɛma fi hɔ",
        "Wutumi fi hɔ ntɛm"
      ],
      button: "Fi ase nkɔmmɔ",
      footer: "Saa dwumadie yi yɛ kwa na ɛyɛ kokoam"
    },
    ewe: {
      title: "Woezɔ ɖe Lydia Contact Center",
      subtitle: "Teƒe si ŋutifafa le hena wò lãmesɛ biabia",
      description: "Xɔ nyatakakawo ɖe atsu kple agbenɔnɔ lãmesɛ ŋuti. Míekpɔa wò ɣaɣlawo dzi.",
      features: [
        "Nuƒoƒo si me womenya wo le o",
        "Ŋɔŋlɔ dzesi mehiã o",
        "Tutu ɖa le eɖokui si tɔtrɔwo",
        "Do go kaba kaba"
      ],
      button: "Dze nuƒoƒo gɔme",
      footer: "Dɔwɔna sia nye femaxexe eye wòganye ɣaɣla"
    }
  };

  const lang = content[selectedLanguage as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFF8F8 50%, #FFF1F1 100%)' }}>
      <Card className="max-w-md w-full p-8" style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(190, 50, 45, 0.15)', borderRadius: '1.5rem' }}>
        <div className="text-center mb-6">
          <div 
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" 
            style={{ 
              background: 'linear-gradient(135deg, #BE322D 0%, #F16365 100%)',
              boxShadow: '0 4px 16px rgba(190, 50, 45, 0.25)'
            }}
          >
            <svg className="w-10 h-10" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="mb-2" style={{ color: '#BE322D' }}>{lang.title}</h1>
          <p className="text-gray-600">{lang.subtitle}</p>
        </div>

        <p className="text-gray-700 mb-6 text-center">
          {lang.description}
        </p>

        <div className="space-y-3 mb-8">
          {lang.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#BE322D' }}>
                <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={onStart}
          className="w-full rounded-2xl hover:scale-105 active:scale-95 transition-all"
          style={{ 
            background: '#BE322D 0%',
            color: 'white',
            boxShadow: '0 4px 16px rgba(190, 50, 45, 0.25)'
          }}
        >
          {lang.button}
        </Button>

        {onSkip && (
          <div className="text-center mt-3">
            <button onClick={onSkip} className="text-sm text-gray-500 underline">Skip to onboarding</button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          {lang.footer}
        </p>
      </Card>
    </div>
  );
}
