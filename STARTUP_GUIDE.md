# 🚀 DatViz Startup Guide

## Step 1: Start Backend

Open **Terminal/Command Prompt** in the project directory and run:

```bash
# Install dependencies (first time only)
pip install -r requirements.txt

# Start backend server
python start_backend.py
```

**Expected output:**
```
🚀 Starting DatViz Backend...
Installing dependencies...
Starting FastAPI server...
Backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs
```

## Step 2: Start Frontend

Open **another Terminal/Command Prompt** and run:

```bash
cd frontend_app
npm install
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view frontend_app in the browser.
Local:            http://localhost:3000
```

## Step 3: Access the Application

1. **Open browser** and go to: `http://localhost:3000`
2. **Login with admin account:**
   - Username: `admin`
   - Password: `admin123`
3. **OR create new account** using the "Sign up" link

## 🔧 Troubleshooting

### Backend Issues:
- **Port 8000 already in use**: Kill the process or change port
- **Module not found**: Run `pip install -r requirements.txt`
- **Database error**: Delete `dataviz.db` and restart

### Frontend Issues:
- **Port 3000 already in use**: React will ask to use another port
- **Cannot connect to backend**: Make sure backend is running on port 8000
- **CORS errors**: Backend has CORS enabled for all origins

### Registration Issues:
- **"Registration failed"**: Check browser console for detailed error
- **"Username already registered"**: Try a different username
- **"Email already registered"**: Try a different email

## 📊 Testing the System

1. **Create a new project**
2. **Upload a CSV file** (any data file)
3. **Run data checks**
4. **Download the reports**

## 🆘 Need Help?

- Check browser console (F12) for errors
- Check backend terminal for error messages
- Visit `http://localhost:8000/docs` for API documentation
