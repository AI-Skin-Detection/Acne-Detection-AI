import React from 'react';
import { Brain, Database, Layers, Target, Shield, Microscope } from 'lucide-react';

const stats = [
  { label: 'Acne Classes', value: '5', icon: Target },
  { label: 'Model Layers', value: '50', icon: Layers },
  { label: 'Architecture', value: 'ResNet50', icon: Brain },
  { label: 'Framework', value: 'PyTorch', icon: Database },
];

const features = [
  {
    icon: Microscope,
    title: 'Deep Learning Classification',
    description:
      'Powered by a ResNet50 convolutional neural network, our model processes skin images through 50 layers of deep residual learning to accurately identify acne types.',
  },
  {
    icon: Target,
    title: '5-Class Detection',
    description:
      'Classifies images into Blackheads, Whiteheads, Papules, Pustules, and Cysts — the five major acne categories recognized worldwide by dermatologists.',
  },
  {
    icon: Shield,
    title: 'Research-Backed',
    description:
      'Trained on curated dermatological datasets with transfer learning from ImageNet weights. Designed to assist — not replace — professional medical diagnosis.',
  },
];

const About: React.FC = () => {
  return (
    <section id="about" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-primary/20 bg-muted/50 text-primary font-mono text-xs uppercase tracking-widest">
            <Brain className="w-3 h-3" />
            About the Project
          </div>
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-foreground">
            Why <span className="text-primary text-glow">DermAI</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Dermatology is the branch of medicine concerned with diagnosis and treatment of skin disorders.
            AI has the potential to improve dermatologic care, especially in underserved communities — enabling
            faster diagnosis and more accurate identification of skin lesions.
          </p>
          <div className="mt-4 mx-auto w-32 shimmer-line" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border border-border bg-card/30 p-6 text-center group hover:border-primary/40 transition-all"
            >
              <s.icon className="w-5 h-5 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="border border-border bg-card/30 p-8 group hover:border-primary/40 transition-all"
            >
              <div className="font-mono text-[10px] text-muted-foreground/40 mb-4">0{i + 1}</div>
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-mono text-sm text-foreground uppercase tracking-widest mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Problem statement */}
        <div className="border border-primary/20 bg-card/30 p-8 md:p-12">
          <h3 className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
            The Problem
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Blackheads, Whiteheads, Papules, Pustules, and Cysts are the 5 major types of acne worldwide.
            Accurate detection and classification using patient images remains a challenge — particularly in
            regions with limited access to dermatologists.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            DermAI addresses this by leveraging a ResNet50 neural network to provide instant, AI-powered
            classification. While challenges remain in implementation, safety, and ethical considerations,
            this tool demonstrates how deep learning can support — not replace — clinical decision-making.
          </p>
          <div className="mt-6 shimmer-line w-48" />
        </div>
      </div>
    </section>
  );
};

export default About;
