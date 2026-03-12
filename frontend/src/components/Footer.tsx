import React from 'react';
import { Dna, Github, Mail, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="border-t border-border bg-card/30">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-3 gap-12 mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-tighter text-foreground">
              Derm<span className="text-primary">AI</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered acne detection and classification using deep learning.
            Built with ResNet50 architecture trained on dermatological datasets.
          </p>
          <div className="shimmer-line w-24" />
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Navigation
          </h4>
          <div className="space-y-2">
            {[
              { label: 'Detector', id: 'detector' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'Acne Types', id: 'acne-types-detail' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="block font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                → {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-4">
          <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Tech Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {['PyTorch', 'ResNet50', 'React', 'WebGL', 'TailwindCSS'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider border border-border text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          © 2026 DermAI — Acne Classification System
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/30 text-center">
          ⚠ For research & educational purposes only. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
