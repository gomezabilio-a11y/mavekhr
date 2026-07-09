# HR Employee Portal - Design Ideas

## Three Stylistic Approaches

### Approach A: Corporate Precision
**Theme Name:** Corporate Precision  
**Brief:** Clean, structured, and authoritative. A professional enterprise tool with sharp edges, disciplined typography, and a navy/slate color system that communicates trust and reliability.  
**Probability:** 0.04

### Approach B: Warm Slate (CHOSEN)
**Theme Name:** Warm Slate  
**Brief:** A sophisticated internal tool that feels human and approachable — not cold like typical enterprise software. Warm off-white backgrounds, deep slate sidebar, and a signature amber accent create an environment where employees feel welcomed rather than processed.  
**Probability:** 0.07

### Approach C: Minimal Ink
**Theme Name:** Minimal Ink  
**Brief:** Ultra-minimal, almost editorial. Black, white, and one accent color. Inspired by financial dashboards — every pixel earns its place.  
**Probability:** 0.02

---

## Chosen Approach: Warm Slate

### Design Movement
Modern Enterprise Humanism — borrowing from Notion's warmth and Linear's precision.

### Core Principles
1. **Warmth in structure** — sidebar and cards use warm tones, not cold grays
2. **Hierarchy through weight** — font weight and size do the heavy lifting, not color noise
3. **Generous whitespace** — breathing room makes dense HR data scannable
4. **Purposeful accent** — amber/gold used sparingly for CTAs and status highlights

### Color Philosophy
- Background: warm off-white `oklch(0.98 0.008 80)` — not pure white, slightly warm
- Sidebar: deep slate `oklch(0.18 0.02 250)` — dark, authoritative, anchoring
- Primary accent: deep blue `oklch(0.42 0.18 255)` — professional trust
- Highlight accent: warm amber `oklch(0.72 0.15 65)` — human warmth, used for badges and highlights
- Text: warm dark `oklch(0.22 0.01 65)` — not pure black, slightly warm

### Layout Paradigm
Fixed left sidebar (260px) + scrollable main content area. Sidebar has company logo at top, grouped navigation, and user profile at bottom. Main content uses card-based layout with consistent 24px grid.

### Signature Elements
1. **Sidebar depth** — subtle gradient from dark slate to slightly lighter, with active item highlighted with left border accent
2. **Card elevation** — cards use warm shadow `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)` not harsh borders
3. **Status badges** — pill-shaped with amber/green/red semantic colors

### Interaction Philosophy
Smooth, confident transitions. Sidebar items slide-highlight on hover. Cards lift subtly on hover. No jarring animations — this is a tool people use for hours.

### Animation
- Sidebar active item: 150ms ease-out left-border slide
- Page transitions: 200ms fade
- Card hover: 150ms `translateY(-1px)` + shadow deepening
- Button press: 100ms scale(0.97)

### Typography System
- **Display/Headers:** `DM Sans` — geometric, warm, modern
- **Body:** `Inter` — readable, neutral, pairs well
- **Monospace (IDs, dates):** `JetBrains Mono` — clean data display
- Scale: 12/14/16/18/24/32/40px

### Brand Essence
**Mavek HR Portal** — the people platform for Mavek's team. Efficient, warm, trustworthy.
Personality: **Reliable · Approachable · Precise**

### Brand Voice
Headlines are direct and human: "Good morning, James" not "Welcome to the Employee Portal"
CTAs are action-oriented: "View my payslip" not "Click here"
Ban: "Welcome to our website", "Get started today", generic corporate speak

### Wordmark & Logo
Bold geometric "M" mark — two ascending bars forming an M, in deep blue, on transparent background.

### Signature Brand Color
Deep slate-blue `oklch(0.42 0.18 255)` — unmistakably Mavek.

---

## Style Decisions
- Use DM Sans for all headings and navigation labels
- Sidebar background: deep slate, not black
- Active nav item: left amber border + slightly lighter background
- All cards: warm white background with soft shadow, no harsh borders
- Status indicators: amber = pending/warning, green = completed/active, red = urgent
