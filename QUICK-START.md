# Quick Start Guide

## 🚀 How to Start the Development Server

### Option 1: Use the Batch File (Windows)
Double-click `start-dev.bat` in the root folder

### Option 2: Use PowerShell Script
Right-click `start-dev.ps1` and select "Run with PowerShell"

### Option 3: Manual Command
```bash
# Make sure you're in the byGodsgrace/byGodsgrace directory
cd byGodsgrace
npm run dev
```

## 📁 Directory Structure
```
byGodsgrace/
├── byGodsgrace/          ← This is where package.json is located
│   ├── package.json
│   ├── src/
│   └── ...
├── start-dev.bat         ← Use this to start the server
├── start-dev.ps1         ← Alternative PowerShell script
└── QUICK-START.md        ← This file
```

## ⚠️ Common Mistake
**Don't run `npm run dev` from the outer `byGodsgrace` folder!**
You must be in the inner `byGodsgrace` folder where `package.json` is located.

## 🌐 Access the App
Once running, go to: http://localhost:8080 