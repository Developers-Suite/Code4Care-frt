# Lydia Contact Center - Testing Guide for Recent Updates

## Quick Testing Checklist

### 1. Desktop Sidebar (ChatGPT-style) - Screen Width ≥1024px

**Test Steps**:
1. Open the app on a desktop browser (or resize browser to >1024px width)
2. **Expected**: Sidebar should be OPEN by default, showing full menu with icons and labels
3. Click the close button (X) in the sidebar header
4. **Expected**: Sidebar collapses smoothly
5. Click the hamburger menu (☰) button
6. **Expected**: Sidebar expands again
7. Navigate between sections (Chat, Story Mode, Myths, Clinics, Settings)
8. **Expected**: Sidebar stays open, active section highlighted in blue

**Visual Checks**:
- ✅ Sidebar width: 280px
- ✅ Blue gradient header with Lydia Contact Center logo
- ✅ All menu items visible with icons
- ✅ Active item has blue gradient background
- ✅ Close button (X) visible in top-right of sidebar

---

### 2. Mobile Sidebar - Screen Width <1024px

**Test Steps**:
1. Open the app on mobile device or resize browser to <1024px
2. **Expected**: Sidebar is HIDDEN by default
3. Click the hamburger menu (☰) button in top-left
4. **Expected**: Sidebar slides in from left as overlay
5. Navigate to any section
6. **Expected**: Sidebar automatically closes after selection
7. Open sidebar again and click outside of it
8. **Expected**: Sidebar closes

**Visual Checks**:
- ✅ Sidebar opens as full-screen overlay
- ✅ Backdrop dims the main content
- ✅ All navigation options accessible
- ✅ Settings and actions visible
- ✅ Auto-closes on navigation

---

### 3. Chat Interface - Placeholder Responses

**Test Steps**:
1. Navigate to Chat section
2. Click on quick reply button: **"Tell me about contraception"**
3. **Expected Response**: 
   > "Contraception refers to methods used to prevent pregnancy. These include options like condoms, birth control pills, injections, implants, intrauterine devices (IUDs), and natural methods. The right choice depends on your health, lifestyle, and whether you want short-term or long-term protection. It's best to consult a healthcare provider to find what works best for you."

4. Type or click: **"What are STIs?"**
5. **Expected Response**: 
   > "STIs, or sexually transmitted infections, are infections passed from one person to another through sexual contact. Examples include HIV, gonorrhea, chlamydia, and syphilis. Some STIs can also spread through blood or from mother to baby during birth. Using condoms, getting tested regularly, and maintaining safe sexual practices help prevent them."

6. Type or click: **"Period questions"**
7. **Expected Response**: 
   > "Your period, or menstruation, is the monthly shedding of the uterine lining when pregnancy doesn't occur. It usually lasts 3–7 days and happens every 21–35 days. It's normal for flow, color, or cramps to vary from person to person. If your period is irregular or very painful, it's a good idea to talk to a healthcare professional."

**Visual Checks**:
- ✅ Responses appear in white bubbles with blue bot avatar
- ✅ Text is clear and readable
- ✅ Timestamp displayed
- ✅ Quick reply buttons work correctly

---

### 4. Color Scheme Consistency - MythBusters

