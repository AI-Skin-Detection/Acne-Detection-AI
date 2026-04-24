import React, { useRef, useEffect } from 'react';

interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) { t+=a*noise(p); p*=2.*m; a*=.5; }
  return t;
}
float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a); d=a; p*=2./(i+1.);
  }
  return t;
}
void main(void) {
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`;

const useShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const rendererRef = useRef<any>(null);
  const pointersRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    // Simple renderer
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let currentScale = dpr;
    const mouseCoords = [0, 0];
    const mouseMove = [0, 0];
    let pointerCount = 0;
    let pointerCoords = [0, 0];
    let active = false;
    const pointers = new Map<number, number[]>();
    let lastCoords = [0, 0];

    const vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);

    const compile = (shader: WebGLShader, source: string) => {
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
    };

    const setup = () => {
      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      compile(vs, vertexSrc);
      compile(fs, defaultShaderSource);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    };

    const resize = () => {
      currentScale = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = window.innerWidth * currentScale;
      canvas.height = window.innerHeight * currentScale;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const map = (x: number, y: number) => [x * currentScale, canvas.height - y * currentScale];

    canvas.addEventListener('pointerdown', (e) => {
      active = true;
      pointers.set(e.pointerId, map(e.clientX, e.clientY));
    });
    canvas.addEventListener('pointerup', (e) => {
      pointers.delete(e.pointerId);
      active = pointers.size > 0;
    });
    canvas.addEventListener('pointerleave', (e) => {
      pointers.delete(e.pointerId);
      active = pointers.size > 0;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!active) return;
      lastCoords = [e.clientX, e.clientY];
      pointers.set(e.pointerId, map(e.clientX, e.clientY));
      mouseMove[0] += e.movementX;
      mouseMove[1] += e.movementY;
    });

    const render = (now: number) => {
      if (!program) return;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      const res = gl.getUniformLocation(program, 'resolution');
      const t = gl.getUniformLocation(program, 'time');
      gl.uniform2f(res, canvas.width, canvas.height);
      gl.uniform1f(t, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    setup();
    resize();
    render(0);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return canvasRef;
};

const Hero: React.FC<HeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  buttons,
  className = "",
}) => {
  const canvasRef = useShaderBackground();

  return (
    <div className={`relative w-full min-h-screen overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {trustBadge && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border border-primary/30 bg-background/40 backdrop-blur-sm text-primary">
              {trustBadge.icons?.map((icon, i) => (
                <span key={i} className="text-base">{icon}</span>
              ))}
              {trustBadge.text}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-bold uppercase tracking-tighter text-foreground animate-fade-in"
            style={{ animationDelay: '0.4s', opacity: 0 }}
          >
            {headline.line1}
          </h1>
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-bold uppercase tracking-tighter text-glow text-primary animate-fade-in"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            {headline.line2}
          </h1>
        </div>

        <p
          className="mt-6 max-w-xl text-lg text-muted-foreground font-mono animate-fade-in"
          style={{ animationDelay: '0.8s', opacity: 0 }}
        >
          {subtitle}
        </p>

        {buttons && (
          <div
            className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in"
            style={{ animationDelay: '1s', opacity: 0 }}
          >
            {buttons.primary && (
              <button
                onClick={buttons.primary.onClick}
                className="px-8 py-3 font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all pulse-glow"
              >
                {buttons.primary.text}
              </button>
            )}
            {buttons.secondary && (
              <button
                onClick={buttons.secondary.onClick}
                className="px-8 py-3 font-mono text-sm uppercase tracking-widest border border-primary/40 text-primary hover:bg-primary/10 transition-all"
              >
                {buttons.secondary.text}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;
