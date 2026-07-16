# Lydia Contact Center - Quick Reference Card

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
/
├── App.tsx                      # Main app component
├── components/
│   ├── ChatInterface.tsx        # Main chat UI
│   ├── StoryMode.tsx            # Interactive narratives
│   ├── MythBusters.tsx          # Quiz feature
│   ├── ReferralSection.tsx      # Clinic finder
│   ├── PanicButton.tsx          # Emergency exit button
│   ├── PanicScreen.tsx          # Calculator disguise
│   ├── NicknameModal.tsx        # Nickname setup
│   ├── FollowUpId.tsx           # Session recovery
│   └── ui/                      # Radix UI components
├── styles/
│   └── globals.css              # Global styles + CSS variables
└── public/
    └── manifest.json            # PWA configuration
```

---

## 🎨 Color Palette

```css
/* Copy-paste ready */
--primary-green:   #00C27A;  /* Buttons, active states */
--background:      #F8F9FB;  /* App background */
--text:            #1A1A1A;  /* Primary text */
--teal:            #006d77;  /* Brand, user messages */
--coral:           #ff7b6e;  /* Panic button, alerts */
--accent:          #10B981;  /* Secondary accent */
--secondary-bg:    #e6f4f5;  /* Soft backgrounds */
```

---

## 🔑 LocalStorage Keys

```javascript
// User Preferences
'lydiacontactcenter_nickname'    → string | null
'lydiacontactcenter_language'    → 'en' | 'twi' | 'ewe'
'lydiacontactcenter_duration'    → '24h' | '7d' | '30d' | '90d'
'lydiacontactcenter_analytics'   → 'true' | 'false'

// Session Data
'lydiacontactcenter_chat_[id]'   → Message[]
'lydiacontactcenter_sessions'    → ChatSession[]
'lydiacontactcenter_panic_triggered' → timestamp
```

---

## 💬 Component Props

### ChatInterface
```typescript
interface ChatInterfaceProps {
  selectedLanguage: string;        // 'en' | 'twi' | 'ewe'
  onRequestFollowUpId: () => void; // Open follow-up modal
  isGuest?: boolean;               // Anonymous mode
  username?: string;               // Optional nickname
}
```

### PanicButton
```typescript
interface PanicButtonProps {
  onPanic: () => void;             // Trigger panic mode
  selectedLanguage: string;        // UI language
}
```

### PanicScreen
```typescript
interface PanicScreenProps {
  onExit: () => void;              // Return to chat
}
```

---

## 🌍 Adding New Language

```typescript
// 1. Add to language content object
const content = {
  en: { /* existing */ },
  twi: { /* existing */ },
  ewe: { /* existing */ },
  // Add new language
  ga: {
    title: "Your title",
    message: "Your message",
    // ... all keys
  }
};

// 2. Add to language toggle
const languages = ['en', 'twi', 'ewe', 'ga'];

// 3. Add voice recognition code
const langCodes = {
  'en': 'en-US',
  'twi': 'tw-GH',
  'ewe': 'ee-GH',
  'ga': 'gaa-GH'  // Add ISO code
};
```

---

## 🎭 Animations

### Sidebar Slide
```typescript
<motion.div
  initial={{ x: -320 }}
  animate={{ x: 0 }}
  exit={{ x: -320 }}
  transition={{ type: "spring", damping: 20 }}
>
  {/* Sidebar content */}
</motion.div>
```

### Page Transition
```typescript
<motion.div
  key={currentSection}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.2 }}
>
  {/* Page content */}
</motion.div>
```

### Message Bubble
```typescript
<motion.div
  initial={{ opacity: 0, y: 10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.2 }}
>
  {/* Message */}
</motion.div>
```

---

## 🔒 Privacy Functions

### Auto-Delete Setup
```typescript
// Check every minute for expired sessions
setInterval(() => {
  const sessions = JSON.parse(localStorage.getItem('lydiacontactcenter_sessions') || '{}');
  const now = Date.now();
  const deleteAfter = getDurationInMs(sessionDuration);
  
  Object.keys(sessions).forEach(key => {
    if (now - sessions[key].timestamp > deleteAfter) {
      delete sessions[key];
    }
  });
  
  localStorage.setItem('lydiacontactcenter_sessions', JSON.stringify(sessions));
}, 60000);
```

### Clear Chat
```typescript
const handleClearChat = () => {
  localStorage.removeItem(`lydiacontactcenter_chat_${sessionId}`);
  setSessionId(Date.now().toString());
  toast.success('Chat cleared');
};
```

### Panic Exit
```typescript
const handlePanic = () => {
  setShowPanicScreen(true);
  localStorage.setItem('lydiacontactcenter_panic_triggered', Date.now().toString());
};
```

---

## 🎤 Voice Input Setup

```typescript
// Initialize Speech Recognition
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US'; // or 'tw-GH', 'ee-GH'

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setInputValue(transcript);
};

