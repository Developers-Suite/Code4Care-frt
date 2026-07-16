import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lock, CheckCircle, Globe, ShieldCheck } from 'lucide-react';

interface DesktopHeroIntroProps {
  onComplete: () => void;
}

const heroImage = '/introscreen/6046367028903349859.jpg';

export function DesktopHeroIntro({ onComplete }: DesktopHeroIntroProps) {
  return (
    // Grid container forces two equal columns on medium screens and up
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full bg-white">
      
      {/* LEFT COLUMN: Image with Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[50vh] md:h-full w-full overflow-hidden"
      >
        <img
          src={heroImage}
          alt="Lydia Contact Center Welcome"
          // object-cover and absolute inset-0 ensure it fills the 50% grid cell
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* THE OVERLAY LAYER */}
        {/* We use a gradient from the brand color (red) that transitions 
            from subtle on the left to slightly darker on the right 
            to help bleed into the content side. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#BE322D]/20 via-[#BE322D]/50 to-[#BE322D]/80 mix-blend-multiply" />
        
        {/* Optional second light gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </motion.div>

      {/* RIGHT COLUMN: Content */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center justify-center p-8 md:p-12 lg:p-20 bg-gradient-to-br from-white to-[#FFF8F8]"
      >
        <div className="max-w-xl w-full space-y-8">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF1F1] text-[#BE322D] font-bold text-xs uppercase tracking-widest border border-[#F4D6D5]">
                <ShieldCheck className="w-4 h-4" />
                Welcome to Lydia Contact Center
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#241515] leading-[1.1]">
              Safe Space for <br />
              <span className="bg-[#BE322D] bg-clip-text text-transparent">
                Confidential Support
              </span>
            </h1>

            <p className="text-lg text-[#6D4A49] leading-relaxed">
              Experience 100% anonymity with no personal data collected. 
              Get reliable SRHR guidance designed for the youth of Ghana.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {[
              { icon: Lock, text: 'Fully anonymous' },
              { icon: CheckCircle, text: 'Expert guidance' },
              { icon: Globe, text: 'Designed for Ghana' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-[#FFF1F1] p-1.5 rounded-full">
                  <item.icon className="w-4 h-4 text-[#BE322D]" />
                </div>
                <span className="text-[#241515] font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={onComplete}
              size="lg"
              className="w-full md:w-auto px-10 h-14 text-lg rounded-xl bg-[#BE322D] hover:bg-[#A32925] text-white font-bold shadow-xl transition-transform active:scale-95"
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <p className="text-sm text-[#8A6B6B] animate-pulse">
            ↓ Join thousands of youth accessing safe health information
          </p>
        </div>
      </motion.div>
    </div>
  );
}