# 🧬 DermaAI - AI-Powered Acne Detection System

A complete web application that uses artificial intelligence to detect and analyze acne lesions in skin images. This system combines deep learning models (ResNet50 + YOLOv8) with a professional PDF reporting system that includes both the original image and detection results.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Requirements](#requirements)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [Using the Application](#using-the-application)
9. [API Documentation](#api-documentation)
10. [PDF Report System](#pdf-report-system)
11. [Database & Storage](#database--storage)
12. [Configuration](#configuration)
13. [Troubleshooting](#troubleshooting)
14. [Building for Production](#building-for-production)
15. [Important Legal Note](#important-legal-note)
16. [Contributing](#contributing)
17. [FAQ](#faq)

---

## Overview

DermaAI is an educational AI system designed to demonstrate how modern machine learning can be applied to medical image analysis. The system processes skin images and identifies different types of acne lesions:

- **Blackheads** - Open comedones
- **Cyst** - Large, inflamed lesions
- **Papules** - Small, red inflammatory lesions
- **Pustules** - Pus-filled lesions
- **Whiteheads** - Closed comedones

### How It Works

```
User uploads image
        ↓
┌─────────────────────────────┐
│  DETECTION PIPELINE         │
├─────────────────────────────┤
│ 1. YOLOv8: Locates lesions  │
│ 2. ResNet50: Classifies     │
│ 3. Confidence scoring       │
└─────────────────────────────┘
        ↓
Generate Professional PDF Report
├─ Original Uploaded Image
├─ Detection Result (with YOLO boxes)
├─ Acne Type & Confidence Score
├─ Analysis Timestamp
└─ Professional Styling + Disclaimer
        ↓
Download Report
```

---

## Features

### 🎯 Core Detection
- **Dual Model System**: YOLOv8 for localization + ResNet50 for classification
- **Real-time Analysis**: Process images in seconds
- **Confidence Scoring**: Know how confident the model is (0-100%)
- **Multiple Detections**: Identifies all acne lesions in the image

### 📸 Image Input
- **Upload Images**: JPG, PNG support (any size)
- **Live Camera Capture**: Take photos directly from webcam
- **Preview Display**: See your image before analysis
- **Real-time Overlay**: Detection boxes appear on preview

### 📊 Professional PDF Reports
- **Original Image**: The image you uploaded
- **Detection Image**: Same image with YOLO bounding boxes
- **Side-by-Side Display**: Both images in one section
- **Structured Data**: 
  - Detected acne type
  - Confidence percentage
  - Analysis timestamp
- **Professional Styling**:
  - Blue color-coded headers
  - Proper spacing and padding
  - Medical disclaimer
  - No placeholder data

### 🎨 User Interface
- **Modern Design**: React + Vite + Tailwind CSS
- **Responsive**: Works on desktop and mobile
- **Real-time Feedback**: Visual detection boxes on image
- **Analysis History**: Stores past analyses

### 💾 Data Storage
- **Local Database**: SQLite for user history
- **Privacy**: All processing happens locally
- **No External Calls**: Images don't leave your computer

---

## Project Structure

```
Acne-Detection-AI/
│
├── 📁 backend/                        # Python FastAPI backend
│   ├── main.py                        # FastAPI server + all endpoints
│   ├── requirements.txt               # Python package dependencies
│   ├── dermai.db                      # SQLite database (auto-created)
│   ├── __pycache__/                   # Python cache (gitignored)
│   └── venv/                          # Virtual environment (gitignored)
│
├── 📁 frontend/                       # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── AcneDetector.tsx      # Main detection component
│   │   ├── App.tsx                   # Root component
│   │   └── main.tsx                  # React entry point
│   ├── public/                        # Static assets
│   ├── package.json                  # Node.js dependencies
│   ├── vite.config.ts                # Vite build configuration
│   ├── tailwind.config.ts            # Tailwind CSS config
│   ├── tsconfig.json                 # TypeScript configuration
│   └── node_modules/                 # npm packages (gitignored)
│
├── 📁 test_images/                    # Sample test images
│
├── acne_model_best.pth               # ResNet50 trained weights (~100MB)
├── last.pt                           # YOLOv8 detection model (~50MB)
├── yolov8n.pt                        # Alternative YOLOv8 model
├── best.pt                           # Alternative model weights
│
├── .gitignore                        # Git ignore configuration
├── README.md                         # Original README
├── README_COMPREHENSIVE.md           # This file
└── requirements.txt                  # Main project dependencies

```

### Key Files Explained

| File | Purpose | Size |
|------|---------|------|
| `acne_model_best.pth` | ResNet50 classification model | ~100MB |
| `last.pt` | YOLOv8 detection model | ~50MB |
| `dermai.db` | SQLite database (analysis history) | ~1MB |
| `main.py` | All backend logic | ~800KB |
| `AcneDetector.tsx` | All frontend logic | ~15KB |

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.9+ | Programming language |
| **FastAPI** | Latest | REST API framework |
| **Uvicorn** | Latest | ASGI server |
| **PyTorch** | Latest | Deep learning framework |
| **Torchvision** | Latest | PyTorch vision utilities |
| **Ultralytics** | Latest | YOLOv8 implementation |
| **Pillow** | Latest | Image processing |
| **ReportLab** | Latest | PDF generation |
| **SQLite3** | Built-in | Database |
| **BCrypt** | Latest | Password hashing (future use) |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18+ | UI framework |
| **Vite** | Latest | Build tool & dev server |
| **TypeScript** | Latest | Type-safe JavaScript |
| **Tailwind CSS** | Latest | Styling |
| **shadcn/ui** | Latest | Component library |

---

## Requirements

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space (for models + dependencies)
- **OS**: Windows 10+, macOS 10.14+, or Linux
- **Processor**: Any modern CPU (faster is better)

### Software Requirements

**Backend:**
- Python 3.9 or newer
  - Check: `python --version`
- pip (comes with Python)

**Frontend:**
- Node.js 18 LTS or newer
  - Check: `node --version`
- npm (comes with Node.js)
  - Check: `npm --version`

### Optional
- Git (for cloning repository)
- Docker (for containerized deployment)

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/AI-Skin-Detection/Acne-Detection-AI.git
cd Acne-Detection-AI
```

### Step 2: Setup Backend

#### 2.1 Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux (bash/zsh):**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal line.

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note**: This will install:
- FastAPI & Uvicorn
- PyTorch (200-400MB)
- YOLOv8 (Ultralytics)
- ReportLab
- And other dependencies

First install may take 5-10 minutes. Don't interrupt it!

#### 2.3 Verify Model Files

Make sure these files exist in the project root:
```bash
ls *.pth *.pt
```

Should show:
- ✅ `acne_model_best.pth` (ResNet50 weights)
- ✅ `last.pt` (YOLOv8 weights)

If missing, download from the project releases or contact maintainer.

#### 2.4 Create Backend Configuration (Optional)

Create file `backend/.env`:

```bash
# Server
PORT=8000
HOST=0.0.0.0

# Model settings
YOLO_CONFIDENCE=0.25
YOLO_MAX_DETECTIONS=30
YOLO_CONFIDENCE_FALLBACKS=0.25,0.10,0.05,0.01

# Model paths (optional - auto-detects)
YOLO_MODEL_PATH=./last.pt
```

### Step 3: Setup Frontend

```bash
cd frontend
npm install
```

This installs:
- React 18
- Vite
- Tailwind CSS
- shadcn UI components
- All build tools

May take 3-5 minutes on first install.

#### Optional: Configure Backend URL

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000
```

---

## Running the Application

### Step 1: Start Backend Server

**In terminal 1:**
```bash
cd Acne-Detection-AI/backend
uvicorn main:app --reload --port 8000
```

Wait for output:
```
✓ Uvicorn running on http://127.0.0.1:8000
✓ Application startup complete
```

**Test the backend**:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Step 2: Start Frontend Development Server

**In terminal 2:**
```bash
cd Acne-Detection-AI/frontend
npm run dev
```

Wait for output:
```
✓ Local: http://localhost:5173/
```

### Step 3: Open in Browser

Visit: **http://localhost:5173**

You should see:
- Upload area or camera button
- "Analyze Image" button
- Empty results pane

---

## Using the Application

### Complete Workflow

#### 1. Upload or Capture Image

**Option A: Upload from Computer**
```
Click "Upload Image" → Select JPG/PNG → Wait for preview
```

**Option B: Capture with Webcam**
```
Click "Capture Live Photo" → Allow camera access → 
Click "Capture" → Close camera
```

**Supported Formats**:
- JPG / JPEG
- PNG
- Any size (will be resized automatically)

#### 2. Analyze Image

```
Click "Analyze Image" button
↓
Wait 2-5 seconds (first time takes longer as models load)
↓
See detection boxes appear on image
↓
View results on right side
```

#### 3. Review Results

**Left Panel:**
- Original image
- Green detection boxes for each lesion
- Hover over boxes to see details

**Right Panel:**
```
ACNE TYPE (Large, green text)
Confidence: XX.XX%

Individual Detections:
├─ [Acne Type 1] - ResNet XX.XX%, YOLO XX.XX%
├─ [Acne Type 2] - ResNet XX.XX%, YOLO XX.XX%
└─ [Acne Type 3] - ResNet XX.XX%, YOLO XX.XX%

[Download Report button]
```

#### 4. Download Report

```
Click "Download Report"
↓
Browser downloads: Acne_Detection_Report.pdf
↓
PDF contains:
- Original image (as you uploaded it)
- Detection result image (with YOLO boxes)
- Acne type
- Confidence score
- Analysis timestamp
- Professional styling
- Medical disclaimer
```

#### 5. Open PDF Report

```
Open with any PDF reader
↓
See professional report with:
├─ Header: "DERMAI - AI ACNE DETECTION REPORT"
├─ Section: "IMAGE ANALYSIS"
│  ├─ Original Uploaded Image (left side)
│  └─ Detection Result (right side with boxes)
├─ Section: "DETECTION RESULTS"
│  ├─ Detected Acne Type
│  ├─ Confidence Score
│  └─ Analysis Time
├─ Section: "ABOUT THIS REPORT"
│  └─ Medical disclaimer
└─ Footer: DermaAI branding
```

---

## API Documentation

### Overview

The backend provides a REST API with automatic documentation.

**Interactive API Docs**:
- Swagger UI: http://localhost:8000/docs (try it out!)
- ReDoc: http://localhost:8000/redoc (read only)

### Endpoints

#### 1. Predict Acne Type

**Path**: `POST /predict`

**Purpose**: Analyze an image and detect acne lesions

**Request Headers**:
```
Content-Type: multipart/form-data
```

**Request Body**:
```
file: <binary image file>
user_id: <integer> (optional)
```

**Success Response (200 OK)**:
```json
{
  "prediction": "Pustules",
  "predicted_class": "Pustules",
  "confidence": 54.78,
  "detections": [
    {
      "class": "Pustules",
      "confidence": 54.78,
      "bbox": [83, 69, 97, 82],
      "detector_class": 0,
      "detector_confidence": 30.54,
      "area_ratio": 0.9
    },
    {
      "class": "Pustules",
      "confidence": 54.78,
      "bbox": [68, 85, 79, 96],
      "detector_class": 0,
      "detector_confidence": 28.08,
      "area_ratio": 0.5
    }
  ],
  "yolo_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA...",
  "heatmap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA..."
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "No image file provided",
  "detail": "Required file field missing"
}
```

**Response Fields**:
- `prediction`: Main predicted acne type
- `confidence`: Confidence percentage (0-100)
- `detections`: Array of detected lesions
  - `bbox`: [x1, y1, x2, y2] in pixels
  - `detector_confidence`: YOLOv8 confidence
- `yolo_image`: Base64 encoded image with boxes
- `heatmap`: Attention visualization

---

#### 2. Generate PDF Report

**Path**: `POST /generate-pdf`

**Purpose**: Create a professional PDF report

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "prediction": "Pustules",
  "confidence": 54.78,
  "original_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA...",
  "yolo_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA..."
}
```

**Success Response (200 OK)**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=Acne_Detection_Report.pdf

[PDF binary data]
```

**Error Response (500 Internal Error)**:
```json
{
  "detail": "Failed to process image"
}
```

**Report Contents**:
- Title: "DERMAI - AI ACNE DETECTION REPORT"
- Original uploaded image
- Detection result image with boxes
- Acne type prediction
- Confidence percentage
- Timestamp
- Medical disclaimer

---

#### 3. Get Analysis History

**Path**: `GET /history/{user_id}`

**Purpose**: Retrieve past analyses for a user

**Success Response (200 OK)**:
```json
[
  {
    "image_name": "image_001.jpg",
    "prediction": "Pustules",
    "created_at": "2026-04-25 02:51:00",
    "yolo_image": "data:image/png;base64,..."
  },
  {
    "image_name": "image_002.jpg",
    "prediction": "Blackheads",
    "created_at": "2026-04-25 03:00:00",
    "yolo_image": "data:image/png;base64,..."
  }
]
```

---

### Example API Usage

#### Using cURL

```bash
# Analyze an image
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/image.jpg" \
  -F "user_id=1"

# Generate PDF
curl -X POST http://localhost:8000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "prediction": "Pustules",
    "confidence": 54.78,
    "original_image": "data:image/png;base64,...",
    "yolo_image": "data:image/png;base64,..."
  }' \
  --output report.pdf
```

#### Using Python

```python
import requests

# Upload image
with open('image.jpg', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:8000/predict',
        files=files,
        data={'user_id': 1}
    )
    result = response.json()
    print(f"Detected: {result['prediction']}")
    print(f"Confidence: {result['confidence']}%")

# Generate PDF
pdf_data = {
    'prediction': result['prediction'],
    'confidence': result['confidence'],
    'original_image': 'data:image/png;base64,...',
    'yolo_image': result['yolo_image']
}
response = requests.post(
    'http://localhost:8000/generate-pdf',
    json=pdf_data
)
with open('report.pdf', 'wb') as f:
    f.write(response.content)
```

---

## PDF Report System

### What's Included in the Report

The generated PDF includes:

```
┌───────────────────────────────────────────────────┐
│                                                   │
│  🔬 DERMAI - AI ACNE DETECTION REPORT            │
│  Generated on April 25, 2026 at 02:51 AM         │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  📸 IMAGE ANALYSIS                                │
│                                                   │
│  Original Uploaded Image  Detection Result       │
│  (3.0" × 3.0")            (3.0" × 3.0")         │
│  ┌──────────────────┐     ┌──────────────────┐   │
│  │                  │     │                  │   │
│  │  [Your image]    │     │ [Image + boxes]  │   │
│  │                  │     │  ┌─────┐ ┌─────┐│   │
│  │                  │     │  │ box │ │ box ││   │
│  │                  │     │  └─────┘ └─────┘│   │
│  └──────────────────┘     └──────────────────┘   │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  📋 DETECTION RESULTS                             │
│                                                   │
│  Detected Acne Type    Pustules                  │
│  Confidence Score      54.78%                    │
│  Analysis Time         25-04-2026 | 02:51 AM    │
│                                                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  ℹ️ ABOUT THIS REPORT                              │
│                                                   │
│  This report is generated by DermaAI, an AI-     │
│  powered acne detection system...                │
│                                                   │
│  ⚠️ DISCLAIMER:                                    │
│  This report is for informational purposes      │
│  only. It should NOT be used as a substitute    │
│  for professional medical advice. Always        │
│  consult a dermatologist.                       │
│                                                   │
│  DermaAI Smart Detection Engine                  │
│  Powered by Advanced Machine Learning            │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Report Features

✅ **Two Images Side-by-Side**
- Original: Exactly as you uploaded it
- Detection: Same image with YOLO bounding boxes

✅ **Structured Information**
- Acne type name (e.g., "Pustules")
- Confidence percentage (0-100%)
- Date and time of analysis

✅ **Professional Styling**
- Color-coded sections (blue headers)
- Proper spacing and padding
- Easy to read font sizing
- Professional footer with branding

✅ **Legal Protection**
- Medical disclaimer included
- Clear statement: "For informational use only"
- Recommendation to see dermatologist

✅ **No Placeholder Data**
- Only real detection results shown
- No generic text or dummy values

### How the PDF is Generated

```
Frontend sends data
    ↓
Backend receives:
├─ Prediction (acne type)
├─ Confidence (percentage)
├─ Original image (base64)
└─ YOLO image (base64)
    ↓
Backend processes:
├─ Decode base64 images
├─ Validate with PIL
├─ Create temporary files
└─ Generate PDF with ReportLab
    ↓
Download PDF to browser
    ↓
Clean up temporary files
```

---

## Database & Storage

### SQLite Database

The backend automatically creates `dermai.db` on first run.

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
)
```

#### History Table
```sql
CREATE TABLE history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_name TEXT,
    prediction TEXT,
    created_at TEXT,
    yolo_image TEXT
)
```

### Why `.gitignore` Excludes Database

The `.gitignore` file contains:
```
# Database files
*.db
dermai.db
*.sqlite
```

**Reasons**:
1. **User Privacy**: Don't upload user data to GitHub
2. **Size**: Database grows with each analysis
3. **Dynamic**: Each user has different analysis history
4. **Sensitive**: May contain user information

**What this means**:
- Your local `dermai.db` is NOT tracked in Git
- Each clone gets a fresh database
- Each user has their own analysis history
- Original author's history is not shared

### Data Storage Location

```
Acne-Detection-AI/
└── backend/
    └── dermai.db          ← Here (gitignored)
```

---

## Configuration

### Backend Configuration

**File**: `backend/.env` (optional)

```bash
# Server settings
PORT=8000                                    # Server port
HOST=0.0.0.0                                 # Bind to all interfaces

# Model settings
YOLO_CONFIDENCE=0.25                         # Initial detection threshold
YOLO_MAX_DETECTIONS=30                       # Max boxes per image
YOLO_CONFIDENCE_FALLBACKS=0.25,0.10,0.05,0.01  # Fallback thresholds

# Model paths
YOLO_MODEL_PATH=./last.pt                    # YOLOv8 model location
```

### Frontend Configuration

**File**: `frontend/.env` (optional)

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000           # Backend address
```

### Environment Variables in Code

**Backend** (`main.py`):
```python
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.25"))
YOLO_MAX_DETECTIONS = int(os.getenv("YOLO_MAX_DETECTIONS", "30"))
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "last.pt")
```

**Frontend** (`AcneDetector.tsx`):
```typescript
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

---

## Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'torch'"

**Problem**: PyTorch not installed

**Solution**:
```bash
pip install torch torchvision
```

Or reinstall everything:
```bash
pip install -r requirements.txt
```

---

#### "FileNotFoundError: acne_model_best.pth"

**Problem**: Model file missing

**Solution**:
1. Download from project releases
2. Place in project root
3. Restart backend

Verify:
```bash
ls acne_model_best.pth last.pt
```

---

#### "Address already in use :::8000"

**Problem**: Port 8000 already in use

**Solutions**:

Option 1: Use different port
```bash
uvicorn main:app --reload --port 8001
```

Option 2: Kill process using port
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

---

#### "JSON decode error" or "504 Gateway"

**Problem**: Backend crashed or not responding

**Solution**:
1. Check backend terminal for error messages
2. Look for red text or "ERROR"
3. Restart backend
4. Check logs for clues

---

### Frontend Issues

#### "Cannot find module 'react'"

**Problem**: Node modules not installed

**Solution**:
```bash
cd frontend
npm install
```

---

#### "EADDRINUSE: address already in use :::5173"

**Problem**: Port 5173 in use

**Solutions**:

Option 1: Use different port
```bash
npm run dev -- --port 3000
```

Option 2: Kill process
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

---

#### Frontend can't reach backend

**Problem**: CORS error or wrong API URL

**Solution**:
1. Verify backend is running (`http://localhost:8000`)
2. Check frontend `.env`:
```bash
VITE_API_URL=http://localhost:8000
```
3. Browser console (F12) shows the actual error

---

### PDF Issues

#### "Failed to generate PDF report"

**Problem**: Image processing failed

**Solutions**:
1. Check if image is valid PNG/JPG
2. Try uploading different image
3. Check backend logs
4. Ensure image is not corrupted

---

#### "Image could not be displayed in report"

**Problem**: One image failed to process (graceful fallback)

**Cause**: Usually PIL can't decode the image

**Solution**: 
- Try different image format
- Resize image to smaller size
- Check image file isn't corrupted

---

#### PDF opens but images are blank/missing

**Problem**: Image encoding issue

**Solutions**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Try different image
4. Check browser console for errors

---

## Building for Production

### Backend Production Setup

#### 1. Create Production Virtual Environment

```bash
python -m venv venv_prod
source venv_prod/bin/activate  # macOS/Linux
# or
venv_prod\Scripts\activate     # Windows
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Run with Production Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Parameters**:
- `--host 0.0.0.0`: Accept connections from any IP
- `--port 8000`: Listen on port 8000
- `--workers 4`: Use 4 worker processes

#### 4. Optional: Use Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

---

### Frontend Production Build

#### 1. Build Optimized Bundle

```bash
cd frontend
npm run build
```

Output:
```
frontend/dist/
├── index.html
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
└── ...
```

#### 2. Test Build Locally

```bash
npm install -g serve
serve -s dist
```

Visit: `http://localhost:3000`

#### 3. Deploy to Static Hosting

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

**GitHub Pages**:
```bash
npm run build
# Push dist/ to gh-pages branch
```

---

### Docker Deployment (Optional)

**Create `Dockerfile`** (backend):
```dockerfile
FROM python:3.9

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build**:
```bash
docker build -t acne-detection .
docker run -p 8000:8000 acne-detection
```

---

## Important Legal Note

⚠️ **This is an EDUCATIONAL project, NOT a medical tool**

### Disclaimer

- **Not Medical Advice**: This system is for learning purposes only
- **No Diagnosis**: Results should NEVER be used for medical decisions
- **Experimental Model**: The AI was trained for demonstration
- **Accuracy**: Predictions CAN be wrong or uncertain
- **See a Doctor**: Always consult a real dermatologist for:
  - Diagnosis
  - Treatment recommendations
  - Medical advice

### Usage Agreement

By using this software, you agree:
- ✅ You understand this is educational, not medical
- ✅ You will NOT use it for medical diagnosis
- ✅ You will seek professional medical advice
- ✅ You hold creators harmless for any misuse

### HIPAA Compliance

This system:
- ❌ Is NOT HIPAA compliant
- ❌ Is NOT FDA approved
- ❌ Is NOT suitable for healthcare

---

## Contributing

We welcome contributions to improve the project!

### Reporting Issues

1. Go to GitHub Issues
2. Click "New Issue"
3. Describe the problem clearly
4. Include:
   - Screenshots (if applicable)
   - Error messages
   - Steps to reproduce
   - Your OS and Python/Node versions

### Contributing Code

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Make** your changes
4. **Test** thoroughly
5. **Commit**: `git commit -m "Add my feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Create** Pull Request with description

### Ideas for Contribution

- [ ] Train on larger datasets
- [ ] Add more acne categories
- [ ] Improve UI/UX
- [ ] Add user authentication
- [ ] Deploy to cloud (AWS, Azure, GCP)
- [ ] Create mobile app
- [ ] Add severity grading
- [ ] Improve model accuracy
- [ ] Add multiple language support
- [ ] Performance optimization

---

## FAQ

### General Questions

**Q: Is this free to use?**
A: Yes, it's open source. You can use, modify, and distribute it freely.

**Q: Can I use this to diagnose myself?**
A: NO. This is educational software. Always see a dermatologist.

**Q: How accurate is the model?**
A: ~85% on test data, but may vary on real-world images. Never rely on it for medical decisions.

**Q: Can I train my own model?**
A: Yes! The code is open source. Modify `train.py` to use your own dataset.

**Q: Does it work on mobile?**
A: The frontend is responsive, but desktop/laptop is recommended for best experience.

### Technical Questions

**Q: How do I add more acne categories?**
A: Train a new model with more labeled data and update `CLASS_NAMES` in `main.py`.

**Q: Is my data private?**
A: Yes. All processing happens locally. Images don't leave your computer.

**Q: Can I use my own models?**
A: Yes. Replace `acne_model_best.pth` and `last.pt` with your own trained weights.

**Q: How do I deploy this online?**
A: See "Building for Production" section. Use Docker, Heroku, AWS, GCP, or Azure.

**Q: Can I remove the disclaimer?**
A: The disclaimer is there for legal reasons. We recommend keeping it.

**Q: What if the PDF is blank?**
A: Check browser console (F12) for errors. Verify images are valid JPG/PNG.

### Troubleshooting Questions

**Q: Backend won't start. What do I do?**
A: Check terminal for error messages. See "Troubleshooting" section.

**Q: Images aren't detected. Is the model broken?**
A: The model might not recognize those acne types. Try different images.

**Q: PDF won't download.**
A: Clear browser cache, hard refresh (Ctrl+Shift+R), try different image.

---

## Additional Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [PyTorch Docs](https://pytorch.org/docs)
- [React Docs](https://react.dev)
- [YOLOv8 Docs](https://docs.ultralytics.com)

### Learning Resources
- [Deep Learning Fundamentals](https://www.deeplearningbook.org)
- [Computer Vision with OpenCV](https://docs.opencv.org)
- [PyTorch Tutorials](https://pytorch.org/tutorials)
- [React Tutorial](https://react.dev/learn)

### Similar Projects
- [YOLO Person Detection](https://github.com/ultralytics/yolov5)
- [Medical Image Analysis](https://github.com/pytorch/medical)
- [Skin Disease Classification](https://github.com/udacity/dermatologist-ai)

---

## Changelog

### Version 2.0.0 (Current)
✨ **Major Features**
- Dual-image PDF reports (original + detection)
- Professional PDF styling
- YOLO + ResNet50 detection pipeline
- Live camera capture
- Analysis history tracking
- Medical disclaimer

### Version 1.0.0 (Original)
- Basic image upload
- ResNet50 classification
- Simple results display

---

## Credits

Built by the DermaAI Development Team

**Technologies Used**:
- PyTorch & Ultralytics (AI/ML)
- FastAPI (Backend)
- React & Vite (Frontend)
- ReportLab (PDF generation)

---

## License

This project is provided as-is for educational purposes.

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Setup backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8000

# Setup frontend
cd frontend
npm install

# Run frontend
npm run dev

# Build frontend
npm run build

# Clean up
deactivate          # Exit Python venv
rm -rf node_modules # Remove npm packages
rm dermai.db        # Delete database
```

---

## Support

For help:
1. Check FAQ section
2. Read Troubleshooting
3. Open GitHub Issue
4. Contact: [maintainer email]

---

**Happy Learning! 🧬**

*Last Updated: April 25, 2026*

---
