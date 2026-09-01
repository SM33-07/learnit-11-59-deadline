# 🚨 11:59: DEADLINE PANIC

> **Tagline**: *"3 people. 75 seconds. SAVE THE SUBMISSION."*  
> An asymmetric multi-device co-op web game designed for **Learnit Club's Membership Drive Stall**.

---

## 🎮 How It Works

Passerby students scan the high-voltage QR code displayed on the booth laptop to join the squad on their mobile phones. The laptop functions as **Mission Control** displaying the ticking deadline clock, upload progress bar, chaos meter, and live spectator feed.

### 🎭 The 3 Asymmetric Roles (2–3 Players)
- 🟡 **Player 1 — THE CONTROLS (Execute)**: Tactile hardware console with toggle switches, rotary dials, capacitor sliders, and emergency hold levers. Must listen closely to team shouts!
- 🟣 **Player 2 — THE BLUEPRINTS (Decode)**: Security schematics showing safe codes, trap warnings, and pin sequences. Warns the team of safe targets vs electrified traps!
- 🔵 **Player 3 — THE DIRECTIVES (Shout)**: Step-by-step action sequences. Must scream instructions out loud to the crew!

*(In 2-player mode, Player 2 automatically alternates between Blueprints and Directives one task at a time so only 1 information channel is active at any moment).*

---

## 📋 Mission Briefing & Rules Review

Before the 75-second timer starts, the booth host clicks **"⚡ REVIEW RULES"** to open the on-screen **Mission Briefing**:
1. 🔵 **1. DIRECTIVES (SHOUT!)**: Screams the steps out loud.
2. 🟣 **2. BLUEPRINTS (DECODE!)**: Warns the squad of safe targets vs electrified traps.
3. 🟡 **3. CONTROLS (EXECUTE!)**: Operates the switches, dials, and levers.
4. 🚨 **4. CAMPUS CRISIS (SYNC!)**: When Wi-Fi alarms flash, all connected squad members hold down their sync buttons together for 3 seconds.

When everyone understands their job, the host clicks **`[ ⚡ PROCEED TO DEADLINE (START) ]`** to kick off the countdown!

---

## ⏱️ The 75-Second Escalation Curve

1. **0–15s (Orient)**: 1 simple task to build communication habit.
2. **15–35s (Pressure)**: 2 overlapping tasks with shorter timers.
3. **35–55s (Campus Crisis)**: Coordinated boss event where all players must hold the emergency sync button together.
4. **55–65s (Meltdown)**: Rapid-fire 4-second directives, flashing alarms, accelerating tempo.
5. **65–75s (Final Check)**: High-stakes final sprint to hit 100% upload before midnight strikes!

---

## ⚖️ Balanced Scoring & Combo Multipliers
- **Upload Bar**: Starts at `0%`, capped at `100%`.
- **Task Success**: `+10% UPLOAD`
- **Crisis Success**: `+20% UPLOAD`
- **Mistake**: `-4% UPLOAD` (Forgiving of 1–2 slip-ups)
- **Failed Crisis**: `-8% UPLOAD`
- **🔥 Panic Combo**: 3 consecutive successes → `COMBO x3 (+12% Boost)`; 5 consecutive → `MEGA COMBO x5 (+20% Boost)`.
- **Victory Condition**: Instant win when hitting `100%` upload before `11:59:59` with confetti fireworks and Learnit Club registration screen.

---

## 🚀 Stall Booth Setup & Quick Start

### 1. Run the Development Server
```bash
npm run dev
```

### 2. Launch Mission Control
- Open `http://localhost:3000` (or your public deployment URL) on your stall laptop.
- The root page **automatically initializes Mission Control** with a fresh room code and giant QR code!
- Passerby students point their phone cameras at the QR code to join immediately.
- Once 2 or 3 players are connected, click **"⚡ REVIEW RULES"** → **"⚡ PROCEED TO DEADLINE"** to start playing!

### 3. Stall Recovery & Admin Panel
- Press <kbd>Shift+A</kbd> or click the ⚙️ icon on the host screen to open the **Stall Admin Console**:
  - **Reset Room**: Instant reset for the next group.
  - **Skip Phase**: Fast-forward gameplay.
  - **Force Win / Force Fail**: Emergency demonstration controls.
  - **3-Phone Simulator**: Open `http://localhost:3000/sim` to test all 3 roles side-by-side on a single desktop screen!

---

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Real-Time Engine**: Server-Sent Events (SSE) + Atomic Action Handlers
- **Audio Synthesizer**: Web Audio API (100% offline arcade sound effects & sirens)
- **Styling**: Cyberpunk obsidian dark theme with CSS custom properties & Google Fonts

---

Made with ⚡ for **Learnit Club**.
