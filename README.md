# Notara - Premium Note Taking App

Notara is a modern, full-stack note-taking application designed with a focus on aesthetics and user experience. It features a sleek interface, rich text editing, real-time-like collaboration, and organized note management.

## 🚀 Features

- **Rich Text Editing**: Powered by Tiptap for a smooth writing experience.
- **Organization**: Categorize notes with tags, colors, and priorities.
- **Dashboard**: Quick stats on pinned, favorite, and overdue notes.
- **Collaboration**: Share notes with others and manage permissions (Read/Write).
- **Search & Filter**: Find notes easily with full-text search and advanced filters.
- **Responsive Design**: Beautifully crafted with Tailwind CSS for all devices.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Tooling**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Morgan

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- npm or yarn

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Note_Taking_App
```

### 2. Install Dependencies
You can install dependencies for the entire project from the root directory:
```bash
npm run install-all
```
*This command installs root dependencies and then executes `npm install` in both `client` and `server` folders.*

### 3. Environment Variables

Navigate to the `server` directory and create a `.env` file:
```bash
cd server
touch .env
```

Add the following environment variables to your `server/.env` file:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | The port the server will run on | `5000` |
| `MONGODB_URI` | Your MongoDB connection string | `mongodb://localhost:27017/notara` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_super_secret_key` |
| `JWT_EXPIRE` | Expiration time for JWT tokens | `7d` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | URL of the frontend (for CORS in production) | `http://localhost:5173` |

### 4. Run the Application

From the root directory, run both the client and server concurrently:
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

---

## 📁 Project Structure

```text
Note_Taking_App/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth and Notes contexts
│   │   ├── pages/       # Page components
│   │   └── utils/       # API configuration and helpers
├── server/              # Express backend
│   ├── middleware/      # Auth and error middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API endpoints
│   └── index.js         # Entry point
├── package.json         # Root scripts and concurrently
└── README.md            # You are here
```

---

## 🛡️ Security

- **Authentication**: JWT-based authentication for secure API access.
- **Passwords**: Hashed using `bcryptjs` before storage.
- **Validation**: Input validation using `express-validator`.
- **CORS**: Configured to restrict access.

---

## 📄 License

This project is licensed under the MIT License.
