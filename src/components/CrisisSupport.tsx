import { Phone, AlertCircle, Heart, Info } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface CrisisSupportProps {
  selectedLanguage: string;
}

interface Hotline {
  id: number;
  type: string;
  contact: string;
  phone: string;
  icon: "alert" | "heart" | "info";
  description: string;
}

export function CrisisSupport({ selectedLanguage }: CrisisSupportProps) {
  const content = {
    en: {
      title: "Crisis & Support",
      subtitle: "Immediate help when you need it most",
      callNow: "Call Now",
      available247: "Available 24/7",
      legalNotice: "Important Legal Information",
      ageOfConsent: "Age of consent in Ghana: 16 years",
      consentDescription: "Any sexual activity with someone under 16 is illegal in Ghana. If you or someone you know is in this situation, please contact the authorities immediately.",
      hotlines: [
        {
          id: 1,
          type: "Abuse / Violence",
          contact: "DOVVSU Helpline",
          phone: "055-1000-900",
          icon: "alert",
          description: "For domestic violence, sexual assault, and abuse cases"
        },
        {
          id: 2,
          type: "Mental Health Support",
          contact: "Mental Health Authority Ghana",
          phone: "050-911-4396",
          icon: "heart",
          description: "Counseling and mental health crisis support"
        },
        {
          id: 3,
          type: "SRH Information",
          contact: "PPAG Ghana",
          phone: "0302-219-038",
          icon: "info",
          description: "Sexual and reproductive health information and services"
        },
        {
          id: 4,
          type: "SRH Information",
          contact: "Room 1221 (Lydia Contact Center)",
          phone: "1221",
          icon: "info",
          description: "Free & confidential helpline and SRH counseling (Mon-Fri 8am-5pm)"
        }
      ]
    },
    twi: {
      title: "Adesua ne Mmoa",
      subtitle: "Mmoa ntɛm bere a wohia no",
      callNow: "Frɛ Seesei",
      available247: "Ɛwɔ hɔ dapem",
      legalNotice: "Mmara Ho Nsɛm a Ɛho Hia",
      ageOfConsent: "Mfe a wubetumi apene so wɔ Ghana: Mfe 16",
      consentDescription: "Nna biara a wode to obi a wadi mfe 16 no yɛ bɔne wɔ Ghana. Sɛ wo anaa obi a wonim wɔ saa tebea mu a, frɛ tumi no ntɛm ara.",
      hotlines: [
        {
          id: 1,
          type: "Basabasayɛ / Akakabensɛm",
          contact: "DOVVSU Nkɔmmɔbea",
          phone: "055-1000-900",
          icon: "alert",
          description: "Ma efie basabasayɛ, nna basabasayɛ, ne akakabensɛm"
        },
        {
          id: 2,
          type: "Adwene Akwahosan Mmoa",
          contact: "Mental Health Authority Ghana",
          phone: "050-911-4396",
          icon: "heart",
          description: "Afotusoɔ ne adwene akwahosan adesua mmoa"
        },
        {
          id: 3,
          type: "Nwokoɔ Akwahosan Nsɛm",
          contact: "PPAG Ghana",
          phone: "0302-219-038",
          icon: "info",
          description: "Nwokoɔ ne awo akwahosan nsɛm ne dwumadie"
        },
        {
          id: 4,
          type: "Nwokoɔ Akwahosan Nsɛm",
          contact: "Room 1221 (Lydia Contact Center)",
          phone: "1221",
          icon: "info",
          description: "Awo si ano, abusua nhyehyɛe, afotusoɔ a wontua hwee (Mon-Fri 8am-5pm)"
        }
      ]
    },
    ewe: {
      title: "Xaxa kple Kpekpeɖeŋu",
      subtitle: "Kpekpeɖeŋu enumake ne èhiãe wu",
      callNow: "Yɔ Fifia",
      available247: "Ele anyi ŋkeke blibo",
      legalNotice: "Se Nyatakaka Vevitɔ",
      ageOfConsent: "Lɔlɔ̃nu gbɔ ƒe ƒe le Ghana: Ƒe 16",
      consentDescription: "Nuwɔwɔ ɖesiaɖe kple ame si mexɔ ƒe 16 o la nye nu si se xɔ le Ghana. Ne wò alo ame aɖe si nènya le nɔnɔme sia me la, tia dziɖuɖu enumake.",
      hotlines: [
        {
          id: 1,
          type: "Nuvɔ̃wɔwɔ / Ŋutasesẽ",
          contact: "DOVVSU Kaɖiɖimɔ",
          phone: "055-1000-900",
          icon: "alert",
          description: "Aƒemenu ŋutasesẽ, ahasi ŋutasesẽ, kple nuvɔ̃wɔwɔ"
        },
        {
          id: 2,
          type: "Susu Lãmesɛ Kpekpeɖeŋu",
          contact: "Mental Health Authority Ghana",
          phone: "050-911-4396",
          icon: "heart",
          description: "Aɖaŋuɖoɖo kple susu lãmesɛ xaxa kpekpeɖeŋu"
        },
        {
          id: 3,
          type: "Ahasi kple Vidzidzi Lãmesɛ",
          contact: "PPAG Ghana",
          phone: "0302-219-038",
          icon: "info",
          description: "Ahasi kple vidzidzi lãmesɛ nyatakaka kple dɔwɔnawo"
        },
        {
          id: 4,
          type: "Ahasi kple Vidzidzi Lãmesɛ",
          contact: "Room 1221 (Lydia Contact Center)",
          phone: "1221",
          icon: "info",
          description: "Fuvɔvɔ, ƒome ɖoɖo, kple kpekpeɖeŋu si womexea fe ɖe eŋu o (Mon-Fri 8am-5pm)"
        }
      ]
    }
  };

  const lang = content[selectedLanguage as keyof typeof content] || content.en;

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "alert":
        return <AlertCircle className="w-6 h-6" style={{ color: '#FF4444' }} />;
      case "heart":
        return <Heart className="w-6 h-6" style={{ color: '#BE322D' }} />;
      case "info":
        return <Info className="w-6 h-6" style={{ color: '#BE322D' }} />;
      default:
        return <Phone className="w-6 h-6" style={{ color: '#BE322D' }} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'linear-gradient(to bottom, #FFFFFF 0%, #F8FAFE 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="mb-2" style={{ color: '#BE322D' }}>{lang.title}</h1>
          <p className="text-gray-600">{lang.subtitle}</p>
        </div>

        {/* Legal Notice - Age of Consent */}
        <Card className="p-6 mb-6" style={{ borderColor: '#F4D6D5', borderWidth: '2px' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#BE322D' }} />
            <div>
              <h3 className="mb-2" style={{ color: '#BE322D' }}>{lang.legalNotice}</h3>
              <p className="mb-2" style={{ color: '#1A1A1A' }}>
                <strong>{lang.ageOfConsent}</strong>
              </p>
              <p className="text-gray-700">{lang.consentDescription}</p>
            </div>
          </div>
        </Card>

        {/* Hotlines */}
        <div className="space-y-4">
          {lang.hotlines.map((hotline) => (
            <Card key={hotline.id} className="p-5 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getIcon(hotline.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge 
                        variant="outline" 
                        className="rounded-full mb-2"
                        style={{ borderColor: '#BE322D', color: '#BE322D' }}
                      >
                        {hotline.type}
                      </Badge>
                      <h3 className="mb-1" style={{ color: '#1A1A1A' }}>{hotline.contact}</h3>
                      <p className="text-sm text-gray-600">{hotline.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <a href={`tel:${hotline.phone.replace(/\s/g, '')}`} className="flex-1">
                      <Button 
                        className="w-full rounded-full"
                        style={{ 
                          background: 'linear-gradient(135deg, #BE322D 0%, #F16365 100%)',
                          boxShadow: '0 2px 8px rgba(0, 72, 255, 0.2)'
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {lang.callNow}: {hotline.phone}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Emergency Note */}
        <Card className="p-4 mt-6" style={{ backgroundColor: '#FFF4E5', borderColor: '#FFB020' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FFB020' }} />
            <p className="text-sm" style={{ color: '#1A1A1A' }}>
              <strong>{selectedLanguage === 'en' ? 'In case of emergency' : selectedLanguage === 'twi' ? 'Adesua tebea mu' : 'Le xaxa nɔnɔme me'}:</strong>{' '}
              {selectedLanguage === 'en' 
                ? 'Always call emergency services (191 for Police, 193 for Ambulance) if you are in immediate danger.'
                : selectedLanguage === 'twi'
                ? 'Frɛ adesua dwumadie (191 ma Polisifo, 193 ma Ayaresabea kar) bere nyinaa sɛ wowɔ asiane mu seesei ara.'
                : 'Yɔ xaxa dɔwɔnawo (191 na Kpovitɔwo, 193 na Lãmesɛkara) ɣesiaɣi ne èle asitsoƒe enumake.'
              }
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
