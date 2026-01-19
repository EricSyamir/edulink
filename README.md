# Edulink - Student Discipline Tracking System

A production-ready face detection and discipline tracking web application for schools. Teachers can identify students using face recognition and manage Sahsiah (discipline) points.

![Edulink](https://img.shields.io/badge/Edulink-v1.0.0-teal)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)
![React](https://img.shields.io/badge/React-18.2-61DAFB)

## Features

- 🎯 **Face Recognition** - Identify students using InsightFace buffalo_l model
- 📊 **Discipline Tracking** - Record rewards and punishments with automatic point calculation
- 🔐 **Teacher Authentication** - Secure JWT-based login system
- 📱 **Mobile-Friendly** - Responsive UI optimized for phone cameras
- 📈 **Dashboard** - Quick overview of students and discipline statistics

## 🚀 Quick Deploy (Free Hosting)

Want to host this online for free? Check out our deployment guides:

- **[⚡ Quick Deploy Guide](./QUICK_DEPLOY.md)** - Deploy in 5 minutes
- **[📚 Full Deployment Guide](./DEPLOYMENT.md)** - Detailed instructions with multiple hosting options

**Recommended Stack (100% Free):**
- Backend: [Render.com](https://render.com) (Free tier)
- Frontend: [Vercel](https://vercel.com) (Free tier)
- Database: [PlanetScale](https://planetscale.com) (Free MySQL)

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Face Recognition**: InsightFace with buffalo_l model
- **Logging**: Loguru

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Camera**: react-webcam
- **Routing**: React Router v6

## Quick Start

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/edulink.git
cd edulink
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE edulink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations (tables will be created automatically on first run)
# Or manually run the SQL:
mysql -u root -p edulink_db < migrations/create_tables.sql
```

### 4. Download InsightFace Model

The buffalo_l model will be downloaded automatically on first use. However, you can pre-download it:

```python
# In Python shell
from insightface.app import FaceAnalysis
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0)
```

The model files will be downloaded to `~/.insightface/models/buffalo_l/`.

### 5. Seed Database

Create the initial admin teacher account:

```bash
cd backend
python scripts/seed_db.py
```

This creates:
- **Email**: admin@edulink.com
- **Password**: admin123

**⚠️ Change this password after first login!**

### 6. Run Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

### 7. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/edulink_db

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Face Recognition
FACE_SIMILARITY_THRESHOLD=0.5
FACE_MODEL_NAME=buffalo_l

# Discipline Points
DEFAULT_REWARD_POINTS=10
DEFAULT_PUNISHMENT_POINTS=-10
INITIAL_STUDENT_POINTS=100

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Key Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `FACE_SIMILARITY_THRESHOLD` | Minimum similarity score for face match (0-1) | 0.5 |
| `DEFAULT_REWARD_POINTS` | Points added for rewards | 10 |
| `DEFAULT_PUNISHMENT_POINTS` | Points deducted for punishments | -10 |
| `INITIAL_STUDENT_POINTS` | Starting points for new students | 100 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Teacher login
- `GET /api/auth/me` - Get current teacher info
- `POST /api/auth/logout` - Logout (token invalidation)

### Students
- `GET /api/students` - List students (with search/filter)
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student (with face image)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/identify` - Identify student by face

### Discipline Records
- `GET /api/discipline-records` - List all records
- `GET /api/discipline-records/student/:id` - Get student's history
- `POST /api/discipline-records` - Create reward/punishment
- `DELETE /api/discipline-records/:id` - Delete record

### Teachers
- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`.

### Run with Production Settings

```bash
# Backend
cd backend
export DEBUG=False
export JWT_SECRET_KEY=your-production-secret-key
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using systemd (Linux)

Create `/etc/systemd/system/edulink.service`:

```ini
[Unit]
Description=Edulink API
After=network.target mysql.service

[Service]
User=www-data
WorkingDirectory=/var/www/edulink/backend
Environment="PATH=/var/www/edulink/backend/venv/bin"
EnvironmentFile=/var/www/edulink/backend/.env
ExecStart=/var/www/edulink/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/edulink/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Project Structure

```
edulink/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connection
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   ├── migrations/
│   │   └── create_tables.sql    # Database schema
│   ├── scripts/
│   │   └── seed_db.py           # Database seeding
│   ├── requirements.txt
│   └── env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── context/             # React contexts
│   │   ├── services/            # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## Face Recognition Notes

### Buffalo_L Model
- **Embedding Size**: 512 dimensions
- **Detection**: RetinaFace
- **Recognition**: ArcFace
- **Accuracy**: State-of-the-art on LFW benchmark

### Best Practices for Face Registration
1. Ensure good lighting on the face
2. Face should be clearly visible without obstructions
3. Only one face should be in the frame
4. Student should look directly at the camera

### Adjusting Similarity Threshold
- **Higher threshold (0.6-0.7)**: More strict, fewer false positives
- **Lower threshold (0.4-0.5)**: More lenient, better for varied conditions
- Default is 0.5 which balances accuracy and usability

## Troubleshooting

### Common Issues

**1. Face detection not working**
- Ensure proper lighting
- Check that only one face is visible
- Try adjusting `FACE_SIMILARITY_THRESHOLD`

**2. Database connection errors**
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

**3. Camera not accessible**
- Allow camera permissions in browser
- Use HTTPS in production (required for camera access)

**4. InsightFace model download fails**
- Check internet connection
- Try manual download from InsightFace model zoo

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
