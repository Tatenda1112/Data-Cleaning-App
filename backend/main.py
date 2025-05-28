from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import io
import os
from pipeline import create_pipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransformerConfig(BaseModel):
    transformer_name: str
    config: Dict[str, Any]

class BatchTransformerConfig(BaseModel):
    transformers: List[TransformerConfig]

data = None
transformer_configs = {}

def clear_old_files():
    for file_name in ["cleaned_data.xlsx", "data_issues.xlsx"]:
        if os.path.exists(file_name):
            os.remove(file_name)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global data
    clear_old_files()
    contents = await file.read()

    if not file.filename.endswith(('.csv', '.xlsx', '.parquet')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, XLSX, or Parquet.")

    try:
        if file.filename.endswith('.csv'):
            data = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        elif file.filename.endswith('.xlsx'):
            data = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.parquet'):
            data = pd.read_parquet(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    return {"message": "File uploaded successfully.", "columns": data.columns.tolist()}

@app.get("/fetch-data")
async def fetch_data():
    global data
    if data is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet.")
    return {"columns": data.columns.tolist(), "preview": data.head(5).to_dict(orient="records")}

@app.post("/process-data")
async def process_data(request: BatchTransformerConfig):
    global data
    if data is None:
        raise HTTPException(status_code=400, detail="No data uploaded.")

    transformer_configs = {t.transformer_name: t.config for t in request.transformers}
    pipeline = create_pipeline(transformer_configs)

    try:
        processed_data = pipeline.fit_transform(data)
        processed_data.to_excel("cleaned_data.xlsx", index=False)
        return {"message": "Data processed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data processing failed: {str(e)}")

@app.get("/download-cleaned")
async def download_cleaned():
    file_path = "cleaned_data.xlsx"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    else:
        raise HTTPException(status_code=404, detail="Cleaned data file not found.")

@app.get("/download-issues")
async def download_issues():
    file_path = "data_issues.xlsx"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    else:
        raise HTTPException(status_code=404, detail="Data issues file not found.")