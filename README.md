# 🚨 11:59: DEADLINE PANIC

> **Tagline**: *"3 people. 90 seconds. SAVE THE SUBMISSION."*  
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

## ⏱️ The 90-Second Escalation Curve

1. **0–20s (Orient)**: 1 simple task to build communication habit.
2. **20–45s (Pressure)**: 2 overlapping tasks with shorter timers.
3. **45–65s (Campus Crisis)**: Coordinated boss event where all players must hold the emergency sync button together for 3 seconds.
4. **65–80s (Meltdown)**: Rapid-fire 4-second directives, flashing alarms, accelerating tempo.
5. **80–90s (Final Sprint)**: High-stakes final sprint to hit 100% upload before midnight strikes!

---

## 💡 Squad Hint & Tip System
- Stuck on a tricky schematic or dial setting? Any player can tap **`[ 💡 NEED A HINT? (-3% Upload) ]`** to immediately reveal the verified solution for the active challenge!
- Costs **-3% Upload Progress** as a tactical trade-off.

---

## ⚖️ Balanced Scoring & Combo Multipliers
- **Upload Bar**: Starts at `0%`, capped at `100%`.
- **Task Success**: `+10% UPLOAD`
- **Crisis Success**: `+20% UPLOAD`
- **Hint Reveal**: `-3% UPLOAD`
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
- Once 2 or 3 players are connected, click **"⚡ LAUNCH 11:59 DEADLINE (90s)"** to start playing!

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
