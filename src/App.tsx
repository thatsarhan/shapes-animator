import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Sliders, Box, Circle, Hexagon, Cylinder, Share2, Activity, Download, Code, Layers, Sparkles, Copy, Play, Pause } from 'lucide-react';

// --- Math & Color Helpers ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

const lerpColor = (c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}, t: number) => {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
};

const networkNodes = Array.from({ length: 30 }, (_, i) => ({
  x: (Math.random() - 0.5) * 200,
  y: (Math.random() - 0.5) * 200,
  z: (Math.random() - 0.5) * 200,
  name: `Node ${i + 1}`
}));

const getShapePoint = (shape: string, u: number, v: number, params: any, time: number = 0) => {
  let x = 0, y = 0, z = 0;
  const { radius: r, length: l, twist, detail, tubeRadius, spacing, arms, turns, width } = params;
  const PI2 = Math.PI * 2;

  switch (shape) {
    case 'sphere':
      x = r * Math.sin(Math.PI * v) * Math.cos(PI2 * u);
      y = r * Math.sin(Math.PI * v) * Math.sin(PI2 * u);
      z = r * Math.cos(Math.PI * v);
      break;
    case 'torus':
      const tubeR = tubeRadius || r * 0.3;
      x = (r + tubeR * Math.cos(PI2 * v)) * Math.cos(PI2 * u);
      y = (r + tubeR * Math.cos(PI2 * v)) * Math.sin(PI2 * u);
      z = tubeR * Math.sin(PI2 * v);
      break;
    case 'cylinder':
      x = r * Math.cos(PI2 * u);
      y = l * (v - 0.5);
      z = r * Math.sin(PI2 * u);
      break;
    case 'cone':
      x = r * (1 - v) * Math.cos(PI2 * u);
      y = l * (v - 0.5);
      z = r * (1 - v) * Math.sin(PI2 * u);
      break;
    case 'horn':
      const rt = r * Math.pow(1 - v, 1.2);
      const angle = PI2 * u + twist * v * Math.PI * 2;
      x = rt * Math.cos(angle);
      y = l * (v - 0.5);
      z = rt * Math.sin(angle);
      break;
    case 'mobius':
      const w = width || r * 0.4;
      const mw = w * (v - 0.5);
      x = (r + mw * Math.cos(PI2 * u / 2)) * Math.cos(PI2 * u);
      y = (r + mw * Math.cos(PI2 * u / 2)) * Math.sin(PI2 * u);
      z = mw * Math.sin(PI2 * u / 2);
      break;
    case 'helix':
      const helixTurns = turns || 3;
      x = r * Math.cos(PI2 * u * helixTurns);
      y = l * (u - 0.5);
      z = r * Math.sin(PI2 * u * helixTurns);
      // Add thickness
      x += (tubeRadius || 10) * Math.cos(PI2 * v);
      z += (tubeRadius || 10) * Math.sin(PI2 * v);
      break;
    case 'pyramid':
      // Simplified pyramid mapping
      const pyHeight = l;
      const pyBase = r;
      if (v < 0.25) { x = -pyBase/2 + u*pyBase; y = -pyHeight/2; z = -pyBase/2; }
      else if (v < 0.5) { x = pyBase/2; y = -pyHeight/2; z = -pyBase/2 + u*pyBase; }
      else if (v < 0.75) { x = pyBase/2 - u*pyBase; y = -pyHeight/2; z = pyBase/2; }
      else { x = -pyBase/2; y = -pyHeight/2; z = pyBase/2 - u*pyBase; }
      // Taper to top
      const taper = 1 - u;
      x *= taper; z *= taper;
      y = -pyHeight/2 + u * pyHeight;
      break;
    case 'icosahedron':
      // Approximation for grid mapping
      const phi = (1 + Math.sqrt(5)) / 2;
      x = r * Math.sin(Math.PI * v) * Math.cos(PI2 * u);
      y = r * Math.sin(Math.PI * v) * Math.sin(PI2 * u);
      z = r * Math.cos(Math.PI * v);
      // Add noise to make it look faceted
      const noise = Math.sin(u * 10) * Math.cos(v * 10) * (r * 0.1);
      x += noise; y += noise; z += noise;
      break;
    case 'vortex':
      const vArms = arms || 3;
      const vAngle = PI2 * u * vArms + v * Math.PI * 4;
      const vRadius = r * v;
      x = vRadius * Math.cos(vAngle);
      z = vRadius * Math.sin(vAngle);
      y = l * (v - 0.5);
      break;
    case 'cubes':
      const cSpace = spacing || 50;
      const gridSize = Math.floor(Math.sqrt(detail));
      const gx = Math.floor(u * gridSize) - gridSize/2;
      const gy = Math.floor(v * gridSize) - gridSize/2;
      const gz = Math.sin(u * PI2) * Math.cos(v * PI2) * 2; // Simple height variation
      x = gx * cSpace;
      y = gz * cSpace;
      z = gy * cSpace;
      break;
    case 'starburst':
      const sbRadius = r * (0.2 + 0.8 * Math.random()); // Random spike length
      x = sbRadius * Math.sin(Math.PI * v) * Math.cos(PI2 * u);
      y = sbRadius * Math.sin(Math.PI * v) * Math.sin(PI2 * u);
      z = sbRadius * Math.cos(Math.PI * v);
      break;
    case 'universal-network':
    case 'ontology':
    case 'network':
    case 'neural':
      const rows = detail;
      const cols = detail;
      const count = (rows + 1) * (cols + 1);
      const i = Math.floor(v * rows) * (cols + 1) + Math.floor(u * cols);
      
      const nodeIndex = i % 30;
      const nextNodeIndex = (i + 7) % 30;
      const t = (i / count) * 30 % 1;
      const spread = r * 0.15;
      const noiseX = Math.sin(i * 13.3 + time * params.speed) * spread;
      const noiseY = Math.cos(i * 17.7 + time * params.speed) * spread;
      const noiseZ = Math.sin(i * 19.9 + time * params.speed) * spread;

      const n1 = networkNodes[nodeIndex];
      const n2 = networkNodes[nextNodeIndex];
      
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      if (t < 0.15) {
          x = n1.x * (r/100) + noiseX;
          y = n1.y * (r/100) + noiseY;
          z = n1.z * (r/100) + noiseZ;
      } else {
          const lerpT = (t - 0.15) / 0.85; 
          x = lerp(n1.x, n2.x, lerpT) * (r/100) + noiseX * 0.2;
          y = lerp(n1.y, n2.y, lerpT) * (r/100) + noiseY * 0.2;
          z = lerp(n1.z, n2.z, lerpT) * (r/100) + noiseZ * 0.2;
      }
      break;
    case 'orbital':
      const oAngle1 = PI2 * u;
      const oAngle2 = PI2 * v;
      x = r * Math.cos(oAngle1) * Math.cos(oAngle2);
      y = r * Math.sin(oAngle1) * Math.cos(oAngle2);
      z = r * Math.sin(oAngle2);
      // Add orbital rings
      if (v > 0.45 && v < 0.55) {
        x *= 1.5; y *= 1.5; z *= 1.5;
      }
      break;
    default:
      break;
  }
  return { x, y, z };
};