**Test Steps**:
1. Navigate to "Myth Busters" section
2. **Expected Colors**:
   - Background: White to light blue gradient (#FFFFFF to #F8FAFE)
   - Title: Royal blue (#0048ff)
   - Category badges: Blue border (#0048ff)
   - Checkmark icons: Blue (#0048ff)
   - Myth X icons: Red (#FF4444)
   - Fact background: Light blue (#E8ECFF)
   - Button borders: Blue (#0048ff)

3. Click on any myth card to expand
4. **Expected**: Blue checkmark appears, fact section shows with light blue background
5. Click "Copy" button
6. **Expected**: Toast notification appears, content copied to clipboard

**Visual Checks**:
- ✅ NO green colors (#006d77) anywhere
- ✅ All primary colors are royal blue (#0048ff)
- ✅ Warning/myth colors are red (#FF4444)
- ✅ Consistent with rest of app theme

---

### 5. Multilingual Support

**Test Steps**:
1. Open sidebar (mobile or desktop)
2. Find Language Settings section
3. Click "TWI" button
4. **Expected**: All UI text changes to Twi language
5. Test chat responses - type "awo si ano" (contraception in Twi)
6. **Expected**: Response in Twi language
7. Switch to "EWE"
8. **Expected**: All UI text changes to Ewe language
9. Switch back to "EN"
10. **Expected**: All UI text returns to English

**Visual Checks**:
- ✅ Sidebar descriptions translated
- ✅ Navigation items translated
- ✅ Action buttons translated
- ✅ Settings labels translated
- ✅ Bot responses in selected language

---

### 6. Responsive Behavior

**Test Steps**:
1. Start with browser at full desktop width (>1280px)
2. **Expected**: Sidebar open, content area uses remaining space
3. Slowly resize browser width from 1280px → 1024px
4. **Expected**: Sidebar remains visible until <1024px
5. Cross the 1024px threshold
6. **Expected**: Sidebar automatically closes/hides
7. Resize back to >1024px
8. **Expected**: Sidebar automatically opens again

**Breakpoint Tests**:
- ✅ 1440px: Sidebar open, spacious layout
- ✅ 1280px: Sidebar open, normal layout
- ✅ 1024px: Sidebar open (boundary)
- ✅ 1023px: Sidebar closed (mobile mode)
- ✅ 768px: Mobile layout, hamburger menu
- ✅ 375px: Mobile portrait, all features accessible

---

### 7. Accessibility Tests

**Keyboard Navigation**:
1. Use Tab key to navigate through sidebar items
2. **Expected**: Focus indicators visible on all interactive elements
3. Press Enter on focused navigation item
4. **Expected**: Navigation works, section changes
5. Tab through action buttons (Clear Chat, Logout)
6. **Expected**: All buttons keyboard accessible

**Screen Reader**:
1. Enable screen reader (VoiceOver/NVDA/JAWS)
2. Navigate to sidebar
3. **Expected**: "Navigate the app and manage your privacy settings" announced
4. Navigate through menu items
5. **Expected**: Each item announced with label
6. Focus on language buttons
7. **Expected**: "English", "TWI", "EWE" announced

**Visual Checks**:
- ✅ Focus visible on all interactive elements
- ✅ Color contrast meets WCAG AA standards
- ✅ Touch targets ≥44x44px on mobile
- ✅ Semantic HTML structure

---

### 8. Settings & Privacy

**Test Steps**:
1. Navigate to Settings section
2. Verify all settings cards display:
   - Your Nickname
   - Bot Name
   - Auto-Delete Settings
   - Language Settings
   - Privacy & Data
   - Logout

3. Test "Change Bot Name":
   - Click "Change Bot Name"
   - Enter new name (e.g., "My AI Helper")
   - Click "Save Name"
   - **Expected**: Toast confirmation, name updates in header

4. Test "Auto-Delete Settings":
   - Select different retention periods (24h, 7d, 30d, 90d)
   - **Expected**: Selection saves, timer updates

5. Test "Logout":
   - Click Logout button
   - **Expected**: Confirmation dialog appears
   - Click "Yes, Logout"
   - **Expected**: All data cleared, returns to nickname modal

**Visual Checks**:
- ✅ All settings cards have white background
- ✅ Blue accent colors consistent
- ✅ Settings save successfully
- ✅ Toasts appear at top-center

---

### 9. Performance Checks

**Load Time**:
- App loads in <2 seconds on 3G
- Sidebar animation smooth (60fps)
- No layout shift on load
- Images load progressively

**Memory Usage**:
- No memory leaks on sidebar toggle
- Event listeners cleaned up properly
- LocalStorage updates efficient

**Browser Console**:
- No errors in console
- No React warnings
- No accessibility violations

---

### 10. Cross-Browser Testing

**Browsers to Test**:
- [ ] Chrome/Edge (Chromium) - Latest
- [ ] Firefox - Latest
- [ ] Safari - Latest (Mac/iOS)
- [ ] Mobile Safari - iOS 14+
- [ ] Chrome Mobile - Android

**Expected Behavior**:
- All features work identically
- CSS renders correctly
- Animations smooth
- Touch events work on mobile
- No browser-specific bugs

---

## Issue Reporting Template

If you find any issues during testing, use this template:

```markdown
**Issue Title**: [Brief description]

**Environment**:
- Browser: [e.g., Chrome 120]
- Device: [e.g., iPhone 14, Desktop]
- Screen Size: [e.g., 1920x1080, 375x812]
- Language: [EN/TWI/EWE]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [...]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Additional Context**:
[Any other relevant information]
```

---

## Quick Fix Checklist

If something isn't working:

1. **Sidebar not opening on desktop?**
   - Check browser width is ≥1024px
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear localStorage and reload

2. **Responses not showing correct content?**
   - Verify language selection
   - Check console for errors
   - Ensure keyword matching (lowercase)

3. **Colors not matching?**
   - Clear browser cache
   - Verify Tailwind CSS loaded
   - Check for custom CSS overrides

4. **Mobile sidebar issues?**
   - Test on actual device, not just browser resize
   - Verify touch events working
   - Check z-index conflicts

---

**Testing completed by**: __________________

**Date**: __________________

**Passed**: ☐ All tests | ☐ Most tests | ☐ Some issues found

**Notes**:
________________________________
________________________________
________________________________

---

*Lydia Contact Center - Safe, Smart, Discreet SRHR for Youth*
