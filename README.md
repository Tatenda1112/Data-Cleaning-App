# DatViz - Data Processing & Analysis Platform

A comprehensive data preparation and analysis tool with user management, project organization, and admin dashboard.

## 🚀 Quick Start

### Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Start backend server
python start_backend.py
# OR manually:
uvicorn backend.main:app --reload
```

### Frontend Setup
```bash
cd frontend_app
npm install
npm start
```

## 🔐 Default Credentials

- **Admin Account:**
  - Username: `admin`
  - Password: `admin123`

- **Register new accounts** through the frontend

## 📊 Features

### For Users:
- **Project Management**: Create and organize data analysis projects
- **Data Upload**: Support for CSV, XLSX, and Parquet files
- **Data Validation**: Comprehensive checks for data quality issues
- **Issue Reports**: Download detailed Excel reports and JSON summaries
- **Dashboard**: Visual overview of data quality metrics

### For Admins:
- **User Management**: View all users and their activity
- **System Monitoring**: Track usage statistics and logs
- **Audit Trail**: Complete activity logging with timestamps
- **Project Oversight**: Monitor all user projects

## 🛠️ Technical Stack

### Backend:
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (easily switchable to PostgreSQL/MySQL)
- **JWT** - Authentication
- **Pandas** - Data processing
- **Scikit-learn** - Data validation pipeline

### Frontend:
- **React** - UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client

## 📁 Project Structure

```
dataviz/
├── backend/
│   ├── main.py          # FastAPI app with all endpoints
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── auth.py          # Authentication logic
│   ├── database.py      # Database configuration
│   ├── pipeline.py      # Data validation pipeline
│   └── custom_transformers.py  # Data validation transformers
├── frontend_app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── ProjectManager.js
│   │   │   └── AdminDashboard.js
│   │   └── App.js       # Main React app
│   └── package.json
├── requirements.txt
└── start_backend.py
```

## 🔧 Configuration

### Environment Variables:
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - JWT secret key (change in production)

### Data Validation Configuration:
Send JSON to `/configure-checks` endpoint:
```json
{
  "numeric_converter": { "columns": ["amount", "age"] },
  "negative_zero_checker": { "columns": ["amount"] },
  "date_converter": { "columns": ["date_field"] },
  "id_validator": { "id_column": "id" }
}
```

## 📝 API Endpoints

### Authentication:
- `POST /token` - Login
- `POST /register` - Register new user
- `GET /me` - Get current user info

### Projects:
- `GET /projects` - List user projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project

### Data Processing:
- `POST /upload` - Upload data file
- `POST /identify-issues` - Run data validation
- `GET /download-issues` - Download Excel report
- `GET /download-issues-summary` - Download JSON summary

### Admin:
- `GET /admin/users` - List all users
- `GET /admin/logs` - View activity logs
- `GET /admin/stats` - System statistics

## 🎯 Usage Workflow

1. **Login/Register** - Access the platform
2. **Create Project** - Organize your data analysis
3. **Upload Data** - Add your dataset (CSV/XLSX/Parquet)
4. **Configure Checks** - Set validation rules (optional)
5. **Run Validation** - Execute data quality checks
6. **Download Reports** - Get detailed issue reports
7. **Admin Dashboard** - Monitor system (admin only)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Comprehensive audit logging
- Input validation and sanitization

## 🚀 Production Deployment

1. Change `SECRET_KEY` in production
2. Use PostgreSQL/MySQL instead of SQLite
3. Set up proper CORS origins
4. Use environment variables for configuration
5. Set up SSL/TLS certificates
6. Configure proper logging and monitoring

## 📞 Support

For issues or questions, check the API documentation at `/docs` when the backend is running.