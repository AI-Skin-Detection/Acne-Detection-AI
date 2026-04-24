import React from 'react';
import { Upload, Cpu, FileText } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Capture or upload a high-resolution image of the affected skin area.',
  },
  {
    icon: Cpu,
    title: 'Process',
    description: 'Our ResNet50 neural network analyzes the image through 50 deep layers.',
  },
  {
    icon: FileText,
    title: 'Classify',
    description: 'Receive instant classification across 5 acne types with confidence scores.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-tighter text-foreground mb-16">
          How It <span className="text-primary text-glow">Works</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative border border-border bg-card/30 p-8 group hover:border-primary/40 transition-all"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="font-mono text-[10px] text-muted-foreground/40 absolute top-3 right-3">
                0{i + 1}
              </div>
              <step.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-mono text-sm text-foreground uppercase tracking-widest mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
