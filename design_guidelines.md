# Design Guidelines: Financial Statement Processing Application

## Design Approach

**Selected Approach:** Design System-Based (Material Design 3)
**Justification:** Enterprise financial application requiring trust, clarity, and cross-platform consistency. Material Design 3 provides robust data display patterns, strong accessibility, and proven mobile/web parity essential for App Store deployment.

**Key Design Principles:**
- **Trust First:** Professional, polished aesthetic that conveys security and reliability
- **Clarity Over Creativity:** Prioritize readability and data comprehension
- **Progressive Disclosure:** Guide users through complex workflows step-by-step
- **Cross-Platform Consistency:** Identical experience across web/iOS/Android

## Typography

**Primary Font:** Inter (via Google Fonts)
**Secondary Font:** JetBrains Mono (for data/numbers)

**Hierarchy:**
- Page Titles: 32px/2rem, Semi-Bold
- Section Headers: 24px/1.5rem, Medium  
- Body Text: 16px/1rem, Regular
- Data Tables: 14px/0.875rem, Medium
- Helper Text: 14px/0.875rem, Regular
- Button Text: 16px/1rem, Medium

## Layout System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: py-12, py-16
- Card gaps: gap-4, gap-6
- Margins: m-2, m-4, m-8

**Containers:**
- Max width: max-w-5xl for content areas
- Full-width for tables: max-w-7xl
- Mobile padding: px-4
- Desktop padding: px-8

## Core Components

### 1. Navigation
**Desktop:** Top horizontal bar with logo left, user menu right
**Mobile:** Bottom navigation bar with primary actions
- Logo/branding placement
- User account dropdown
- Logout/settings access

### 2. File Upload Interface
**Primary Upload Zone:**
- Large dropzone (min-h-64) with dashed border
- Centered icon (document with upload arrow from Heroicons)
- Primary text: "Drag and drop your statement" (text-lg)
- Secondary text: "or click to browse" (text-sm)
- Supported formats badge below
- Security reassurance text: "Bank-grade encryption • Your data stays private"

**File Preview Card:**
- Filename with file icon
- File size display
- Remove button (X icon, top-right)
- Upload progress bar (when processing)
- Compact design: p-4, rounded borders

### 3. Data Display Tables
**Transaction Table:**
- Three-column grid: Date | Details | Amount
- Sticky header row (bg with slight elevation)
- Zebra striping for rows
- Right-aligned amounts (tabular-nums)
- Monospace font for numerical data
- Mobile: Stack to cards showing all fields vertically

**Table Features:**
- Sort indicators in headers
- Row hover states
- Empty state: centered illustration + helpful text

### 4. Format Selection
**Download Options Card:**
- Radio button group with visual format indicators
- Excel option: spreadsheet icon + "Excel (.xlsx)" label
- Word option: document icon + "Word (.docx)" label  
- Selected state with accent border
- Description text below each option

### 5. Action Buttons
**Primary Button (Download):**
- Prominent placement, full-width on mobile
- Icon + text combination
- Clear call-to-action copy

**Secondary Button (Upload Another):**
- Outlined variant
- Less visual weight than primary

### 6. Status & Feedback
**Processing States:**
- Spinner with status text
- Progress percentage for large files
- Success confirmation with checkmark icon
- Error messages with specific guidance

**Security Indicators:**
- Lock icon near sensitive actions
- "Secure connection" badge in footer
- Time-limited download countdown display

### 7. Layout Structure

**Main Application Flow:**

**Step 1 - Upload Page:**
- Centered upload zone (max-w-2xl)
- Security reassurance text above and below
- Supported formats list
- No distracting elements

**Step 2 - Processing View:**
- File preview card at top
- Processing indicator (centered)
- Progress status text

**Step 3 - Results Page:**
- File summary card (compact, top)
- Transaction table (full-width, scrollable)
- Fixed action bar at bottom containing:
  - Format selector (left)
  - Download button (right)
  - "Process another statement" link

**Mobile Considerations:**
- Single column throughout
- Fixed bottom action bar
- Collapsible table sections
- Thumb-friendly touch targets (min 44px)

## Images

**Hero Image:** NO - inappropriate for enterprise financial tool
**Icons:** Heroicons (outline style) throughout
**Illustrations:** Minimal, security-themed spot illustrations for empty states only
**Brand Elements:** Simple logo, no decorative imagery

## Visual Treatment

**Elevation System:**
- Cards: subtle shadow, 1px border
- Active elements: slightly elevated on interaction
- Modal overlays: strong elevation with backdrop

**Borders & Radius:**
- Default radius: rounded-lg (8px)
- Input fields: rounded-md (6px)
- Buttons: rounded-md
- Cards: rounded-lg

## Accessibility

- WCAG AA compliant contrast ratios minimum
- Focus visible states on all interactive elements  
- Keyboard navigation support throughout
- Screen reader labels on all icons
- Form validation with clear error messaging
- Touch targets minimum 44x44px

## Mobile-Specific Patterns

- Bottom sheet for format selection
- Swipe gestures for table navigation
- Native-feeling transitions
- Optimized for one-handed use
- Persistent download button in reach zone