from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
import io
import os
import yaml
from typing import Any, Dict, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .pipeline import create_issue_pipeline
from .database import get_db, create_tables
from .models import User, Project, Log
from .schemas import UserCreate, User as UserSchema, ProjectCreate, Project as ProjectSchema, ProjectUpdate, Log as LogSchema, Token
from .auth import authenticate_user, create_access_token, get_current_active_user, get_admin_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import Body

app = FastAPI(title="DatViz API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    # Create default admin user if it doesn't exist
    db = next(get_db())
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@dataviz.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrator",
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
    db.close()

data = None  # Global DataFrame
configs: Dict[str, Any] = {}

# Helper function to log actions
def log_action(db: Session, user_id: int, action: str, details: dict = None, project_id: int = None, request: Request = None):
    log = Log(
        user_id=user_id,
        project_id=project_id,
        action=action,
        details=details or {},
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    db.commit()

def load_configs() -> Dict[str, Any]:
    """Load configuration from root-level config.yaml if present."""
    # Try repo root first, then current working directory as fallback
    candidate_paths = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml"),
        os.path.join(os.getcwd(), "config.yaml"),
    ]
    for path in candidate_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return yaml.safe_load(f) or {}
            except Exception:
                # If config cannot be parsed, continue with empty configs
                return {}
    return {}

def clear_old_files():
    if os.path.exists("data_issues.xlsx"):
        os.remove("data_issues.xlsx")
    if os.path.exists("data_issues.json"):
        os.remove("data_issues.json")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global data
    global configs
    clear_old_files()
    contents = await file.read()

    if not file.filename.endswith(('.csv', '.xlsx', '.parquet')):
        raise HTTPException(status_code=400, detail="Unsupported file format.")

    try:
        if file.filename.endswith('.csv'):
            data = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        elif file.filename.endswith('.xlsx'):
            data = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.parquet'):
            data = pd.read_parquet(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Load configs once a file is uploaded so we can parameterize the pipeline
    configs = load_configs()

    return {
        "message": "File uploaded successfully.",
        "columns": data.columns.tolist(),
        "preview": data.head(5).to_dict(orient="records")
    }

@app.post("/configure-checks")
async def configure_checks(config: Dict[str, Any] = Body(...)):
    """Accept JSON config specifying which columns/checks to run.
    Structure mirrors pipeline configs, e.g. numeric_converter.columns, id_validator.id_column, etc.
    """
    global configs
    if not isinstance(config, dict):
        raise HTTPException(status_code=400, detail="Config must be a JSON object.")
    configs = config
    return {"message": "Configuration saved.", "received_keys": list(config.keys())}

@app.post("/upload-config")
async def upload_config(file: UploadFile = File(...)):
    """Upload a JSON configuration file with the same structure as /configure-checks."""
    global configs
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Please upload a .json file.")
    try:
        content = await file.read()
        import json
        parsed = json.loads(content.decode("utf-8"))
        if not isinstance(parsed, dict):
            raise ValueError("Top-level JSON must be an object.")
        configs = parsed
        return {"message": "Configuration uploaded.", "received_keys": list(parsed.keys())}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

@app.post("/identify-issues")
async def identify_issues():
    global data
    global configs
    if data is None:
        raise HTTPException(status_code=400, detail="No data uploaded.")

    try:
        # Build and run the pipeline with loaded configs
        pipeline = create_issue_pipeline(configs=configs or {})
        transformed = pipeline.fit_transform(data)

        # If IssueSaver created the xlsx, optionally expose a small JSON summary alongside it
        summary_path = "data_issues.json"
        try:
            # The IssueSaver writes a Summary sheet; we recompute a light summary here
            summary = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "columns": list(transformed.columns),
            }
            # Defer to IssueSaver-produced counts if present via a lightweight read
            # We avoid heavy engine dependencies by keeping JSON simple here
            with open(summary_path, "w", encoding="utf-8") as f:
                import json
                json.dump(summary, f)
        except Exception:
            pass

        return {
            "message": "Issue detection complete.",
            "download": "/download-issues",
            "summary_download": "/download-issues-summary"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue detection failed: {str(e)}")

@app.get("/download-issues")
async def download_issues():
    path = "data_issues.xlsx"
    if os.path.exists(path):
        return FileResponse(
            path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="data_issues.xlsx"
        )
    raise HTTPException(status_code=404, detail="Issues file not found.")

@app.get("/download-issues-summary")
async def download_issues_summary():
    path = "data_issues.json"
    if os.path.exists(path):
        return FileResponse(path, media_type="application/json", filename="data_issues.json")
    raise HTTPException(status_code=404, detail="Issues summary not found.")

# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    log_action(db, user.id, "login", request=None)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=UserSchema)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_action(db, db_user.id, "register", {"username": user.username})
    return db_user

@app.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Project management endpoints
@app.post("/projects", response_model=ProjectSchema)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_project = Project(
        name=project.name,
        description=project.description,
        config=project.config,
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    log_action(db, current_user.id, "create_project", {"project_id": db_project.id, "project_name": project.name})
    return db_project

@app.get("/projects", response_model=List[ProjectSchema])
async def get_projects(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return projects

@app.get("/projects/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/projects/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    log_action(db, current_user.id, "update_project", {"project_id": project_id, "changes": update_data})
    return project

# Admin endpoints
@app.get("/admin/users", response_model=List[UserSchema])
async def get_all_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return users

@app.get("/admin/logs", response_model=List[LogSchema])
async def get_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    logs = db.query(Log).offset(skip).limit(limit).order_by(Log.created_at.desc()).all()
    return logs

@app.get("/admin/stats")
async def get_admin_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_projects = db.query(Project).count()
    total_logs = db.query(Log).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_projects": total_projects,
        "total_logs": total_logs
    }
