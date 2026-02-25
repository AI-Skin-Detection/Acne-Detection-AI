import React, { useState, useEffect } from 'react';
import { Menu, X, Dna } from 'lucide-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const links = [
    { label: 'Detector', id: 'detector' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Acne Types', id: 'acne-types-detail' },
    { label: 'About', id: 'about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 group">
          <Dna className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg uppercase tracking-tighter text-foreground">
            Derm<span className="text-primary">AI</span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('detector')}
            className="px-5 py-2 font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Try Now
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border animate-fade-in">
          <div className="px-6 py-4 space-y-3">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="block w-full text-left font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('detector')}
              className="w-full mt-2 py-3 font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground"
            >
              Try Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
