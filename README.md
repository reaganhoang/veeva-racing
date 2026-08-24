# Veeva Racing Game

A single-player 3D racing game set around Veeva HQ in Pleasanton, CA. Race 3 laps, collect power-up items, and post your best time to a shared Google Sheets leaderboard.

---

## Prerequisites

You need **Node.js 18 or higher** installed before you start.
You can ask Gemini how to install Node.js for Mac/Window WSL/git bash

---

## Setup

### 1. Download the project

If you received a zip file, extract it anywhere on your machine.

If you're cloning from Git:
```bash
git clone <repo-url>
cd racingGameDemo
```

### 2. Install dependencies (if needed)

Open a terminal in the project folder and run:
```bash
npm install
```

This downloads all required packages (Three.js, React, physics engine, etc.). It takes about 30–60 seconds the first time.

### 3. Configure environment variables (to record your laptime to google sheet)

The game works fully offline without any setup. The `.env` file is only needed to enable the shared **Google Sheets leaderboard**.

Copy the example file:

**Mac / Git Bash on Windows**
```bash
cp .env.example .env
make sure you have this config in your .env file: VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxTns7WENs-WxJp-WJnHpUuY502mlCCSNWP3U3FCQn5Q4SnPhgDWQk21Z06BhLpTXSV/exec
```

**Windows Command Prompt**
```
copy .env.example .env
```

Then open `.env` in any text editor. If you're skipping Google Sheets, you can leave it as-is — the game will save scores locally instead.

### 4. Start the game

```bash
npm run dev
```

Then open your browser and go to:
```
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```
