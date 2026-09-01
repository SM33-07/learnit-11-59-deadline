# 🚨 11:59: DEADLINE PANIC

> **Tagline**: *"3 people. 75 seconds. SAVE THE SUBMISSION."*  
> An asymmetric multi-device co-op web game designed for **Learnit Club's Membership Drive Stall**.

---

## 🎮 How It Works

Participants scan a dynamic QR code on their mobile phones to join a synchronized room. The host laptop displays the ticking deadline clock, upload progress bar, chaos meter, and spectator broadcast.

### 🎭 The 3 Asymmetric Roles
- 🟡 **Player 1 — THE CONTROLS**: Tactile toggle switches, sliders, rotary dials, push buttons, and hold levers.
- 🟣 **Player 2 — THE BLUEPRINTS**: Security schematics showing safe codes, trap warnings, and pin sequences.
- 🔵 **Player 3 — THE DIRECTIVES**: Step-by-step action sequences to shout out loud to the crew!

*(In 2-player mode, roles fuse with sequential active channel switching so only 1 information channel is active at a time).*

---

## ⏱️ The 75-Second Escalation Curve

1. **0–15s (Orient)**: 1 simple task to build communication habit.
2. **15–35s (Pressure)**: 2 overlapping tasks with shorter timers.
3. **35–55s (Campus Crisis)**: Coordinated boss event where all players must hold the emergency sync button together.
4. **55–65s (Meltdown)**: Rapid-fire 4-second directives, flashing alarms, accelerating tempo.
5. **65–75s (Final Check)**: High-stakes final sprint to hit 100% upload before midnight strikes!

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

- **Host / Big Screen Display**: Open `http://localhost:3000` and click **"LAUNCH HOST SCREEN"**.
- **Participant Phone Join**: Point phone camera at the on-screen QR code or open `http://<YOUR_LAN_IP>:3000/play/<ROOM_CODE>`.
- **Built-in 3-Phone Simulator**: Open `http://localhost:3000/sim` to test all roles side-by-side on desktop!

---

## 🛠️ Tech Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Real-Time Engine**: Server-Sent Events (SSE) + Atomic Action Handlers
- **Audio Synthesizer**: Web Audio API (100% offline arcade sound effects & sirens)
- **Styling**: Cyberpunk obsidian dark theme with CSS custom properties & Google Fonts

---

Made with ⚡ for **Learnit Club**.
