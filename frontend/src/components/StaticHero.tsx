import React from "react";

const StaticHero: React.FC = () => {

  const scrollToDetector = () => {
    document.getElementById("detector")?.scrollIntoView({
      behavior: "smooth"
    });
  };

  return (

<section className="min-h-screen flex flex-col justify-center items-center bg-black text-center px-6">

<div className="max-w-4xl">

<p className="inline-block border border-green-500/30 text-green-400 px-4 py-1 text-xs tracking-widest mb-6">
RESNET50 NEURAL NETWORK
</p>

<h1 className="text-6xl md:text-7xl font-bold tracking-tight">

<span className="text-white">DERM</span>
<span className="text-green-400 animate-pulse">AI</span>

</h1>

<h2 className="text-3xl md:text-4xl font-bold text-gray-400 mt-4">
ACNE CLASSIFIER
</h2>

<p className="text-gray-400 mt-6 text-lg max-w-xl mx-auto">
AI-powered detection and classification of 5 major acne types.
Upload. Analyze. Understand.
</p>

{/* Stats */}

<div className="flex justify-center gap-16 mt-12">

<div className="text-center">
<p className="text-green-400 text-3xl font-bold">5</p>
<p className="text-gray-400 text-sm">Acne Types</p>
</div>

<div className="text-center">
<p className="text-green-400 text-3xl font-bold">50</p>
<p className="text-gray-400 text-sm">ResNet Layers</p>
</div>

<div className="text-center">
<p className="text-green-400 text-3xl font-bold">95%</p>
<p className="text-gray-400 text-sm">Accuracy</p>
</div>

</div>

{/* Buttons */}

<div className="flex justify-center gap-6 mt-12">

<button
onClick={scrollToDetector}
className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-3 rounded"
>
Start Analysis
</button>

<button
className="border border-green-500 text-green-400 px-8 py-3 rounded"
>
Learn More
</button>

</div>

</div>

</section>

  );
};

export default StaticHero;