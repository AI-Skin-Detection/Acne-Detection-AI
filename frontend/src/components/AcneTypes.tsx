import React from 'react';
import { AlertTriangle, Circle, CircleDot, Droplets, ShieldAlert } from 'lucide-react';

const ACNE_DATA = [
  {
    name: 'Blackheads',
    icon: Circle,
    severity: 'mild' as const,
    aka: 'Open Comedones',
    description: 'Clogged hair follicles open to the skin surface. The dark appearance comes from oxidation of melanin, not dirt.',
    causes: ['Excess sebum', 'Dead skin cells', 'Hormonal changes'],
    tips: ['Use salicylic acid cleansers', 'Avoid pore-clogging products', 'Gentle exfoliation'],
  },
  {
    name: 'Whiteheads',
    icon: CircleDot,
    severity: 'mild' as const,
    aka: 'Closed Comedones',
    description: 'Closed pores clogged with oil and dead skin cells. They appear as small, flesh-colored or white bumps under the skin.',
    causes: ['Clogged pores', 'Oil buildup', 'Cosmetics'],
    tips: ['Retinoid creams', 'Non-comedogenic products', 'Regular cleansing'],
  },
  {
    name: 'Papules',
    icon: AlertTriangle,
    severity: 'moderate' as const,
    aka: 'Inflammatory Bumps',
    description: 'Small, raised red bumps caused by inflamed or infected hair follicles. Tender to touch without visible pus.',
    causes: ['Bacterial infection', 'Inflammation', 'Follicle rupture'],
    tips: ['Benzoyl peroxide', 'Avoid picking', 'Anti-inflammatory treatment'],
  },
  {
    name: 'Pustules',
    icon: Droplets,
    severity: 'moderate' as const,
    aka: 'Pus-filled Lesions',
    description: 'Similar to papules but filled with pus. Red at the base with a white or yellow center. A classic "pimple".',
    causes: ['Bacterial growth', 'Immune response', 'Hormonal fluctuation'],
    tips: ['Topical antibiotics', 'Don\'t squeeze', 'Keep area clean'],
  },
  {
    name: 'Cysts',
    icon: ShieldAlert,
    severity: 'severe' as const,
    aka: 'Cystic Acne',
    description: 'Large, painful, pus-filled lumps deep beneath the skin. The most severe form, often causing scarring.',
    causes: ['Deep infection', 'Genetics', 'Hormonal imbalance'],
    tips: ['See a dermatologist', 'Isotretinoin may help', 'Cortisone injections'],
  },
];

const severityColor = (s: string) => {
  if (s === 'mild') return 'text-primary';
  if (s === 'moderate') return 'text-rust';
  return 'text-blood';
};

const severityBorder = (s: string) => {
  if (s === 'mild') return 'border-primary/30 hover:border-primary/60';
  if (s === 'moderate') return 'border-rust/30 hover:border-rust/60';
  return 'border-blood/30 hover:border-blood/60';
};

const AcneTypes: React.FC = () => {
  return (
    <section id="acne-types-detail" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-primary/20 bg-muted/50 text-primary font-mono text-xs uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3" />
            Dermatology Reference
          </div>
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-foreground">
            Acne <span className="text-primary text-glow">Types</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Our classifier identifies 5 major acne categories. Understanding each type helps
            in choosing the right treatment approach.
          </p>
          <div className="mt-4 mx-auto w-32 shimmer-line" />
        </div>

        {/* Cards */}
        <div className="space-y-6">
          {ACNE_DATA.map((acne, i) => (
            <div
              key={acne.name}
              className={`border bg-card/30 backdrop-blur-sm transition-all group ${severityBorder(acne.severity)}`}
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Icon & Name */}
                  <div className="flex-shrink-0 flex items-center gap-4 md:w-48">
                    <div className="w-12 h-12 border border-border bg-muted/30 flex items-center justify-center">
                      <acne.icon className={`w-6 h-6 ${severityColor(acne.severity)}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">
                        {acne.name}
                      </h3>
                      <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        {acne.aka}
                      </p>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${severityColor(acne.severity)}`}>
                        {acne.severity}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {acne.description}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Causes */}
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">
                          Common Causes
                        </p>
                        <ul className="space-y-1">
                          {acne.causes.map((c) => (
                            <li key={c} className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                              <span className={`w-1 h-1 ${acne.severity === 'mild' ? 'bg-primary' : acne.severity === 'moderate' ? 'bg-rust' : 'bg-blood'}`} />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div>
                        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">
                          Treatment Tips
                        </p>
                        <ul className="space-y-1">
                          {acne.tips.map((t) => (
                            <li key={t} className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                              <span className="text-primary">→</span>
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border border-border bg-muted/30 p-4 text-center">
          <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed">
            ⚠ Information provided is for educational purposes only. Always consult a qualified dermatologist for diagnosis and treatment.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AcneTypes;
