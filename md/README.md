# Music Recommendation App

A modern music application with AI-powered recommendations, authentication, and a beautiful user interface.

## Features

- 🎵 **Music Player**: Full-featured music player with beautiful UI
- 🤖 **AI Model Integration**: AI-powered music recommendations
- 🔐 **Authentication**: Secure user authentication with JWT
- 🎨 **Modern UI**: Beautiful, responsive design with dark theme
- 📱 **Responsive**: Works seamlessly on all devices

## Tech Stack

### Backend
- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- React Router
- React Toastify
- Context API for state management

## Project Structure

```
MR_APP/
├── backend/          # Express API server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
│   └── package.json
│
└── frontend/         # React application
    ├── src/
    │   ├── api/        # API service layer
    │   ├── components/ # React components
    │   ├── context/    # Context providers
    │   ├── pages/      # Page components
    │   └── ...
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (or MongoDB Atlas account)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TalhaKhan1122/Music-Recommemdation-App.git
cd Music-Recommemdation-App
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Configuration

#### Backend
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

#### Frontend
Create a `.env` file in the `frontend` directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server (in a new terminal):
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

## Routes

- `/` - Home page
- `/dashboard` - Dashboard (Protected)
- `/player` - Music player (Protected)

## Development

### Backend
```bash
cd backend
npm run dev      # Development mode with hot reload
npm run build    # Build for production
npm start        # Start production server
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Author

Talha Khan

## Acknowledgments

- Built with modern web technologies
- Inspired by modern music streaming applications

