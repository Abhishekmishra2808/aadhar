# Aadhaar Pulse

## Societal Trend Intelligence Engine for UIDAI

A next-generation analytics platform that transforms Aadhaar enrollment data into actionable insights for policy makers.

![Design: Obsidian Style](https://img.shields.io/badge/Design-Obsidian%20Style-000000)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## Features

- **Real-time Pattern Detection** - Identify enrollment anomalies and trends as they emerge across India
- **LLM-Powered Root Cause Analysis** - AI-driven insights correlate data with news, infrastructure, and policy changes
- **Actionable Policy Insights** - Transform data into clear recommendations for UIDAI decision-makers
- **Interactive Data Visualizations** - Beautiful charts showing enrollment trends, hotspots, and demographic breakdowns

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for blazing-fast development
- Tailwind CSS for styling
- Framer Motion for fluid animations
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd aadhaar
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:3001`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser

## Project Structure

```
aadhaar/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── AgeDistributionChart.tsx
│   │   │   │   ├── EnrollmentTrendChart.tsx
│   │   │   │   ├── HotspotBubbleChart.tsx
│   │   │   │   └── RejectionReasonsChart.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DropZone.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── InsightSummary.tsx
│   │   │   └── LLMReasoningBar.tsx
│   │   ├── data/
│   │   │   └── mockData.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── backend/
    ├── src/
    │   ├── data/
    │   │   └── mockData.ts
    │   ├── services/
    │   │   └── analyzer.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

## Design Philosophy

**Obsidian Style** - A minimalist, premium aesthetic inspired by Apple's design language:

- Pure black background (#000000)
- Roboto font family (weights: 300, 400, 700)
- High-contrast fluid animations
- Glass-morphism effects with backdrop blur
- No cluttered sidebars or terminal windows
- Clean, focused analytics dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/trends/enrollment` | Get enrollment trend data |
| GET | `/api/anomalies` | Get anomaly data |
| GET | `/api/insights` | Get generated insights |
| POST | `/api/upload` | Upload and analyze data file |
| POST | `/api/analyze/llm` | Trigger LLM analysis |

## License

This project is developed for UIDAI internal use.

---

Built with ❤️ for Digital India
