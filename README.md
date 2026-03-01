# DockerOpt

AI-powered Dockerfile analyzer and optimizer. Paste, upload, or photograph your Dockerfile and get instant analysis with actionable optimization suggestions.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Features

- **Three Input Modes** — Paste, file upload, or image (OCR) input
- **Monaco Editor** — Syntax-highlighted Dockerfile editing with line numbers
- **AI Analysis** — GPT-powered scoring across security, performance, size, and best practices
- **Dashboard View** — Tabbed results with Overview, Issues, Optimizations, Size, Security, and Logs
- **Optimized Output** — Get a refactored Dockerfile ready to use
- **Dark / Light Theme** — Dracula-inspired dark mode with full light theme support
- **Keyboard Shortcuts** — `Ctrl+Enter` to analyze instantly
- **Drag & Drop** — Drop `.dockerfile` or text files anywhere on the page
- **Responsive** — Mobile-first design with hamburger nav and adaptive layout
- **Latency Tracking** — Real-time API response time indicator

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS (Dracula palette) |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| AI | OpenAI SDK (GPT via KodeKloud API) |
| Charts | Chart.js + react-chartjs-2 |
| Icons | lucide-react |
| Notifications | react-hot-toast |

---

## Getting Started

```bash
# Clone
git clone https://github.com/pardeep1916P/DockerImageOptimizer.git
cd AI-Docker-file-optimizer

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your API key and config to .env

# Run dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_OPENAI_API_KEY=your_api_key
VITE_OPENAI_BASE_URL=https://api.ai.kodekloud.com/v1
VITE_OPENAI_MODEL=gpt-5.2
```

---

## Project Structure

```
src/
├── App.tsx                  # Main app with state & analysis flow
├── main.tsx                 # Entry point with ThemeProvider
├── index.css                # Global styles & Dracula theme
├── components/
│   ├── landing/
│   │   ├── Header.tsx       # Docker logo, nav, theme toggle
│   │   ├── LandingPage.tsx  # Hero section wrapper
│   │   └── InputSection.tsx # Editor, upload, image input tabs
│   ├── dashboard/
│   │   ├── Dashboard.tsx    # Analysis results layout
│   │   ├── Sidebar.tsx      # Tab navigation
│   │   └── tabs/            # Overview, Issues, Optimization, Size, Security, Logs
│   └── common/
│       ├── MetricCard.tsx   # Score display card
│       ├── ScoreRing.tsx    # Circular score indicator
│       └── SeverityBadge.tsx
├── context/
│   └── ThemeContext.tsx      # Dark/light theme provider
├── constants/
│   └── samples.ts           # Sample Dockerfile for testing
├── types/
│   └── index.ts             # TypeScript interfaces
└── utils/
    ├── openai.ts            # AI client & analysis prompt
    └── clipboard.ts         # Copy-to-clipboard utility
```

---

## Screenshots

> _Coming soon_

---

## License

MIT

---

Made with ☕ and 🐳