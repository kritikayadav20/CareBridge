# CareBridge UI Design System

## Design Philosophy

**Clean, Professional, Healthcare-Focused**
- Minimal, uncluttered interfaces
- High clarity for demo judges
- Emphasis on patient safety and data continuity
- Trustworthy, medical aesthetic
- Readability over fancy animations

## Color Palette

### Primary Colors
- **Blue**: `#0ea5e9` (sky-500) - Primary actions, links
- **Teal**: `#14b8a6` (teal-500) - Secondary actions, accents
- **Slate**: `#1e293b` (slate-800) - Text, headings

### Background Colors
- **Light**: `#f8fafc` (slate-50) - Main background
- **White**: `#ffffff` - Cards, panels
- **Gradient**: `from-blue-50 via-white to-teal-50` - Hero sections

### Status Colors
- **Success**: Green (`bg-green-100 text-green-800`)
- **Warning**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Danger**: Red (`bg-red-100 text-red-800`)
- **Info**: Blue (`bg-blue-100 text-blue-800`)
- **Neutral**: Gray (`bg-gray-100 text-gray-800`)

## Typography

- **Headings**: Bold, large (text-3xl, text-2xl)
- **Body**: Regular, readable (text-base, text-sm)
- **Labels**: Medium weight (font-medium)
- **Small text**: Light gray (text-slate-500, text-slate-400)

## Components

### Button
- **Variants**: primary, secondary, danger, outline
- **Sizes**: sm, md, lg
- **Full width option**: `fullWidth` prop
- Rounded corners (rounded-lg)
- Clear hover states

### Card
- White background
- Rounded corners (rounded-xl)
- Shadow (shadow-md)
- Padding options: none, sm, md, lg

### Badge
- Status indicators
- Rounded-full shape
- Color-coded by variant
- Small, unobtrusive

### StatusIndicator
- Transfer status visualization
- Color-coded dots
- Emergency/Non-emergency badges
- Clear visual hierarchy

### TransferSteps
- Step-by-step progress indicator
- Visual progress line
- Completed steps highlighted
- Current step emphasized

## Page Designs

### 1. Landing Page
- **Hero section**: Large, clear value proposition
- **Feature cards**: 3-column grid with icons
- **Trust indicators**: Tech stack badges
- **Clear CTAs**: "Get Started" and "Sign In"

### 2. Login Page
- **Centered card design**
- **Clean form**: Email + password only
- **Healthcare branding**: CareBridge logo
- **Minimal distractions**

### 3. Patient Dashboard
- **Welcome message**: Personalized greeting
- **Profile card**: Key patient info
- **Recent vitals**: Quick overview
- **Transfer history**: Recent transfers
- **Clear action**: "Add Health Record" button

### 4. Hospital Dashboard
- **Incoming transfers**: Highlighted cards with "Accept" CTA
- **Outgoing transfers**: Status tracking
- **Visual distinction**: Border-left accent for incoming
- **Quick actions**: "Request Transfer" button

### 5. Transfer Detail View
- **Status steps**: Visual progress indicator
- **Patient overview**: Key information cards
- **Health trends**: Chart visualization
- **AI summary**: Clearly labeled, gradient background
- **Medical data**: Tables and reports
- **Chat**: Real-time coordination

### 6. Health Records Page
- **Chart first**: Visual trends prominent
- **AI summary**: Highlighted section
- **Data table**: Clean, readable
- **Empty states**: Helpful, actionable

## UX Principles

1. **Clear Hierarchy**: Most important info at top
2. **Obvious Actions**: Primary buttons are prominent
3. **Status Visibility**: Transfer status always visible
4. **Data Continuity**: Patient data clearly shown during transfers
5. **Empty States**: Helpful messages with next steps
6. **Loading States**: Clear feedback during operations
7. **Error Handling**: User-friendly error messages

## Accessibility

- High contrast text
- Large click targets
- Clear focus states
- Semantic HTML
- Readable font sizes

## Responsive Design

- Mobile-first approach
- Grid layouts adapt to screen size
- Cards stack on mobile
- Navigation collapses appropriately

## Key Visual Elements

- **Rounded corners**: `rounded-lg`, `rounded-xl`
- **Subtle shadows**: `shadow-sm`, `shadow-md`
- **White space**: Generous padding and margins
- **Borders**: Light gray (`border-slate-200`)
- **Icons**: Simple SVG icons, used sparingly

## Component Locations

- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Card.tsx` - Card container
- `components/ui/Badge.tsx` - Status badges
- `components/ui/StatusIndicator.tsx` - Transfer status
- `components/ui/TransferSteps.tsx` - Progress indicator

## Updated Pages

✅ Landing page (`app/page.tsx`)
✅ Login page (`app/(auth)/login/page.tsx`)
✅ Signup page (`app/(auth)/signup/page.tsx`)
✅ Dashboard (`app/dashboard/page.tsx`)
✅ Health Records (`app/dashboard/health-records/page.tsx`)
✅ Add Health Record (`app/dashboard/health-records/add/page.tsx`)
✅ Transfers List (`app/dashboard/transfers/page.tsx`)
✅ Transfer Detail (`app/dashboard/transfers/[id]/page.tsx`)
✅ Health Chart (`components/HealthChart.tsx`)
✅ Health Summary (`components/HealthSummary.tsx`)
✅ Transfer Chat (`components/TransferChat.tsx`)
✅ Accept Button (`components/AcceptTransferButton.tsx`)

## Design Goals Achieved

✅ Clean, minimal, professional healthcare look
✅ High clarity for demo judges
✅ Emphasis on patient safety and data continuity
✅ Trustworthy, medical aesthetic
✅ Readability prioritized
✅ Clear action buttons
✅ Visual status indicators
✅ Professional color palette

The UI is now ready for the Google TechSprint 2026 demo! 🎨

