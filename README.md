## 🧬 AI Acne Detection System

This is a simple student project where we built an AI‑powered web app that can look at a skin image and guess what type of acne it might be. Behind the scenes it uses a ResNet50 model trained in PyTorch, a FastAPI backend for inference, and a React/Vite frontend for the user interface.

The goal of the project is to practice:

- Training and using a deep learning model (PyTorch)
- Building a small REST API with FastAPI
- Creating a modern frontend with React, Vite, Tailwind and shadcn UI

---

## 📂 Project Structure

```bash
Acne-Detection-AI/
├── acne_model_best.pth        # Trained ResNet50 weights (5 acne classes)
├── main.py                    # FastAPI backend (image upload + /predict)
├── acne_backend.py            # Model utilities / CLI-style script (optional)
├── requirements.txt           # Python dependencies
├── frontend/                  # React + Vite + Tailwind + shadcn UI
└── test_images/               # Sample images (optional)
```

---

## 🧠 Model Overview

- Framework: PyTorch
- Architecture: ResNet50
- Output classes: `Blackheads`, `Cyst`, `Papules`, `Pustules`, `Whiteheads`
- Input size: 224×224 RGB image

The trained weights are stored in `acne_model_best.pth` in the project root. The backend loads this file when it starts and keeps the model in memory so predictions are fast.

---

## 🌐 Backend – FastAPI (main.py)

The backend is a small FastAPI app that exposes one main endpoint:

- File: `main.py`
- Endpoint: `POST /predict`
- Request: image file in `multipart/form-data` with the field name `file`
- Response (example):

```json
{
   "predicted_class": "Papules",
   "confidence": 87.3
}
```

FastAPI loads the ResNet50 model, resizes the incoming image to 224×224, runs a forward pass, and returns the predicted class plus a confidence score in percent.

---

## 🖥️ Frontend – React + Vite (frontend/)

The frontend is a single‑page application built with React and Vite. It uses Tailwind CSS and shadcn UI components to give the project a modern look.

What the frontend lets you do:

- Upload a JPG or PNG skin image
- See a scanning/analysis animation while the backend is working
- View the predicted acne type and confidence bar

The main logic for this lives in `frontend/src/components/AcneDetector.tsx`. That component:

- Reads the image the user selected
- Sends it to the FastAPI backend as `file` using `POST /predict`
- Shows the result and a short description of the predicted acne type

---

## 🧰 What You Need (Windows / macOS / Linux)

Backend:

- Python 3.9 or newer
- pip (Python package manager)
- PyTorch (CPU is fine for this project)

Frontend:

- Node.js 18+ (LTS) and npm

The project has been kept as simple as possible so it can run on common student laptops on any OS.

---

## 🔧 Setting Up the Backend

These steps are the same idea on Windows, macOS and Linux. Only the virtual environment command changes slightly.

### 1. Get the code

```bash
git clone https://github.com/AI-Skin-Detection/Acne-Detection-AI.git
cd Acne-Detection-AI
```

### 2. Create and activate a virtual environment (recommended)

**Windows (PowerShell):**

```powershell
python -m venv venv
./venv/Scripts/Activate.ps1
```

**macOS / Linux (bash/zsh):**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

Depending on your hardware and OS, you can also follow the official PyTorch install guide (https://pytorch.org) first and then install the remaining packages from `requirements.txt`.

### 4. Make sure the model file is in place

Check that `acne_model_best.pth` is in the same folder as `main.py`. Without this file the backend won’t be able to load the model.

### 5. Start the FastAPI server

```bash
uvicorn main:app --reload --port 8000
```

You should now have the API running at `http://localhost:8000`.

---

## 💻 Setting Up the Frontend

From the project root:

```bash
cd frontend
npm install
```

### Optional: point the frontend to a custom backend URL

By default, the frontend will try to reach:

- `import.meta.env.VITE_API_URL` if it is set
- otherwise `http://localhost:8000`

To be explicit, you can create a `.env` file in `frontend/`:

```bash
VITE_API_URL=http://localhost:8000
```

### Run the frontend in development mode

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:8080`). Open that in your browser. With both the backend and frontend running you can:

1. Open the frontend URL.
2. Upload a skin image.
3. Click **Analyze Image** and wait for the prediction.

### Build the frontend for production

```bash
npm run build
```

This creates an optimized build in `frontend/dist/` that you can host on any static file server.

---

## ⚠️ Important Note (Not Medical Advice)

This is a **student project**, not a medical tool.

- The model was trained for experimentation and learning.
- The predictions can be wrong or uncertain.
- Do **not** use this app to make decisions about your health.
- Always talk to a real dermatologist or doctor for diagnosis and treatment.

---

## 📄 Using or Extending This Project

You are welcome to use this code for learning or as a base for your own experiments. If you share or fork it, keeping a short note that it started as a student project is appreciated.

Ideas for improvement:

- Train on a larger and more diverse dataset
- Add more acne categories or severity levels
- Improve the UI and add history of past analyses
- Deploy the app to a cloud platform

If you find bugs or have suggestions, feel free to open an issue or a pull request.