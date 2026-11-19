import React from "react";

// Same photo as the desktop landing hero, resized for the mobile PWA
const heroImg = "/introscreen/medium-shot-woman-holding-phone-mobile.jpg";
const screen1Img = heroImg;
const screen2Img = heroImg;
const screen3Img = heroImg;

type LayoutProps = {
  image: string;
  title: React.ReactNode;
  description: string;
  activeIndex: number;
  buttonText: string;
  onNext: () => void;
  onSkip: () => void;
};

function MobileIntroLayout({
  image,
  title,
  description,
  activeIndex,
  buttonText,
  onNext,
  onSkip,
}: LayoutProps) {
  return (
    <>
      {/* MOBILE - unchanged vertical layout */}
      <div className="md:hidden relative h-dvh w-full bg-white flex flex-col overflow-hidden">
        <button
          onClick={onSkip}
          className="absolute right-5 top-[calc(env(safe-area-inset-top)+1rem)] z-20 bg-[#BE322D] text-white px-5 py-3 rounded-2xl font-semibold shadow-md"
        >
          Skip
        </button>
        <div className="relative h-[48%] w-full shrink-0 overflow-hidden">
          <img src={image} alt="intro" className="w-full h-full object-cover" />
          <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-none">
            <svg viewBox="0 0 1440 120" className="w-full h-[90px]" preserveAspectRatio="none">
              <path d="M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z" fill="white" />
            </svg>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-between px-8 pt-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] overflow-hidden">
          <div className="flex w-full flex-1 flex-col items-center justify-start">
            <h2 className="text-[1.7rem] leading-tight font-bold text-center text-[#101828] mb-3">
              {title}
            </h2>
            <p className="text-center text-[#8E8E93] text-[0.95rem] leading-relaxed max-w-sm mb-6">
              {description}
            </p>
            <div className="flex gap-2 mb-6">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all ${
                    activeIndex === index ? "w-10 h-2 bg-[#BE322D]" : "w-2 h-2 bg-[#D9D9D9]"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onNext}
            className="w-full max-w-sm bg-[#BE322D] text-white font-semibold py-3 rounded-full text-base active:scale-[0.98]"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </>
  );
}

// Screens and Carousel (unchanged)
type ScreenProps = { onNext: () => void; onSkip: () => void };

function Screen1({ onNext, onSkip }: ScreenProps) {
  return (
    <MobileIntroLayout
      image={screen1Img}
      title={
        <>
          Your safe space for <br />
          confidential support
        </>
      }
      description="Experience 100% anonymity with no personal data collected. Your privacy is always our priority."
      activeIndex={0}
      buttonText="Next"
      onNext={onNext}
      onSkip={onSkip}
    />
  );
}

function Screen2({ onNext, onSkip }: ScreenProps) {
  return (
    <MobileIntroLayout
      image={screen2Img}
      title={
        <>
          Access accurate and <br />
          expert guidance
        </>
      }
      description="Skip the rumors and get reliable SRHR information curated from trusted sources."
      activeIndex={1}
      buttonText="Next"
      onNext={onNext}
      onSkip={onSkip}
    />
  );
}

function Screen3({ onNext, onSkip }: ScreenProps) {
  return (
    <MobileIntroLayout
      image={screen3Img}
      title={
        <>
          Designed for the youth <br />
          of Ghana
        </>
      }
      description="Join a community empowering young people with the right health information."
      activeIndex={2}
      buttonText="Get Started"
      onNext={onNext}
      onSkip={onSkip}
    />
  );
}

type Props = { onComplete?: () => void; onSkip?: () => void };

export default function OnboardingCarousel({ onComplete, onSkip }: Props) {
  const [current, setCurrent] = React.useState<number>(0);
  const screens = [Screen1, Screen2, Screen3];
  const CurrentScreen = screens[current];

  const handleNext = () => {
    if (current >= screens.length - 1) {
      onComplete?.();
      return;
    }
    setCurrent((p) => p + 1);
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <CurrentScreen
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
}