export default function App() {
  const [shape, setShape] = useState('horn');
  const [showLines, setShowLines] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  
  const [params, setParams] = useState({
    radius: 150,
    length: 300,
    detail: 35,
    twist: 1.5,
    speed: 1,
    strokeWeight: 1.5,
    perspective: 1000,
    color1: '#00f0ff',
    color2: '#ff0055',
    // Shape specific
    tubeRadius: 45,
    spacing: 50,
    arms: 3,
    turns: 3,
    width: 60
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();
    
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        timeRef.current += dt;
        setTime(timeRef.current);
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.startsWith('color') ? value : parseFloat(value))
    }));
  };

  // Calculate 3D points and project to 2D
  const projectedData = useMemo(() => {
    const rotX = time * params.speed * 0.5 + rotation.x;
    const rotY = time * params.speed * 0.7 + rotation.y;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    const pts = [];
    const rows = params.detail;
    const cols = params.detail;
    
    const c1 = hexToRgb(params.color1);
    const c2 = hexToRgb(params.color2);

    for (let i = 0; i <= rows; i++) {
      const v = i / rows;
      for (let j = 0; j <= cols; j++) {
        const u = j / cols;
        const { x, y, z } = getShapePoint(shape, u, v, params, time);
        
        // 3D Rotation
        let x1 = x * cosY - z * sinY;
        let z1 = z * cosY + x * sinY;
        let y2 = y * cosX - z1 * sinX;
        let z2 = z1 * cosX + y * sinX;

        // 2D Projection
        const scale = params.perspective / (params.perspective + z2);
        const px = x1 * scale;
        const py = y2 * scale;
        
        const color = lerpColor(c1, c2, v);

        pts.push({ px, py, z: z2, scale, color, u, v, row: i, col: j });
      }
    }

    const projectedNodes = networkNodes.map(node => {
      let nx = node.x * (params.radius/100);
      let ny = node.y * (params.radius/100);
      let nz = node.z * (params.radius/100);
      let x1 = nx * cosY - nz * sinY;
      let z1 = nz * cosY + nx * sinY;
      let y2 = ny * cosX - z1 * sinX;
      let z2 = z1 * cosX + ny * sinX;
      const scale = params.perspective / (params.perspective + z2);
      return {
        px: x1 * scale,
        py: y2 * scale,
        z: z2,
        scale,
        name: node.name
      };
    });

    return { pts, rows, cols, projectedNodes };
  }, [shape, params, time, rotation]);

  // Render SVG Elements
  const renderContent = () => {
    const { pts, rows, cols, projectedNodes } = projectedData;

    let labels = null;
    if (['universal-network', 'ontology', 'network', 'neural'].includes(shape)) {
      labels = projectedNodes.map((node, i) => (
        <text
          key={`label-${i}`}
          x={node.px + 10}
          y={node.py}
          fill="rgba(255,255,255,0.7)"
          fontSize={12 * node.scale}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.name}
        </text>
      ));
    }

    const elements = [];

    // Sort by Z for proper depth rendering
    const sortedPts = [...pts].sort((a, b) => b.z - a.z);

    if (showLines) {
      const paths = [];
      // Horizontal lines
      for (let i = 0; i <= rows; i++) {
        let d = "";
        for (let j = 0; j <= cols; j++) {
          const idx = i * (cols + 1) + j;
          const p = pts[idx];
          d += `${j === 0 ? 'M' : 'L'} ${p.px.toFixed(2)} ${p.py.toFixed(2)} `;
        }
        paths.push(
          <path 
            key={`h${i}`} 
            d={d} 
            stroke={pts[i * (cols + 1)].color} 
            fill="none" 
            strokeWidth={params.strokeWeight} 
            opacity={0.6} 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      
      // Vertical lines
      for (let j = 0; j <= cols; j++) {
        let d = "";
        for (let i = 0; i <= rows; i++) {
          const idx = i * (cols + 1) + j;
          const p = pts[idx];
          d += `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(2)} ${p.py.toFixed(2)} `;
        }
        paths.push(
          <path 
            key={`v${j}`} 
            d={d} 
            stroke={pts[j].color} 
            fill="none" 
            strokeWidth={params.strokeWeight} 
            opacity={0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      elements.push(<g key="lines">{paths}</g>);
    }

    if (showPoints) {
      elements.push(
        <g key="points">
          {sortedPts.map((p, i) => (
            <circle 
              key={`p${i}`} 
              cx={p.px} 
              cy={p.py} 
              r={Math.max(0.5, 2.5 * p.scale)} 
              fill={p.color} 
              opacity={0.8} 
            />
          ))}
        </g>
      );
    }

    elements.push(<g key="labels">{labels}</g>);

    return elements;
  };

  // --- Export Functions ---
  const getSVGString = () => {
    if (!svgRef.current) return "";
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return '<?xml version="1.0" standalone="no"?>\r\n' + source;
  };

  const downloadSVG = () => {
    const source = getSVGString();
    if (!source) return;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${shape}-render.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySVG = () => {
    const source = getSVGString();
    if (source) {
      navigator.clipboard.writeText(source);
      alert("SVG copied to clipboard!");
    }
  };

  const copyCSS = () => {
    const duration = params.speed > 0 ? (10 / params.speed).toFixed(2) : 0;
    const css = `
/* CSS Animation for SVG */
.shape-container {
  perspective: ${params.perspective}px;
}
.shape-svg {
  animation: rotate3d ${duration}s linear infinite;
  transform-style: preserve-3d;
}
@keyframes rotate3d {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}
`;
    navigator.clipboard.writeText(css);
    alert("CSS copied to clipboard!");
  };

  const downloadCSS = () => {
    const { rows, cols } = projectedData;
    let html = `<div class="scene">\n`;
    let css = `
body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
.scene { position: relative; transform-style: preserve-3d; animation: rotate ${10 / Math.max(0.1, params.speed)}s linear infinite; }
@keyframes rotate { 
  0% { transform: rotateX(0deg) rotateY(0deg); } 
  100% { transform: rotateX(360deg) rotateY(360deg); } 
}
.p { position: absolute; width: 4px; height: 4px; border-radius: 50%; transform: translate(-50%, -50%); }
`;
    
    const c1 = hexToRgb(params.color1);
    const c2 = hexToRgb(params.color2);

    for (let i = 0; i <= rows; i++) {
      const v = i / rows;
      for (let j = 0; j <= cols; j++) {
        const u = j / cols;
        const { x, y, z } = getShapePoint(shape, u, v, params, time);
        const color = lerpColor(c1, c2, v);
        const idx = i * (cols + 1) + j;
        
        html += `  <div class="p p${idx}"></div>\n`;
        css += `.p${idx} { transform: translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px); background: ${color}; }\n`;
      }
    }
    html += `</div>`;
    
    const content = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`;
    const url = "data:text/html;charset=utf-8," + encodeURIComponent(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${shape}-css3d.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shapes = [
    { id: 'horn', label: 'Horn' },
    { id: 'sphere', label: 'Sphere' },
    { id: 'torus', label: 'Torus' },
    { id: 'cylinder', label: 'Cylinder' },
    { id: 'cone', label: 'Cone' },
    { id: 'mobius', label: 'Mobius' },
    { id: 'helix', label: 'Helix' },
    { id: 'pyramid', label: 'Pyramid' },
    { id: 'icosahedron', label: 'Icosahedron' },
    { id: 'vortex', label: 'Vortex' },
    { id: 'cubes', label: 'Cubes' },
    { id: 'starburst', label: 'Starburst' },
    { id: 'network', label: 'Network' },
    { id: 'ontology', label: 'Ontology' },
    { id: 'orbital', label: 'Orbital' },
    { id: 'neural', label: 'Neural' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotation(prev => ({
      x: prev.x + dy * 0.01,
      y: prev.y + dx * 0.01
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      className="w-screen h-screen bg-[#050505] overflow-hidden flex font-sans text-white"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Sidebar UI */}
      <div className="w-80 h-full bg-[#0a0a0a] p-6 border-r border-gray-800 overflow-y-auto z-10 flex flex-col shadow-2xl custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Box className="text-blue-400" size={24} />
            <h1 className="text-lg font-bold tracking-tight">Shape Gen</h1>
          </div>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Shape Type */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings size={14} /> Shape
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map(s => (
              <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                  shape === s.id 
                    ? 'bg-blue-900/30 border-blue-500 text-blue-400' 
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={14} /> Appearance
          </h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showLines} 
                onChange={(e) => setShowLines(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
              />
              Show Lines
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showPoints} 
                onChange={(e) => setShowPoints(e.target.checked)}
                className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
              />
              Show Points
            </label>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <label className="text-gray-400">Stroke Weight</label>
              <span className="text-blue-400 font-mono">{params.strokeWeight}</span>
            </div>
            <input 
              type="range" name="strokeWeight" min="0.1" max="5" step="0.1" 
              value={params.strokeWeight} onChange={handleParamChange}
              className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Parameters */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sliders size={14} /> Parameters
          </h2>
          
          <div className="space-y-4">
            {[
              { name: 'radius', label: 'Radius / Scale', min: 10, max: 400, step: 1 },
              { name: 'detail', label: 'Detail Level', min: 5, max: 100, step: 1 },
              { name: 'perspective', label: 'Perspective', min: 200, max: 2000, step: 10 },
              { name: 'speed', label: 'Animation Speed', min: 0, max: 5, step: 0.1 },
            ].map(param => (
              <div key={param.name}>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">{param.label}</label>
                  <span className="text-blue-400 font-mono">{(params as any)[param.name]}</span>
                </div>
                <input 
                  type="range" name={param.name} min={param.min} max={param.max} step={param.step} 
                  value={(params as any)[param.name]} onChange={handleParamChange}
                  className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}

            {/* Shape Specific Parameters */}
            {['horn', 'cylinder', 'cone', 'helix', 'vortex', 'pyramid'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Length / Height</label>
                  <span className="text-blue-400 font-mono">{params.length}</span>
                </div>
                <input type="range" name="length" min="50" max="800" step="1" value={params.length} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['horn'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Twist</label>
                  <span className="text-blue-400 font-mono">{params.twist}</span>
                </div>
                <input type="range" name="twist" min="0" max="10" step="0.1" value={params.twist} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['torus', 'helix'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Tube Radius</label>
                  <span className="text-blue-400 font-mono">{params.tubeRadius}</span>
                </div>
                <input type="range" name="tubeRadius" min="5" max="100" step="1" value={params.tubeRadius} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['cubes'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Spacing</label>
                  <span className="text-blue-400 font-mono">{params.spacing}</span>
                </div>
                <input type="range" name="spacing" min="10" max="100" step="1" value={params.spacing} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['vortex'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Arms</label>
                  <span className="text-blue-400 font-mono">{params.arms}</span>
                </div>
                <input type="range" name="arms" min="1" max="10" step="1" value={params.arms} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['helix'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Turns</label>
                  <span className="text-blue-400 font-mono">{params.turns}</span>
                </div>
                <input type="range" name="turns" min="1" max="20" step="1" value={params.turns} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
            {['mobius'].includes(shape) && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-gray-400">Width</label>
                  <span className="text-blue-400 font-mono">{params.width}</span>
                </div>
                <input type="range" name="width" min="10" max="200" step="1" value={params.width} onChange={handleParamChange} className="w-full accent-blue-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
              </div>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={14} /> Colors
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">Start Color</label>
              <input 
                type="color" name="color1" 
                value={params.color1} onChange={handleParamChange}
                className="w-full h-8 rounded cursor-pointer bg-gray-900 border border-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">End Color</label>
              <input 
                type="color" name="color2" 
                value={params.color2} onChange={handleParamChange}
                className="w-full h-8 rounded cursor-pointer bg-gray-900 border border-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={copySVG}
              className="py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-colors"
            >
              <Copy size={14} /> Copy SVG
            </button>
            <button 
              onClick={copyCSS}
              className="py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-colors"
            >
              <Code size={14} /> Copy CSS
            </button>
          </div>
          <button 
            onClick={downloadSVG}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors"
          >
            <Download size={16} /> Download SVG
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black cursor-move">
        <svg 
          ref={svgRef}
          id="shape-canvas"
          viewBox="-400 -400 800 800" 
          className="w-full h-full max-w-[800px] max-h-[800px] drop-shadow-[0_0_30px_rgba(0,150,255,0.2)]"
          style={{ overflow: 'visible' }}
          onMouseDown={handleMouseDown}
        >
          {renderContent()}
        </svg>
      </div>
    </div>
  );
}
