# Lydia Contact Center — Smart, Safe, and Discreet SRHR Chatbot

A Progressive Web App (PWA) providing anonymous, youth-friendly Sexual and Reproductive Health Rights (SRHR) support for youth in Ghana.

## 🎯 Mission

Lydia Contact Center is a privacy-first, anonymous chatbot platform designed to provide accurate, judgment-free SRHR information to young people in Ghana. Our goal is to break down barriers to accessing critical health information through:

- **Anonymous Access**: No personal data collection, ever
- **Multi-Language Support**: English, Twi, and Ewe
- **Youth-Friendly Design**: Calm, trustworthy, and engaging interface
- **Privacy-First**: Auto-delete features, panic exit, and local storage only

## 🎨 Features

### Core Chat Functionality
- **Anonymous Chat**: Start chatting instantly without any registration
- **Optional Nickname**: Set a personalized nickname while remaining anonymous
- **Voice Input**: Speech-to-text support in multiple languages
- **Multi-Language**: Full support for English, Twi, and Ewe
- **Auto-Delete**: Configurable chat history retention (24h, 7d, 30d, 90d)
- **Typing Indicators**: Real-time "Lydia Contact Center is thinking..." feedback

### Educational Modules

#### 📖 Story Mode
Interactive narratives where users make choices that teach SRHR lessons through engaging storytelling.

#### 🔍 Myth Busters
Quiz-style feature debunking common myths about sexual and reproductive health with instant feedback.

#### 🏥 Clinic Finder
Displays nearby youth-friendly clinics and pharmacies with location-based suggestions.

### Privacy & Security Features
- **Panic Exit Button**: Instantly hides the app and redirects to a safe page
- **Session Timer**: Visual indicator showing when auto-deletion will occur
- **No Personal Data**: Zero collection of emails, phone numbers, or identifying information
- **Local Storage Only**: All data stays on your device
- **Anonymous Analytics**: Optional, anonymous usage data to improve the service

### Settings & Controls
- **Chat History Settings**: Choose retention period (24h, 7d, 30d, 90d)
- **Language Toggle**: Switch between English, Twi, and Ewe
- **Follow-up ID**: Generate a code to return to your conversation
- **Data Sharing**: Opt-in/out of anonymous usage analytics

## 🎨 Design System

### Color Palette
- **Primary Green**: `#00C27A` - Health, safety, growth
- **Deep Teal**: `#006d77` - Trust, calm, security
- **Coral**: `#ff7b6e` - Alerts, panic exit
- **Light Beige**: `#f8f9fa` - Background, neutrality
- **Secondary**: `#e6f4f5` - Soft accents

### Design Principles
- **Minimal & Clean**: Rounded corners, soft shadows, modern flat UI
- **Gender-Neutral**: Inclusive design for all youth
- **Youth-Friendly**: Approachable without being childish
- **Trustworthy**: Calm colors, consistent spacing, smooth animations
- **Privacy-Focused**: Clear messaging about data protection

## 🏗️ Technical Architecture

### Tech Stack
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Motion (Framer Motion)** for animations
- **Radix UI** for accessible components
- **Lucide React** for icons
- **LocalStorage/IndexedDB** for data persistence

### Component Structure
```
/components
  ├── ChatInterface.tsx       # Main chat UI with voice input
  ├── StoryMode.tsx           # Interactive narratives
  ├── MythBusters.tsx         # Myth-busting quiz
  ├── ReferralSection.tsx     # Clinic finder
  ├── PanicButton.tsx         # Quick exit feature
  ├── PanicScreen.tsx         # Safe redirect screen
  ├── LanguageToggle.tsx      # Language switcher
  ├── SessionSettings.tsx     # Retention settings
  ├── PrivacySettings.tsx     # Privacy controls
  ├── FollowUpId.tsx          # Follow-up code generator
  └── NicknameModal.tsx       # Anonymous nickname setup
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### PWA Features
The app is PWA-ready and can be:
- Added to home screen on mobile devices
- Used offline for basic functionality
- Updated automatically when online

## 📱 User Flow

### First-Time User
1. Welcome modal explains Lydia Contact Center's purpose
2. Option to set anonymous nickname or skip
3. Privacy notice displayed
4. Chat begins with AI greeting
5. Quick reply options for common topics

### Returning User
1. Nickname remembered (if set)
2. Language preference restored
3. Chat history available (if within retention period)
4. Can continue or start new conversation

## 🔒 Privacy & Security

### What We DON'T Collect
- ❌ Personal names or identifiers
- ❌ Email addresses or phone numbers
- ❌ Location data (except when explicitly requested for clinic finder)
- ❌ Conversation content (stored locally only)
- ❌ IP addresses or tracking cookies

### What We DO
- ✅ Store chat history locally on your device
- ✅ Auto-delete conversations after your chosen period
- ✅ Provide panic exit for immediate privacy
- ✅ Allow optional anonymous usage analytics (with consent)
- ✅ Keep all processing on your device

## 🌍 Language Support

### Supported Languages
- **English** - Full support
- **Twi** - Full translation of UI and responses
- **Ewe** - Full translation of UI and responses

### Voice Input Languages
- English (en-US)
- Twi (tw-GH)
- Ewe (ee-GH)

## 🎯 Target Audience

- **Primary**: Youth in Ghana (ages 15-24)
- **Secondary**: Young adults seeking SRHR information
- **Use Cases**:
  - Learning about contraception
  - Understanding STIs and prevention
  - Period health questions
  - Consent and relationships
  - Finding youth-friendly clinics

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Anonymous chat with multi-language support
- ✅ Voice input functionality
- ✅ Story Mode, Myth Busters, Clinic Finder
- ✅ Privacy controls and panic exit
- ✅ PWA functionality

### Phase 2 (Coming Soon)
- 🔄 Live Doctor Chat integration
- 🔄 Secure drug ordering
- 🔄 QR code system for clinic posters
- 🔄 Offline FAQ and infographics
- 🔄 SMS integration for low-data users

### Phase 3 (Future)
- 🔮 AI-powered personalized guidance
- 🔮 Community features (anonymous forums)
- 🔮 Integration with health services
- 🔮 Expansion to more languages
- 🔮 Advanced analytics dashboard

## 🤝 Contributing

This is a health education project. Contributions should prioritize:
- **Accuracy**: All health information must be medically accurate
- **Sensitivity**: Content must be judgment-free and inclusive
- **Privacy**: User anonymity must be preserved at all costs
- **Accessibility**: Features must work on low-end devices

## 📊 Anonymous Analytics

We collect minimal, anonymous data to improve the service:
- Most asked topic categories (no specific questions)
- Language preferences (aggregated)
- Feature usage (which modules are most helpful)
- Session duration (average time spent)

**All analytics are:**
- Completely anonymous
- Opt-in by default
- Cannot be linked to individuals
- Used solely to improve SRHR education

## 🙏 Acknowledgments

Lydia Contact Center is designed to support youth reproductive health in Ghana. We acknowledge:
- Ghana Health Service guidelines
- WHO SRHR frameworks
- Youth advocacy organizations
- Community health workers

## ⚠️ Disclaimer

Lydia Contact Center provides health information, not medical advice. For emergencies or specific medical concerns, please:
- Contact emergency services (193 in Ghana)
- Visit a healthcare facility
- Use the Clinic Finder to locate youth-friendly services

## 📄 License

This project is for educational and health promotion purposes.

---

**Lydia Contact Center**: Smart, Safe, and Discreet SRHR Support for Ghana's Youth 🇬🇭

Built with ❤️ for youth empowerment and health education
