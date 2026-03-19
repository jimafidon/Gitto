# Gitto

> Track your journey. Share your progress.

A social platform for documenting and sharing personal projects and goals.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (now) · Google + GitHub OAuth (planned) |

---

## Getting started

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier is fine)

### 1. Clone the repo
```bash
git clone https://github.com/jimafidon/Gitto.git
cd gitto
```

### 2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env       # then fill in your values
npm run dev                # runs on http://localhost:3001
```

### 3. Set up the frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # then fill in your values
npm run dev                        # runs on http://localhost:3000
```

---

## Branch naming
```
feat/your-feature-name
fix/what-you-fixed
chore/what-you-changed
```
Never commit directly to `main`. Always open a pull request.

---

## Project structure

```
gitto/
├── frontend/        Next.js app
│   └── src/
│       ├── app/         #Pages (App Router)
│       ├── components/  #Reusable UI
│       ├── services/    #API calls
│       └── hooks/       #Custom React hooks
│
└── backend/         Express API
    └── src/
        ├── routes/       #URL endpoints
        ├── controllers/  #Request logic
        ├── models/       #MongoDB schemas
        └── middleware/   #Auth, validation, errors
```