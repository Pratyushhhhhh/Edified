@echo off
REM start_rag.bat — starts the Python RAG FastAPI server
REM Run this from the Edified/ root directory.
REM Prerequisites: pip install -r rag/requirements.txt

echo.
echo ========================================
echo   The Edified — RAG Server
echo   http://localhost:8000
echo ========================================
echo.
echo Step 1: Ingesting news clusters into ChromaDB...
python -m rag.ingest
if errorlevel 1 (
    echo [ERROR] Ingestion failed. Check MONGO_URI in scraperv2/.env
    pause
    exit /b 1
)
echo.
echo Step 2: Starting FastAPI RAG server on port 8000...
python -m uvicorn rag.api:app --host 0.0.0.0 --port 8000 --reload

