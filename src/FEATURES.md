# Lydia Contact Center - Master Feature Specification

This document serves as the single source of truth for the Lydia Contact Center PWA, consolidating all feature specifications, implementation details, and system architecture.

---

## 1. System Overview & Core Identity
**Lydia Contact Center** is a specialized, privacy-first Progressive Web App (PWA) designed to provide Sexual and Reproductive Health and Rights (SRHR) information to Ghanaian youth. It operates entirely on the client-side to ensure maximum privacy and anonymity.

- **Target Audience:** Youth in Ghana.
- **Platform:** Mobile-first PWA (iOS/Android/Desktop).
- **Privacy Model:** Completely anonymous; no login, registration, or PII collection.
- **Data Persistence:** Client-side only using `localStorage`.

---

## 2. Core Architecture
- **Frontend-Only**: No backend database. All data resides on the user's device.
- **Offline Capable**: Fully functional offline (viewing history, educational content) after installation.
- **Local Persistence**: Encrypted-like storage for chat history and settings.
- **Responsive Design**: Mobile-first approach with enhanced desktop layout (responsive sidebar).

---

## 3. Feature Breakdown

### 3.1. Intelligent Chat Interface
The central hub of the application.

- **Unified Message Thread**: 
  - AI automated responses and Human Consultant messages coexist in a single scrollable view.
  - **Visual Distinction**: 
    - **AI/Bot**: Royal Blue (`#0048ff`) branding.
    - **Consultant**: Emerald Green (`#10B981`) branding with "Consultant" badge.
    - **User**: Blue (`#0048ff`) styled bubbles.
- **Sticky Input Bar**: Fixed to viewport bottom for consistent access.
- **Input Methods**:
  - **Text**: Auto-expanding input field.
  - **Voice Input 🎤**: Web Speech API integration supporting English and localized accents (Ghanaian English).
  - **Quick Replies**: Contextual suggestion chips for rapid interaction.
- **Bot Persona**:
  - **Customizable Name**: Users can rename "Lydia Contact Center" to "Kofi", "Ama", etc.
  - **Typing Indicators**: Animated dots for realistic latency.

### 3.2. Consultant Mode
A dedicated mode for human intervention.

- **Floating Trigger**: FAB with "User Check" icon to request a consultant.
- **Consultant Banner**: Distinct green banner ("Consultant Mode Active").
- **Seamless Handoff**: Consultant joins the existing context without clearing history.

### 3.3. Safety & Security Suite
Robust features to protect user identity.

- **Panic Button 🚨**: 
  - **Trigger**: "Quick Exit" / Panic icon in header.
  - **Action**: Instantly swaps interface to a functional **Calculator App**.
  - **Restoration**: Triple-tap calculator display or hold for 2s to return.
- **Auto-Delete System**:
  - **Retention Policies**: 24 hours (default), 7 days, 30 days, 90 days.
  - **Visual Timer**: Countdown progress bar in sidebar.
  - **Background Cleanup**: Checks every minute to expire old sessions.
- **Privacy Settings**:
  - **Clear Chat**: One-tap wipe of current session.
  - **Nickname**: Optional local-only display name.
  - **Analytics Opt-In**: User must explicitly agree to share anonymous data.

### 3.4. Navigation & Layout
- **Mobile**: 
  - **Burger Menu (☰)**: Opens sliding sidebar.
  - **Full-screen Sidebar**: Easy touch targets (>44px).
- **Desktop**: 
  - **Persistent Sidebar**: ChatGPT-style left panel that stays open.
  - **Optimized Layout**: Uses screen real estate effectively.
- **Header**: Minimalist design (`[Menu] [Logo] [Status] [Panic]`).

### 3.5. Educational Modules
Structured content beyond the chatbot.

- **Story Mode 📖**: Interactive branching narratives helping users make SRHR decisions.
- **Myth Busters 🧠**: True/False quizzes to clarify misconceptions.
- **Support & Clinics 🏥**: Directory of youth-friendly health centers.
- **Pharmacy 💊**: Information on medication access.

### 3.6. Localization 🌍
Deep localization for the Ghanaian context.

- **Languages**: English, Twi, Ewe, Ga.
- **Global Translation**: UI elements, menus, prompts, and static content switch instantly.
- **Voice Support**: Speech recognition adapts to region-specific locale codes (e.g., `en-GH`).

---

## 4. UI/UX & Technical Implementation

### 4.1. Visual Identity
- **Primary**: Royal Blue (`#0048ff`) - Trust, professional.
- **Secondary**: White (`#FFFFFF`) / Light Gray (`#F8FAFE`).
- **Accent**: Emerald Green (`#10B981`) - Consultant interactions.
- **Panic**: Coral Red (`#ff7b6e`) - Emergency actions.
- **Typography**: Clean sans-serif (Inter/System fonts).

### 4.2. Technical Stack
- **Framework**: React 18 + TypeScript.
- **Styling**: Tailwind CSS v4.
- **Animations**: Framer Motion (`motion/react`) for smooth transitions.
- **Icons**: Lucide React.
- **Routing**: React Router (Single Page Application).
- **State**: React Context + LocalStorage.

### 4.3. Performance
- **Load Time**: < 2s initial load.
- **Animation**: 60fps target.
- **Storage**: < 5MB local storage usage.

---

## 5. Implementation Status Checklist

### ✅ Completed
- [x] **Navigation**: Sidebar with smooth animations.
- [x] **Chat Interface**: Text, Voice, Quick Replies, Typing Indicators.
- [x] **Consultant Mode**: Visual distinction, floating trigger.
- [x] **Privacy**: Panic Button (Calculator), Auto-delete, Clear Chat.
- [x] **Localization**: 4 languages fully implemented.
- [x] **Education**: Story Mode, Myth Busters, Clinics.
- [x] **PWA**: Manifest, offline capability.

### 🚀 Ready for Deployment
- Zero critical errors.
- Fully responsive on Mobile, Tablet, and Desktop.
- Accessibility compliance (WCAG AA).

---

## 6. Directory Structure Summary
- `/components`: All React UI components (Chat, Sidebar, Panic, etc.).
- `/services`: Logic for chatbot responses and data handling.
- `/styles`: Global CSS and Tailwind directives.
- `/utils`: Helper functions for storage and safety.
