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

## Manual project-page test fixture

Use this to create a repeatable project fixture before testing project-page integrations.

### Existing fixture already created
- Test user handle: `mt0413201404`
- Test user email: `mt0413201404@example.com`
- Password: `Password123`
- Project id: `69dd94ddaa485c6fa8c4459c`
- Project URL: `http://localhost:3000/project/69dd94ddaa485c6fa8c4459c`

### Recreate the fixture (PowerShell)
Run this while backend is up on `http://localhost:3001`:

```powershell
$ts = Get-Date -Format "MMddHHmmss"
$handle = "mt$ts"
$email = "$handle@example.com"

$registerBody = @{
  name = "Manual Tester"
  handle = $handle
  email = $email
  password = "Password123"
} | ConvertTo-Json

$register = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/register" -ContentType "application/json" -Body $registerBody
$token = $register.token

$projectBody = @{
  title = "Project Connectivity Sandbox"
  description = "Manual QA project for validating project page backend integration and UI actions."
  status = "in_progress"
  tags = @("qa","integration","project-page")
  milestones = @(
    @{ title = "Wire up backend endpoints"; description = "Connect project routes and controllers"; status = "in_progress"; progress = 45 },
    @{ title = "Hook frontend buttons"; description = "Follow, star, updates, milestones"; status = "upcoming"; progress = 0 }
  )
} | ConvertTo-Json -Depth 6

$project = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/projects" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $projectBody

"HANDLE=$handle"
"EMAIL=$email"
"PROJECT_ID=$($project.project._id)"
```

---

## Project/feed API contract (parity scope)

The following API methods are the canonical contract for project + feed parity. This scope intentionally excludes profile-specific APIs.

### Projects API
- `POST /api/projects` -> create project
- `GET /api/projects/:id` -> project detail
- `GET /api/projects/search?q=` -> project search
- `PATCH /api/projects/:id` -> update project (owner)
- `DELETE /api/projects/:id` -> delete project (owner)
- `POST /api/projects/:id/star` / `DELETE /api/projects/:id/star` -> star toggle
- `POST /api/projects/:id/follow` / `DELETE /api/projects/:id/follow` -> follow toggle
- `POST /api/projects/:id/milestones` -> add milestone (owner)
- `GET /api/projects/:id/updates` -> updates feed for project
- `GET /api/projects/:id/comments` / `POST /api/projects/:id/comments` -> project discussion

### Posts API
- `GET /api/posts?page=` -> feed
- `GET /api/posts/saved` -> current user saved posts
- `POST /api/posts` -> create update post
- `GET /api/posts/:id` -> post detail
- `PATCH /api/posts/:id` -> update post (owner)
- `DELETE /api/posts/:id` -> delete post (owner)
- `POST /api/posts/:id/like` / `DELETE /api/posts/:id/like` -> like toggle
- `POST /api/posts/:id/save` / `DELETE /api/posts/:id/save` -> save toggle
- `POST /api/posts/:id/comments` -> add comment
- `DELETE /api/posts/:id/comments/:commentId` -> delete comment (comment author or post owner)

### Frontend service mapping
- `frontend/src/services/projects.service.js` maps to `Projects API`.
- `frontend/src/services/posts.service.js` maps to `Posts API`.
- Consumers in parity scope:
  - `frontend/src/app/project/new/page.jsx`
  - `frontend/src/app/project/[id]/page.jsx`
  - `frontend/src/app/feed/page.jsx`
  - `frontend/src/app/saved/page.jsx`
  - `frontend/src/app/search/page.jsx`

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