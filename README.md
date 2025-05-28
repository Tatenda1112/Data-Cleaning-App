# Data-Cleaning-App
Data Cleaning 




# 🔧 Data-Cleaning-App

**Data-Cleaning-App** is a full-stack, customizable data preprocessing platform built with **React** and **FastAPI**. It empowers users to upload raw datasets, apply data cleaning operations, and download transformed versions — all through an intuitive interface.

> ⚠️ **Status**: This project is a **Work in Progress** (currently **30% complete**) and will continuously evolve. Future versions will include:
>
> - 📊 **Interactive Data Visualization**
> - 📈 **Data Quality and Performance Metrics**
> - 🤖 **Machine Learning Task Integration** (e.g., anomaly detection, classification, feature engineering)

---

## 🌟 Features (Phase 1)

- Upload CSV or Excel datasets
- Apply custom data transformers:
  - Missing values detection
  - Numeric conversion
  - Date conversion
  - Duplicate ID detection
  - ID validation
  - Mandatory column checks
  - Column selection/filtering
  - Year range filters and comparators
  - Whitespace/case cleaning
- Download cleaned or issues-detected versions of the data
- RESTful API with full Swagger documentation

---

## 🖥️ Web Interface

### 💡 Transformer Configuration Panel (React Frontend)
![frontend](https://github.com/user-attachments/assets/c65e8b5c-b695-401a-a9ae-3f0d03c8a367)

### ⚙️ FastAPI Swagger API Endpoints
![backend](https://github.com/user-attachments/assets/1d7f9b49-ccad-4850-94dc-0ac0aa88f5b8)

> Make sure these images exist in your project:
> - `frontend_app/public/transformer_ui.png`
> - `frontend_app/public/api_docs.png`

---

## 🔧 Technologies Used

### Frontend
- React.js
- Material-UI (MUI)
- Tailwind CSS
- Axios

### Backend
- FastAPI
- Pydantic
- Pandas

---

## 📦 Setup Instructions

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # For Windows
pip install -r requirements.txt
uvicorn main:app --reload
