# React DMS

![Backend CI](https://github.com/MaxEmdeWorks/react-dms/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/MaxEmdeWorks/react-dms/actions/workflows/frontend.yml/badge.svg)

A modern full-stack Document Management System built with React & Vite frontend and Flask API backend. Features document CRUD operations, file upload/storage with versioning, search functionality, and archive/restore capabilities. Uses PostgreSQL for metadata storage and MinIO S3-compatible object storage for files.

## Quickstart

1. Start MinIO Object Storage
   ```bash
   # From project root - start MinIO with Docker Compose
   docker-compose up -d

   # Verify MinIO is running
   # MinIO Console: http://localhost:9001 (admin: minioadmin/minioadmin)
   # MinIO API: http://localhost:9000
   ```

2. Backend Setup (Flask API)
   ```bash
   # Navigate to backend directory
   cd backend

   # Create venv and activate
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate

   # Install dependencies
   pip install -r requirements_linux.txt  # Windows: requirements.txt

   # Copy example env file and customize if needed
   cp .env.example .env  # Windows: copy .env.example .env

   # Configure PostgreSQL and MinIO settings in .env
   # Uses PostgreSQL: Set DATABASE_URL=postgresql://user:password@localhost:5432/dbname

   # Run database migrations
   flask db upgrade

   # Start Flask API server
   flask run
   ```

3. Frontend Setup (React & Vite)
   ```bash
   # Navigate to frontend directory
   cd frontend

   # Install dependencies and start dev server
   npm install
   npm run dev
   # open http://localhost:5173
   ```

## Features
- ✅ PostgreSQL database with Flask-SQLAlchemy ORM
- ✅ MinIO S3-compatible object storage with Docker Compose setup
- ✅ Database migrations with Flask-Migrate and Alembic
- ✅ Document CRUD operations (Create, Read, Update, Delete)
- ✅ Document archiving system (archive/unarchive with status toggle)
- ✅ File upload with automatic versioning and metadata tracking
- ✅ File download with presigned URLs for secure access
- ✅ File preview for images and PDFs in browser interface
- ✅ Search functionality with real-time filtering by title/tags
- ✅ Document tagging system with comma-separated tags
- ✅ Responsive React UI with Tailwind CSS styling
- ✅ Modular component architecture with reusable components
- ✅ Mobile-first responsive design with modern navigation
- ✅ RESTful API with proper error handling and validation
- ✅ CORS enabled for local development environment
- ✅ SHA256 checksums and MIME type detection for files
- ✅ Cascade deletion with background cleanup queue
- ✅ GitHub Actions CI/CD pipeline for automated testing

## MinIO Object Storage

MinIO provides S3-compatible object storage for file management:

```bash
# MinIO runs via Docker Compose
docker-compose up -d

# Access MinIO Console at http://localhost:9001
# Default credentials: minioadmin/minioadmin
# API endpoint: http://localhost:9000
```

Storage Architecture:
- Hybrid approach: PostgreSQL for metadata, MinIO for file content
- Versioning: Files stored as `document/{doc_id}/v{version}/{filename}`
- Security: Presigned URLs for secure direct downloads
- Auto-cleanup: Background deletion queue for failed operations

## Database Commands
```bash
# Create migration after model changes
flask db migrate -m "Description of changes"

# Apply migrations to database
flask db upgrade

# Reset database (development only)
flask db downgrade base
flask db upgrade
```

## Configuration

Backend Environment Variables (`backend/.env`):
```bash
# Flask Configuration
FLASK_APP=app.py
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here
RELOAD_TEMPLATES=True

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# MinIO Object Storage
MINIO_ENDPOINT=127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=0
MINIO_BUCKET=dms

# Upload Settings
MAX_UPLOAD_BYTES=2097152  # 2 MB default
USE_PRESIGNED_URLS=1      # Enable presigned URLs for downloads
```

Frontend Environment Variables (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:5000
```

## API Endpoints
```bash
# Document Management
GET    /api/documents                       # List documents with optional filtering
POST   /api/documents                       # Create new document
PATCH  /api/documents/{id}                  # Update document (title, tags, status)
DELETE /api/documents/{id}                  # Delete document and all associated files

# File Management
GET    /api/documents/{id}/files            # List files for a document
POST   /api/documents/{id}/files            # Upload file to document
GET    /api/documents/{id}/files/{file_id}  # Download file (returns presigned URL)
DELETE /api/documents/{id}/files/{file_id}  # Delete specific file
```

## Next Steps
- Add user authentication system (Flask-Login or JWT)
- Add user-specific document access and permissions
- Add file sharing capabilities with expiring links
- Add document collaboration features (comments, history)
- Add full-text search within document content
- Add file thumbnail generation for images/PDFs
- Add bulk operations (multi-select, batch upload)
- Add admin dashboard with usage statistics
- Add Docker containerization for full-stack deployment
- Add Redis caching for improved performance
