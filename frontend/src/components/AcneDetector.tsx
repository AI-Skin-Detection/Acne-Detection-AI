import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Zap, AlertTriangle, Activity, Eye } from 'lucide-react';

const ACNE_TYPES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads'] as const;

interface DetectionResult {
  type: string;
  confidence: number;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

const ACNE_INFO: Record<string, { description: string; severity: 'mild' | 'moderate' | 'severe' }> = {
  Blackheads: {
    description: 'Open comedones caused by clogged hair follicles. The surface looks dark due to oxidation.',
    severity: 'mild',
  },
  Whiteheads: {
    description: 'Closed comedones that form under the skin surface. Appear as small, flesh-colored bumps.',
    severity: 'mild',
  },
  Papules: {
    description: 'Small, inflamed red bumps caused by infected hair follicles. Tender to touch.',
    severity: 'moderate',
  },
  Pustules: {
    description: 'Inflamed lesions filled with pus. Red at the base with white or yellow tips.',
    severity: 'moderate',
  },
  Cyst: {
    description: 'Deep, painful, pus-filled lumps beneath the skin. Most severe form of acne.',
    severity: 'severe',
  },
};

const severityColor = (s: string) => {
  if (s === 'mild') return 'text-primary';
  if (s === 'moderate') return 'text-rust';
  return 'text-blood';
};

const AcneDetector: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = useCallback(async () => {
    if (!selectedFile) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    setAnalyzing(true);
    setResult(null);
    setScanProgress(0);

    // Fake scan progress animation while the request is in flight
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 95) {
          return 95;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data: { predicted_class: string; confidence: number } = await response.json();

      const acneType = (ACNE_TYPES as readonly string[]).includes(data.predicted_class)
        ? (data.predicted_class as (typeof ACNE_TYPES)[number])
        : 'Papules';

      const info = ACNE_INFO[acneType];

      setScanProgress(100);

      setResult({
        type: acneType,
        confidence: data.confidence,
        description: info.description,
        severity: info.severity,
      });
    } catch (error) {
      console.error(error);
      setScanProgress(0);
      setResult({
        type: 'Papules',
        confidence: 0,
        description:
          'There was an error communicating with the detection server. Please make sure the backend is running and try again.',
        severity: 'moderate',
      });
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  }, [selectedFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setImage(null);
    setFileName('');
    setSelectedFile(null);
    setResult(null);
    setAnalyzing(false);
    setScanProgress(0);
  };

  return (
    <section id="detector" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-primary/20 bg-muted/50 text-primary font-mono text-xs uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            Neural Analysis Engine
          </div>
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-foreground">
            Upload & <span className="text-primary text-glow">Classify</span>
          </h2>
          <div className="mt-4 mx-auto w-32 shimmer-line" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload area */}
          <div className="space-y-4">
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card/50 backdrop-blur-sm p-12 flex flex-col items-center justify-center cursor-pointer transition-all group min-h-[320px]"
              >
                <div className="noise absolute inset-0 pointer-events-none" />
                <Upload className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                  Drop image or click to upload
                </p>
                <p className="font-mono text-xs text-muted-foreground/60 mt-2">
                  JPG, PNG — skin lesion photo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <div className="relative border border-border bg-card/50 overflow-hidden">
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 z-20 p-1 bg-background/80 border border-border hover:border-primary/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="relative">
                  <img
                    src={image}
                    alt="Uploaded skin image"
                    className="w-full h-[320px] object-cover"
                  />

                  {/* Scan effect */}
                  {analyzing && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_20px_hsla(82,85%,45%,0.5)]"
                        style={{
                          top: `${scanProgress}%`,
                          transition: 'top 0.1s linear',
                        }}
                      />
                      <div className="absolute inset-0 bg-primary/5" />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border">
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {fileName}
                  </p>
                </div>
              </div>
            )}

            {image && !analyzing && !result && (
              <button
                onClick={analyzeImage}
                className="w-full py-3 font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all pulse-glow flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Analyze Image
              </button>
            )}

            {analyzing && (
              <div className="border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="font-mono text-xs text-primary uppercase tracking-wider">
                    Processing neural classification...
                  </span>
                </div>
                <div className="w-full h-1 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${Math.min(scanProgress, 100)}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  ResNet50 • 5-class classifier • confidence threshold: 75%
                </p>
              </div>
            )}
          </div>

          {/* Results area */}
          <div className="space-y-4">
            {!result && !analyzing && (
              <div className="border border-border bg-card/30 p-8 flex flex-col items-center justify-center min-h-[320px] text-center">
                <Eye className="w-10 h-10 text-muted-foreground/30 mb-4" />
                <p className="font-mono text-sm text-muted-foreground/50 uppercase tracking-wider">
                  Awaiting input
                </p>
                <p className="font-mono text-xs text-muted-foreground/30 mt-2">
                  Upload an image to begin classification
                </p>
              </div>
            )}

            {analyzing && (
              <div className="border border-primary/20 bg-card/30 p-8 flex flex-col items-center justify-center min-h-[320px]">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="font-mono text-xs text-primary uppercase tracking-wider glitch">
                  Classifying...
                </p>
              </div>
            )}

            {result && (
              <div className="border border-primary/30 bg-card/50 animate-scale-in overflow-hidden">
                <div className="p-1 bg-primary/10 border-b border-primary/20">
                  <p className="font-mono text-[10px] text-primary/70 text-center uppercase tracking-widest">
                    Classification Result
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Type */}
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      Detected Type
                    </p>
                    <h3 className="text-3xl font-bold text-foreground uppercase tracking-tight">
                      {result.type}
                    </h3>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                        Confidence
                      </p>
                      <p className="font-mono text-sm text-primary">
                        {result.confidence.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${severityColor(result.severity)}`} />
                    <span className={`font-mono text-xs uppercase tracking-widest ${severityColor(result.severity)}`}>
                      Severity: {result.severity}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.description}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-muted/50 border border-border p-3">
                    <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
                      ⚠ This is a simulated classification for demonstration purposes.
                      Always consult a dermatologist for medical diagnosis.
                    </p>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full py-2 font-mono text-xs uppercase tracking-widest border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                  >
                    Analyze Another Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acne types reference */}
        <div id="acne-types" className="mt-20">
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6 text-center">
            Classification Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {ACNE_TYPES.map((type) => (
              <div
                key={type}
                className="border border-border bg-card/30 p-4 text-center hover:border-primary/40 transition-colors group"
              >
                <p className="font-mono text-xs text-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                  {type}
                </p>
                <p className={`font-mono text-[10px] mt-1 uppercase ${severityColor(ACNE_INFO[type].severity)}`}>
                  {ACNE_INFO[type].severity}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcneDetector;
