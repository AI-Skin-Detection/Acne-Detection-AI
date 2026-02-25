import React from 'react';
import { Dna, ScanLine, Upload, ArrowDown } from 'lucide-react';

const StaticHero: React.FC = () => {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Noise + scanline overlays */}
      <div className="absolute inset-0 noise pointer-events-none" />
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Gradient blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-primary/5 blur-[100px]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-primary/30 bg-card/60 backdrop-blur-sm">
          <Dna className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            ResNet50 Neural Network
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold uppercase tracking-tighter text-foreground leading-none">
          Derm<span className="text-primary text-glow">AI</span>
        </h1>
        <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-muted-foreground">
          Acne Classifier
        </h2>

        {/* Divider */}
        <div className="mx-auto mt-8 mb-6 shimmer-line w-48" />

        {/* Subtitle */}
        <p className="max-w-xl mx-auto text-lg text-muted-foreground font-mono leading-relaxed">
          AI-powered detection and classification of 5 major acne types.
          <br />
          <span className="text-foreground">Upload. Analyze. Understand.</span>
        </p>

        {/* Stats row */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: '5', label: 'Acne Types' },
            { value: '50', label: 'ResNet Layers' },
            { value: '95%', label: 'Accuracy' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-primary font-mono">{s.value}</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => scrollTo('detector')}
            className="inline-flex items-center gap-2 px-8 py-3 font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all pulse-glow"
          >
            <Upload className="w-4 h-4" />
            Start Analysis
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="inline-flex items-center gap-2 px-8 py-3 font-mono text-sm uppercase tracking-widest border border-primary/40 text-primary hover:bg-primary/10 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            Learn More
          </button>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo('detector')}
          className="mt-16 mx-auto flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
};

export default StaticHero;
