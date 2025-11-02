# MR App Backend

Express.js API server with TypeScript for the MR Application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Start production server:
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Entry point
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── models/           # Data models
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API info

## Development

The server runs on `http://localhost:5000` by default (configurable via `.env`).