recognition.onerror = () => {
  console.error('Speech recognition error');
};

// Start listening
recognition.start();
```

---

## 📱 PWA Manifest

```json
{
  "name": "Lydia Contact Center - Smart, Safe & Discreet SRHR Support",
  "short_name": "Lydia Contact Center",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F8F9FB",
  "theme_color": "#00C27A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Test specific component
npm test ChatInterface

# Coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## 🎯 Component Usage Examples

### Using Toast Notifications
```typescript
import { toast } from "sonner@2.0.3";

// Success
toast.success('Message sent!');

// Error
toast.error('Connection failed');

// Info
toast.info('Chat will auto-delete in 24 hours');

// Warning
toast.warning('Low storage space');
```

### Using Alert Dialog
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Using Sheet (Sidebar)
```typescript
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "./components/ui/sheet";

<Sheet>
  <SheetTrigger>Open Menu</SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

## 🔧 Common Customizations

### Change App Name
```typescript
// In App.tsx
<h1>Your App Name</h1>

// In manifest.json
"name": "Your App Name"
```

### Change Primary Color
```css
/* In styles/globals.css */
:root {
  --primary-green: #YOUR_COLOR;
  --accent: #YOUR_COLOR;
}
```

### Add New Section
```typescript
// 1. Add to Section type
type Section = "chat" | "story" | "myths" | "clinics" | "settings" | "new";

// 2. Add to navigation items
const navigationItems = [
  // ... existing
  { 
    id: 'new', 
    label: { en: 'New Section', twi: 'Afã Foforo', ewe: 'Akpa Yeye' },
    icon: YourIcon 
  }
];

// 3. Add route
{currentSection === "new" && (
  <YourNewComponent selectedLanguage={selectedLanguage} />
)}
```

---

## 📊 Analytics Integration (Future)

```typescript
// Track events
const trackEvent = (eventName: string, data?: object) => {
  if (!analyticsOptIn) return;
  
  // Your analytics service
  analytics.track(eventName, {
    ...data,
    timestamp: Date.now(),
    anonymous: true
  });
};

// Example usage
trackEvent('message_sent', { language: selectedLanguage });
trackEvent('section_viewed', { section: currentSection });
```

---

## 🐛 Debugging

### Enable Debug Mode
```typescript
// Add to localStorage
localStorage.setItem('lydiacontactcenter_debug', 'true');

// Check in code
const DEBUG = localStorage.getItem('lydiacontactcenter_debug') === 'true';

if (DEBUG) {
  console.log('State:', { messages, sessionId, language });
}
```

### View LocalStorage
```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('lydiacontactcenter'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key));
  });
```

### Clear All Data
```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('lydiacontactcenter'))
  .forEach(key => localStorage.removeItem(key));
location.reload();
```

---

## 🚀 Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy dist folder
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
# Build with base path
npm run build -- --base=/repo-name/

# Deploy to gh-pages branch
npm run deploy
```

---

## 📝 Environment Variables

```bash
# .env (if needed in future)
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=your-analytics-id
VITE_APP_NAME=Lydia Contact Center
```

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
const analyticsId = import.meta.env.VITE_ANALYTICS_ID;
```

---

## 🔗 Useful Commands

```bash
# Check bundle size
npm run build -- --analyze

# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit

# Update dependencies
npm update

# Check for vulnerabilities
npm audit
```

---

## 💡 Tips & Tricks

### Performance
- Use `React.memo()` for expensive components
- Lazy load routes with `React.lazy()`
- Optimize images (WebP format)
- Enable code splitting

### Accessibility
- Always add `aria-label` to icon buttons
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Test with keyboard navigation
- Test with screen reader

### Security
- Never store sensitive data in localStorage
- Sanitize user input
- Use HTTPS in production
- Implement CSP headers

---

## 🆘 Troubleshooting

### Voice input not working
```typescript
// Check browser support
if (!('webkitSpeechRecognition' in window)) {
  console.error('Speech recognition not supported');
}

// Check permissions
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log(result.state));
```

### LocalStorage quota exceeded
```typescript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Clear old sessions
    clearOldSessions();
  }
}
```

### Animations laggy
```css
/* Enable GPU acceleration */
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}
```

---

## 📚 Further Reading

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com)
- [PWA Guide](https://web.dev/progressive-web-apps/)

---

**Quick Reference Version 1.0.0**  
**Last Updated:** November 2024  
**Lydia Contact Center** 🛡️
