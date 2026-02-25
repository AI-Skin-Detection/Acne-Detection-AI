# Frontend – AI Acne Detection

This folder contains the React/Vite frontend for the AI Acne Detection System. It provides the UI for uploading skin images and displaying predictions from the FastAPI backend.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (Radix-based components)

## Development

From the project root:

```bash
cd frontend
npm install
npm run dev
```

By default the dev server runs on port `8080`.

## Backend Connection

The frontend sends the uploaded image to the Python backend:

- Endpoint: `POST /predict`
- Body: `multipart/form-data` with field `file` (image)

The base URL for the backend is:

- `import.meta.env.VITE_API_URL` if defined
- otherwise defaults to `http://localhost:8000`

To customize it, create a `.env` file in this folder:

```bash
VITE_API_URL=http://localhost:8000
```

## Build

To create a production build:

```bash
npm run build
```

The build output will be placed in `dist/`.
