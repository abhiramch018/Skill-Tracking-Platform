# 🎓 CertTrack — Certification & Skill Tracking Platform

A full-stack web application that streamlines **certificate management and skill tracking** for academic institutions. Students upload certificates, faculty verify them, and admins gain system-wide analytics — all through role-based dashboards.

---

## ✨ Features

### 👩‍🎓 Student
- Upload certificates with title, organization, category, skill tags & expiry date
- Track certificate status (Pending / Accepted / Rejected)
- View performance metrics and analytics
- Receive expiry alerts for certificates expiring within 30 days
- Delete pending (unreviewed) certificates

### 👨‍🏫 Faculty
- View and manage assigned certificates
- Accept or reject certificates with remarks
- Review statistics dashboard

### 🛡️ Admin
- View all certificates system-wide
- System-wide analytics with category breakdown
- Student leaderboard (top 10 by performance score)
- User management (list & delete users)

---

## 🛠️ Tech Stack

| Layer      | Technology                                                     |
|------------|----------------------------------------------------------------|
| **Frontend** | React 18, Vite 5, React Router v6, Axios                    |
| **Backend**  | Django 5, Django REST Framework, Token Authentication        |
| **Database** | PostgreSQL (local) / `DATABASE_URL` support (Railway, etc.)  |
| **Storage**  | Django media files (certificate & profile image uploads)     |
| **Deployment** | Vercel (frontend) · Railway/Render with Gunicorn (backend) |

---

## 📁 Project Structure

```
Skill Tracking Platform/
├── backend/
│   ├── accounts/          # Custom user model, auth views (register, login, profile)
│   ├── certificates/      # Certificate CRUD, faculty review, admin analytics
│   ├── backend/           # Django settings, root URL config, WSGI
│   ├── media/             # Uploaded files (gitignored)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile           # Gunicorn entry point
│   └── runtime.txt        # Python version for deployment
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # LandingPage, Login, Register, Student/Faculty/Admin Dashboards
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext (global auth state)
│   │   ├── services/      # Axios API service layer
│   │   ├── App.jsx        # Route definitions with role-based protection
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── vercel.json        # Vercel deployment config
│   ├── vite.config.js
│   └── package.json
│
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.12+
- **Node.js** 18+
- **PostgreSQL** installed and running

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/certTrack.git
cd certTrack
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE cert_tracker_db;"

# Configure environment variables
# Create backend/.env and set:
#   SECRET_KEY=your-secret-key
#   DEBUG=True
#   DATABASE_URL=postgres://postgres:<password>@localhost:5432/cert_tracker_db  (optional)

# Apply migrations
python backend/manage.py migrate

# Create a superuser (admin account)
python backend/manage.py createsuperuser

# Start the development server
python backend/manage.py runserver
```

The backend API will be available at **http://localhost:8000**.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Create .env.local and set:
#   VITE_API_URL=http://localhost:8000

# Start the dev server
npm run dev
```

The frontend will be available at **http://localhost:5173**.

---

## 🔌 API Endpoints

### Accounts (`/api/accounts/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register a new student or faculty |
| POST | `/login/` | Login and receive auth token |
| GET/PUT | `/profile/` | View or update current user profile |
| GET | `/users/` | Admin: list all users |
| DELETE | `/users/<id>/` | Admin: delete a user |

### Certificates (`/api/certificates/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/` | Student: upload a certificate |
| GET | `/my/` | Student: list own certificates |
| DELETE | `/<id>/delete/` | Student: delete a pending certificate |
| GET | `/performance/` | Student: performance metrics |
| GET | `/alerts/` | Student: expiry alerts (30 days) |
| GET | `/assigned/` | Faculty: view assigned certificates |
| PUT | `/review/<id>/` | Faculty: accept/reject a certificate |
| GET | `/faculty-stats/` | Faculty: review statistics |
| GET | `/all/` | Admin: list all certificates |
| GET | `/analytics/` | Admin: system-wide analytics |
| GET | `/leaderboard/` | Admin: top 10 students |

---

## 🔐 Authentication

The platform uses **Token-based authentication** via Django REST Framework's `TokenAuthentication`. After logging in, include the token in subsequent requests:

```
Authorization: Token <your-auth-token>
```

---

## 📜 Certificate Categories

| Key | Label |
|-----|-------|
| `cloud` | Cloud Computing |
| `ai_ml` | AI / Machine Learning |
| `web` | Web Development |
| `cyber` | Cybersecurity |
| `data` | Data Science & Analytics |
| `devops` | DevOps & CI/CD |
| `mobile` | Mobile Development |
| `other` | Other |

---

## 🌐 Deployment

### Frontend (Vercel)

The `frontend/vercel.json` handles SPA routing. Deploy directly from the `frontend/` directory on Vercel.

### Backend (Railway / Render)

- Set `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `FRONTEND_URL`, and `DEBUG=False` as environment variables.
- The `Procfile` uses Gunicorn: `web: gunicorn backend.wsgi`
- Static files are served via **WhiteNoise**.

---

## 📄 License

This project is for educational purposes.
