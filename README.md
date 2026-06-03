cat > /home/claude/taskflow/README.md << 'READMEEOF'
<div align="center">

# ✦ TaskFlow
### Premium To-Do & Productivity Suite

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A modern, animated, glassmorphism-designed productivity app built with Vanilla JavaScript.**

[🚀 Live Demo](#) · [📸 Screenshots](#screenshots) · [✨ Features](#features)

</div>

---

## 📖 About The Project

TaskFlow is a **Day 3 JavaScript Basics** assignment project — a fully-featured To-Do Application that goes beyond the basics. Built using only **HTML, CSS, and Vanilla JavaScript** (no frameworks, no libraries), this app demonstrates core JavaScript concepts like DOM Manipulation, Events, Arrays, Objects, Functions, and LocalStorage.

> 🎯 **Assignment:** Build a To-Do App with Add, Delete, Complete, Priority, Due Dates, and Search.
> 💡 **What I built:** A full SaaS-level productivity suite with Dashboard, Pomodoro Timer, Streaks, and more.

---

## ✨ Features

### ✅ Core (Assignment Requirements)
- **Add Tasks** — Title, Description, Priority, Category, Due Date, Tags
- **Delete Tasks** — With confirmation modal
- **Mark as Completed** — Toggle with animated checkbox
- **Display Total Tasks** — Live counters in header and dashboard
- **Priority Levels** — 🔴 High / 🟡 Medium / 🟢 Low
- **Due Dates** — With overdue detection and color coding
- **Search Functionality** — Real-time global search (⌘K shortcut)

### 🚀 Bonus Features
- **Dashboard** — Stats cards, progress bar, productivity score ring
- **Categories** — Work, Personal, Health, Learning, Other
- **Tags** — Custom comma-separated tags with filter support
- **Sub-tasks** — Nested checklist inside each task
- **Progress Tracking** — Per-task progress bar + manual override
- **Pomodoro Timer** — Focus / Short Break / Long Break with audio cue
- **Streak Counter** — Daily completion streak tracker 🔥
- **Daily Goal Tracker** — Set and track your daily task goal
- **Dark / Light Mode** — Toggle with smooth transition
- **Export / Import** — Save and load tasks as JSON
- **LocalStorage** — All data persists across browser sessions
- **Sort & Filter** — Sort by newest, oldest, priority, due date, A-Z

### 🎨 UI / UX
- **Glassmorphism Design** — Frosted glass cards with backdrop blur
- **Gradient Mesh Background** — Animated floating orbs
- **22+ Animations** — Shimmer, spring, pulse, spotlight effects
- **Spotlight Hover** — Hover any element — others dim, it glows
- **Responsive Layout** — Works on desktop, tablet, and mobile
- **Professional Typography** — Syne + Plus Jakarta Sans fonts

---

## 📸 Screenshots

> Dashboard View — Stats, Progress, Category Breakdown
> Task List View — Filter, Search, Sort, Priority badges
> Pomodoro Timer — Focus sessions with task queue
> Dark / Light Mode toggle

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Semantic structure, Modals, Forms |
| **CSS3** | Glassmorphism, Animations, Grid, Flexbox |
| **Vanilla JavaScript** | DOM, Events, Arrays, Objects, LocalStorage |
| **Google Fonts** | Syne + Plus Jakarta Sans |

> ⚡ Zero frameworks. Zero libraries. Pure JavaScript.

---

## 📁 Project Structure

```
taskflow/
├── index.html      # App structure — Sidebar, Views, Modals
├── style.css       # Design system — Tokens, Layout, Animations
├── app.js          # All logic — State, Tasks, Pomodoro, Storage
└── README.md       # You are here!
```

---

## 🚀 Getting Started

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR-USERNAME/taskflow.git

# 2. Open the folder
cd taskflow

# 3. Open in browser
open index.html
```

No installation. No npm. No build step. Just open and use! ✅

---

## 🧠 JavaScript Concepts Used

| Concept | Where Used |
|---|---|
| **Variables** | State object, task data |
| **Functions** | addTask, deleteTask, toggleTask, etc. |
| **Arrays** | Task list, tags, subtasks |
| **Objects** | Task object structure, CAT metadata |
| **Events** | Click, Input, Keydown, Change |
| **DOM Manipulation** | renderTaskList, buildCard, animNum |
| **LocalStorage** | save(), load() functions |
| **Template Literals** | HTML generation in buildCard |
| **Arrow Functions** | Filters, sorters, event handlers |
| **Spread Operator** | State cloning, array merging |
| **Destructuring** | Date parsing, data extraction |
| **setTimeout / setInterval** | Pomodoro timer, toast dismiss |
| **requestAnimationFrame** | Smooth number animations |
| **JSON** | Export/Import, LocalStorage |
| **Web Audio API** | Pomodoro completion beep |

---

## 📋 Day 3 Assignment Checklist

- [x] Add Tasks
- [x] Delete Tasks
- [x] Mark Tasks as Completed
- [x] Display Total Tasks
- [x] Priority Levels *(Challenge)*
- [x] Due Dates *(Challenge)*
- [x] Search Functionality *(Challenge)*

---

## 🙏 Acknowledgements

- Fonts — [Google Fonts](https://fonts.google.com)
- Design inspiration — Linear, Notion, Vercel
- Icons — Inline SVG (no external dependency)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ as part of **JavaScript Learning Journey — Day 3**

⭐ Star this repo if you found it helpful!

</div>
READMEEOF
echo "README written — $(wc -l < /home/claude/taskflow/README.md) lines"