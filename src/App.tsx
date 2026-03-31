import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Download, Copy, Play, Pause, Settings2, MousePointer2, Code2, FileImage } from 'lucide-react';

type Point3D = { x: number; y: number; z: number };
type Edge = [number, number];

interface ShapeData {
  points: Point3D[];
  edges: Edge[];
}

const generateSphere = (latitudes: number, longitudes: number, radius: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i <= latitudes; i++) {
    const theta = (i * Math.PI) / latitudes;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let j = 0; j <= longitudes; j++) {
      const phi = (j * 2 * Math.PI) / longitudes;
      const x = radius * sinTheta * Math.cos(phi);
      const y = radius * cosTheta;
      const z = radius * sinTheta * Math.sin(phi);
      points.push({ x, y, z });

      if (i < latitudes && j < longitudes) {
        const current = i * (longitudes + 1) + j;
        const next = current + 1;
        const bottom = (i + 1) * (longitudes + 1) + j;
        edges.push([current, next]);
        edges.push([current, bottom]);
      }
    }
  }
  return { points, edges };
};

const generateTorus = (tubularSegments: number, radialSegments: number, radius: number, tube: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i <= radialSegments; i++) {
    const v = (i / radialSegments) * Math.PI * 2;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    for (let j = 0; j <= tubularSegments; j++) {
      const u = (j / tubularSegments) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      const x = (radius + tube * cosV) * cosU;
      const y = (radius + tube * cosV) * sinU;
      const z = tube * sinV;
      points.push({ x, y, z });

      if (i < radialSegments && j < tubularSegments) {
        const current = i * (tubularSegments + 1) + j;
        const next = current + 1;
        const bottom = (i + 1) * (tubularSegments + 1) + j;
        edges.push([current, next]);
        edges.push([current, bottom]);
      }
    }
  }
  return { points, edges };
};

const generateTunnel = (segments: number, radius: number, length: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  const rings = 20;

  for (let i = 0; i < rings; i++) {
    const z = (i / rings) * length - length / 2;
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: z
      });

      if (i < rings - 1) {
        const current = i * segments + j;
        const next = i * segments + ((j + 1) % segments);
        const bottom = (i + 1) * segments + j;
        edges.push([current, next]);
        edges.push([current, bottom]);
      }
    }
  }
  return { points, edges };
};

const generateParticles = (count: number, radius: number): ShapeData => {
  const points: Point3D[] = [];
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);
    points.push({
      x: r * sinPhi * Math.cos(theta),
      y: r * sinPhi * Math.sin(theta),
      z: r * Math.cos(phi)
    });
  }
  return { points, edges: [] };
};

const generateCubeGrid = (size: number, spacing: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  
  const addCube = (cx: number, cy: number, cz: number, s: number) => {
    const startIndex = points.length;
    const d = s / 2;
    points.push({ x: cx - d, y: cy - d, z: cz - d });
    points.push({ x: cx + d, y: cy - d, z: cz - d });
    points.push({ x: cx + d, y: cy + d, z: cz - d });
    points.push({ x: cx - d, y: cy + d, z: cz - d });
    points.push({ x: cx - d, y: cy - d, z: cz + d });
    points.push({ x: cx + d, y: cy - d, z: cz + d });
    points.push({ x: cx + d, y: cy + d, z: cz + d });
    points.push({ x: cx - d, y: cy + d, z: cz + d });

    const cubeEdges: Edge[] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    
    cubeEdges.forEach(edge => {
      edges.push([startIndex + edge[0], startIndex + edge[1]]);
    });
  };

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= 1) {
          addCube(x * spacing, y * spacing, z * spacing, size);
        }
      }
    }
  }

  return { points, edges };
};

const generateBurst = (count: number, radius: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius * (0.2 + 0.8 * Math.random());
    
    const sinPhi = Math.sin(phi);
    const x = r * sinPhi * Math.cos(theta);
    const y = r * sinPhi * Math.sin(theta);
    const z = r * Math.cos(phi);

    const startIndex = points.length;
    points.push({ x: 0, y: 0, z: 0 });
    points.push({ x, y, z });
    
    edges.push([startIndex, startIndex + 1]);
  }

  return { points, edges };
};

const generateOrbital = (radius: number, detail: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  
  const coreRadius = radius * 0.3;
  const { points: coreP, edges: coreE } = generateSphere(detail, detail * 2, coreRadius);
  points.push(...coreP);
  edges.push(...coreE);

  const numRings = 4;
  for (let r = 0; r < numRings; r++) {
    const ringRadius = radius * (0.8 + Math.random() * 0.4);
    const pitch = Math.random() * Math.PI;
    const yaw = Math.random() * Math.PI;
    
    const startIndex = points.length;
    const ringSegments = detail * 4;
    for (let i = 0; i < ringSegments; i++) {
      const angle = (i / ringSegments) * Math.PI * 2;
      let p = {
        x: Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius,
        z: 0
      };
      p = rotatePoint(p, pitch, yaw, 0);
      points.push(p);
      
      edges.push([startIndex + i, startIndex + ((i + 1) % ringSegments)]);
    }
  }

  return { points, edges };
};

const generateVortex = (radius: number, arms: number, segments: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < arms; i++) {
    const armOffset = (i / arms) * Math.PI * 2;
    const startIndex = points.length;
    
    for (let j = 0; j < segments; j++) {
      const t = j / (segments - 1);
      const r = radius * Math.pow(t, 1.2);
      const angle = armOffset + t * Math.PI * 6; // 3 rotations
      const z = (t - 0.5) * radius * 0.8;
      
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: z
      });

      if (j > 0) {
        edges.push([startIndex + j - 1, startIndex + j]);
      }
    }
  }

  return { points, edges };
};

const generateNetwork = (count: number, radius: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  for (let i = 0; i < count; i++) {
    points.push({
      x: (Math.random() - 0.5) * radius * 2,
      y: (Math.random() - 0.5) * radius * 2,
      z: (Math.random() - 0.5) * radius * 2
    });
  }

  for (let i = 0; i < count; i++) {
    const distances = points.map((p, j) => ({
      index: j,
      dist: Math.hypot(p.x - points[i].x, p.y - points[i].y, p.z - points[i].z)
    }));
    distances.sort((a, b) => a.dist - b.dist);
    
    const connections = 2 + Math.floor(Math.random() * 2);
    for (let k = 1; k <= connections; k++) {
      if (distances[k].index > i && distances[k].dist < radius * 0.8) {
        edges.push([i, distances[k].index]);
      }
    }
  }

  return { points, edges };
};

const generateNeural = (radius: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  
  const layers = [6, 12, 12, 8, 4];
  const layerSpacing = radius * 0.5;
  const nodeSpacing = radius * 0.2;
  
  const startX = -(layers.length - 1) * layerSpacing / 2;
  
  const layerIndices: number[][] = [];

  layers.forEach((nodeCount, i) => {
    const currentLayerIndices: number[] = [];
    const startY = -(nodeCount - 1) * nodeSpacing / 2;
    const x = startX + i * layerSpacing;
    
    for (let j = 0; j < nodeCount; j++) {
      const y = startY + j * nodeSpacing;
      const z = (Math.random() - 0.5) * radius * 0.4;
      
      currentLayerIndices.push(points.length);
      points.push({ x, y, z });
    }
    layerIndices.push(currentLayerIndices);
  });

  for (let i = 0; i < layerIndices.length - 1; i++) {
    const currentLayer = layerIndices[i];
    const nextLayer = layerIndices[i + 1];
    
    currentLayer.forEach(n1 => {
      nextLayer.forEach(n2 => {
        if (Math.random() > 0.3) {
          edges.push([n1, n2]);
        }
      });
    });
  }

  return { points, edges };
};

const generateOntology = (radius: number, detail: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];

  // Root node
  points.push({ x: 0, y: 0, z: 0 });

  const numCategories = Math.max(3, Math.floor(detail / 1.5));
  const nodesPerCategory = Math.max(4, detail);

  for (let i = 0; i < numCategories; i++) {
    // Category nodes (Level 1) distributed on a sphere
    const phi = Math.acos(-1 + (2 * i) / numCategories);
    const theta = Math.sqrt(numCategories * Math.PI) * phi;
    
    const cx = radius * 0.4 * Math.cos(theta) * Math.sin(phi);
    const cy = radius * 0.4 * Math.sin(theta) * Math.sin(phi);
    const cz = radius * 0.4 * Math.cos(phi);

    const categoryIndex = points.length;
    points.push({ x: cx, y: cy, z: cz });
    edges.push([0, categoryIndex]);

    // Sub-nodes (Level 2)
    for (let j = 0; j < nodesPerCategory; j++) {
      const subPhi = Math.acos(-1 + (2 * j) / nodesPerCategory);
      const subTheta = Math.sqrt(nodesPerCategory * Math.PI) * subPhi;
      
      const subRadius = radius * 0.4;
      const nx = cx + subRadius * Math.cos(subTheta) * Math.sin(subPhi);
      const ny = cy + subRadius * Math.sin(subTheta) * Math.sin(subPhi);
      const nz = cz + subRadius * Math.cos(subPhi);

      const nodeIndex = points.length;
      points.push({ x: nx, y: ny, z: nz });
      edges.push([categoryIndex, nodeIndex]);
      
      // Cross-link within category
      if (j > 0 && Math.random() > 0.7) {
        edges.push([nodeIndex, categoryIndex + 1 + Math.floor(Math.random() * j)]);
      }
    }
  }

  // Cross-category links
  const totalPoints = points.length;
  for (let i = 0; i < numCategories * 2; i++) {
    const catA = Math.floor(Math.random() * numCategories);
    const catB = Math.floor(Math.random() * numCategories);
    if (catA !== catB) {
      const nodeA = 1 + catA * (nodesPerCategory + 1) + 1 + Math.floor(Math.random() * nodesPerCategory);
      const nodeB = 1 + catB * (nodesPerCategory + 1) + 1 + Math.floor(Math.random() * nodesPerCategory);
      if (nodeA < totalPoints && nodeB < totalPoints) {
        edges.push([nodeA, nodeB]);
      }
    }
  }

  return { points, edges };
};

const generateHelix = (radius: number, height: number, turns: number, segments: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * turns;
    
    points.push({
      x: Math.cos(angle) * radius,
      y: (t - 0.5) * height,
      z: Math.sin(angle) * radius
    });
    
    points.push({
      x: Math.cos(angle + Math.PI) * radius,
      y: (t - 0.5) * height,
      z: Math.sin(angle + Math.PI) * radius
    });

    if (i > 0) {
      const curr1 = i * 2;
      const curr2 = i * 2 + 1;
      const prev1 = (i - 1) * 2;
      const prev2 = (i - 1) * 2 + 1;
      edges.push([prev1, curr1]);
      edges.push([prev2, curr2]);
      
      if (i % Math.floor(segments / (turns * 10)) === 0) {
        edges.push([curr1, curr2]);
      }
    }
  }
  return { points, edges };
};

const generateMobius = (radius: number, width: number, segments: number, widthSegments: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;
    for (let j = 0; j <= widthSegments; j++) {
      const v = (j / widthSegments - 0.5) * width;
      
      const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
      const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
      const z = v * Math.sin(u / 2);
      
      points.push({ x, y, z });
      
      if (i < segments && j < widthSegments) {
        const current = i * (widthSegments + 1) + j;
        const next = current + 1;
        const bottom = (i + 1) * (widthSegments + 1) + j;
        edges.push([current, next]);
        edges.push([current, bottom]);
      }
    }
  }
  return { points, edges };
};

const generatePyramid = (size: number): ShapeData => {
  const points: Point3D[] = [
    { x: 0, y: -size, z: 0 },
    { x: -size, y: size, z: -size },
    { x: size, y: size, z: -size },
    { x: size, y: size, z: size },
    { x: -size, y: size, z: size },
  ];
  const edges: Edge[] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 1]
  ];
  return { points, edges };
};

const generateCylinder = (radius: number, height: number, segments: number): ShapeData => {
  const points: Point3D[] = [];
  const edges: Edge[] = [];
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    points.push({ x, y: -height / 2, z });
    points.push({ x, y: height / 2, z });
    
    const topCurr = i * 2;
    const botCurr = i * 2 + 1;
    const topNext = ((i + 1) % segments) * 2;
    const botNext = ((i + 1) % segments) * 2 + 1;
    
    edges.push([topCurr, botCurr]);
    edges.push([topCurr, topNext]);
    edges.push([botCurr, botNext]);
  }
  
  const topCenter = points.length;
  points.push({ x: 0, y: -height / 2, z: 0 });
  const botCenter = points.length;
  points.push({ x: 0, y: height / 2, z: 0 });
  
  for (let i = 0; i < segments; i++) {
    edges.push([topCenter, i * 2]);
    edges.push([botCenter, i * 2 + 1]);
  }
  
  return { points, edges };
};

const generateIcosahedron = (radius: number): ShapeData => {
  const t = (1.0 + Math.sqrt(5.0)) / 2.0;
  
  let points: Point3D[] = [
    { x: -1, y:  t, z:  0 }, { x:  1, y:  t, z:  0 }, { x: -1, y: -t, z:  0 }, { x:  1, y: -t, z:  0 },
    { x:  0, y: -1, z:  t }, { x:  0, y:  1, z:  t }, { x:  0, y: -1, z: -t }, { x:  0, y:  1, z: -t },
    { x:  t, y:  0, z: -1 }, { x:  t, y:  0, z:  1 }, { x: -t, y:  0, z: -1 }, { x: -t, y:  0, z:  1 }
  ];
  
  points = points.map(p => {
    const length = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    return {
      x: (p.x / length) * radius,
      y: (p.y / length) * radius,
      z: (p.z / length) * radius
    };
  });

  const edges: Edge[] = [
    [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
    [1, 5], [1, 9], [1, 8], [1, 7],
    [11, 5], [5, 9], [9, 8], [8, 7], [7, 10], [10, 11],
    [11, 4], [4, 5], [5, 9], [9, 4], [4, 2],
    [2, 11], [2, 10], [2, 6], [2, 3], [2, 4],
    [10, 6], [6, 7], [7, 8], [8, 6], [6, 3],
    [3, 8], [3, 9], [3, 4]
  ];
  
  const uniqueEdges: Edge[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = Math.min(edge[0], edge[1]) + '-' + Math.max(edge[0], edge[1]);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEdges.push(edge);
    }
  }

  return { points, edges: uniqueEdges };
};

const rotatePoint = (p: Point3D, pitch: number, yaw: number, roll: number): Point3D => {
  let cos = Math.cos(yaw);
  let sin = Math.sin(yaw);
  let x1 = p.x * cos - p.z * sin;
  let z1 = p.z * cos + p.x * sin;
  let y1 = p.y;

  cos = Math.cos(pitch);
  sin = Math.sin(pitch);
  let y2 = y1 * cos - z1 * sin;
  let z2 = z1 * cos + y1 * sin;
  let x2 = x1;

  cos = Math.cos(roll);
  sin = Math.sin(roll);
  let x3 = x2 * cos - y2 * sin;
  let y3 = y2 * cos + x2 * sin;
  let z3 = z2;

  return { x: x3, y: y3, z: z3 };
};

export default function App() {
  const [shapeType, setShapeType] = useState('sphere');
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5, z: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [params, setParams] = useState({
    radius: 150,
    detail: 8,
    perspective: 600,
    strokeWidth: 1,
    strokeColor: '#ffffff',
    showPoints: true,
    showLines: true,
    pointSize: 2,
    particleCount: 800,
    animationSpeed: 1,
    tubeRadius: 40,
    length: 400,
    spacing: 60,
    arms: 4,
    turns: 3,
    width: 50,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const requestRef = useRef<number>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const baseShape = useMemo(() => {
    switch (shapeType) {
      case 'sphere': return generateSphere(params.detail, params.detail * 2, params.radius);
      case 'torus': return generateTorus(params.detail * 2, params.detail, params.radius, params.tubeRadius);
      case 'tunnel': return generateTunnel(params.detail, params.radius, params.length);
      case 'particles': return generateParticles(params.particleCount, params.radius);
      case 'cubes': return generateCubeGrid(params.radius * 0.4, params.spacing);
      case 'burst': return generateBurst(params.particleCount, params.radius);
      case 'orbital': return generateOrbital(params.radius, params.detail);
      case 'vortex': return generateVortex(params.radius, params.arms, params.detail * 2);
      case 'network': return generateNetwork(Math.floor(params.particleCount / 10), params.radius);
      case 'neural': return generateNeural(params.radius);
      case 'ontology': return generateOntology(params.radius, params.detail);
      case 'helix': return generateHelix(params.radius * 0.5, params.length, params.turns, params.detail * 10);
      case 'mobius': return generateMobius(params.radius, params.width, params.detail * 4, params.detail);
      case 'pyramid': return generatePyramid(params.radius);
      case 'cylinder': return generateCylinder(params.radius, params.length, params.detail * 2);
      case 'icosahedron': return generateIcosahedron(params.radius);
      default: return generateSphere(params.detail, params.detail * 2, params.radius);
    }
  }, [shapeType, params.radius, params.detail, params.particleCount, params.tubeRadius, params.length, params.spacing, params.arms, params.turns, params.width]);

  const animate = useCallback(() => {
    if (isAnimating && !isDragging.current) {
      setRotation(prev => ({
        x: prev.x + 0.002 * params.animationSpeed,
        y: prev.y + 0.005 * params.animationSpeed,
        z: prev.z
      }));
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isAnimating, params.animationSpeed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - lastMousePos.current.x;
    const deltaY = clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
      z: prev.z
    }));

    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const renderShape = () => {
    const width = 800;
    const height = 800;
    const cx = width / 2;
    const cy = height / 2;

    const projectedPoints = baseShape.points.map(p => {
      const rotated = rotatePoint(p, rotation.x, rotation.y, rotation.z);
      const scale = params.perspective / (params.perspective + rotated.z);
      return {
        x: rotated.x * scale + cx,
        y: rotated.y * scale + cy,
        z: rotated.z,
        scale
      };
    });

    const sortedEdges = [...baseShape.edges].map(edge => {
      const p1 = projectedPoints[edge[0]];
      const p2 = projectedPoints[edge[1]];
      const z = (p1.z + p2.z) / 2;
      return { edge, z };
    }).sort((a, b) => b.z - a.z);

    const sortedPoints = projectedPoints.map((p, i) => ({ ...p, index: i })).sort((a, b) => b.z - a.z);

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ background: 'transparent' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {params.showLines && sortedEdges.map(({ edge }, i) => {
          const p1 = projectedPoints[edge[0]];
          const p2 = projectedPoints[edge[1]];
          const opacity = Math.max(0.05, Math.min(1, (params.perspective - p1.z) / params.perspective));
          return (
            <line
              key={`e-${i}`}
              x1={p1.x.toFixed(2)}
              y1={p1.y.toFixed(2)}
              x2={p2.x.toFixed(2)}
              y2={p2.y.toFixed(2)}
              stroke={params.strokeColor}
              strokeWidth={(params.strokeWidth * ((p1.scale + p2.scale) / 2)).toFixed(2)}
              strokeOpacity={opacity.toFixed(2)}
              strokeLinecap="round"
            />
          );
        })}

        {params.showPoints && sortedPoints.map((p, i) => {
          const opacity = Math.max(0.1, Math.min(1, (params.perspective - p.z) / params.perspective));
          return (
            <circle
              key={`p-${i}`}
              cx={p.x.toFixed(2)}
              cy={p.y.toFixed(2)}
              r={(params.pointSize * p.scale).toFixed(2)}
              fill={params.strokeColor}
              fillOpacity={opacity.toFixed(2)}
            />
          );
        })}
      </svg>
    );
  };

  const copySvg = () => {
    if (svgRef.current) {
      const svgData = svgRef.current.outerHTML;
      navigator.clipboard.writeText(svgData);
      alert('SVG copied to clipboard!');
    }
  };

  const downloadSvg = () => {
    if (svgRef.current) {
      const svgData = svgRef.current.outerHTML;
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shape-${shapeType}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyCss = () => {
    const duration = params.animationSpeed > 0 ? 20 / params.animationSpeed : 0;
    const animationRule = duration > 0 ? `animation: rotate3d ${duration.toFixed(1)}s linear infinite;` : '';
    const css = `
/* CSS for SVG Animation */
.animated-svg-container {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animated-svg {
  width: 100%;
  max-width: 800px;
  ${animationRule}
  transform-style: preserve-3d;
}

@keyframes rotate3d {
  from { transform: rotateX(0deg) rotateY(0deg); }
  to { transform: rotateX(360deg) rotateY(360deg); }
}
    `;
    navigator.clipboard.writeText(css);
    alert('CSS copied to clipboard!');
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col h-full overflow-y-auto z-10 shadow-2xl">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <Settings2 className="w-5 h-5 text-blue-500" />
            ShapeGen 3D
          </h1>
          <p className="text-xs text-gray-500 mt-2">Interactive SVG Generator</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Shape Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shape Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['sphere', 'torus', 'tunnel', 'particles', 'cubes', 'burst', 'orbital', 'vortex', 'network', 'neural', 'ontology', 'helix', 'mobius', 'pyramid', 'cylinder', 'icosahedron'].map(type => (
                <button
                  key={type}
                  onClick={() => setShapeType(type)}
                  className={`px-3 py-2.5 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                    shapeType === type 
                      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' 
                      : 'bg-[#111] text-gray-400 border border-transparent hover:bg-[#1a1a1a] hover:text-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Parameters</label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Radius / Size</span>
                <span className="font-mono text-gray-500">{params.radius}</span>
              </div>
              <input
                type="range"
                min="50" max="300"
                value={params.radius}
                onChange={e => setParams({...params, radius: Number(e.target.value)})}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {['sphere', 'torus', 'tunnel', 'orbital', 'vortex', 'ontology', 'helix', 'mobius', 'cylinder'].includes(shapeType) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Detail</span>
                  <span className="font-mono text-gray-500">{params.detail}</span>
                </div>
                <input
                  type="range"
                  min="4" max="32"
                  value={params.detail}
                  onChange={e => setParams({...params, detail: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {['particles', 'burst', 'network'].includes(shapeType) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Count</span>
                  <span className="font-mono text-gray-500">{params.particleCount}</span>
                </div>
                <input
                  type="range"
                  min="100" max="2000" step="100"
                  value={params.particleCount}
                  onChange={e => setParams({...params, particleCount: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {shapeType === 'torus' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Tube Radius</span>
                  <span className="font-mono text-gray-500">{params.tubeRadius}</span>
                </div>
                <input
                  type="range"
                  min="10" max="100"
                  value={params.tubeRadius}
                  onChange={e => setParams({...params, tubeRadius: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {['tunnel', 'helix', 'cylinder'].includes(shapeType) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Length / Height</span>
                  <span className="font-mono text-gray-500">{params.length}</span>
                </div>
                <input
                  type="range"
                  min="100" max="800"
                  value={params.length}
                  onChange={e => setParams({...params, length: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {shapeType === 'cubes' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Spacing</span>
                  <span className="font-mono text-gray-500">{params.spacing}</span>
                </div>
                <input
                  type="range"
                  min="20" max="150"
                  value={params.spacing}
                  onChange={e => setParams({...params, spacing: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {shapeType === 'vortex' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Arms</span>
                  <span className="font-mono text-gray-500">{params.arms}</span>
                </div>
                <input
                  type="range"
                  min="2" max="12"
                  value={params.arms}
                  onChange={e => setParams({...params, arms: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {shapeType === 'helix' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Turns</span>
                  <span className="font-mono text-gray-500">{params.turns}</span>
                </div>
                <input
                  type="range"
                  min="1" max="10" step="0.5"
                  value={params.turns}
                  onChange={e => setParams({...params, turns: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {shapeType === 'mobius' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Width</span>
                  <span className="font-mono text-gray-500">{params.width}</span>
                </div>
                <input
                  type="range"
                  min="10" max="150"
                  value={params.width}
                  onChange={e => setParams({...params, width: Number(e.target.value)})}
                  className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Perspective</span>
                <span className="font-mono text-gray-500">{params.perspective}</span>
              </div>
              <input
                type="range"
                min="200" max="1000"
                value={params.perspective}
                onChange={e => setParams({...params, perspective: Number(e.target.value)})}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Animation Speed</span>
                <span className="font-mono text-gray-500">{params.animationSpeed}x</span>
              </div>
              <input
                type="range"
                min="0" max="5" step="0.1"
                value={params.animationSpeed}
                onChange={e => setParams({...params, animationSpeed: Number(e.target.value)})}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Appearance</label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Stroke Weight</span>
                <span className="font-mono text-gray-500">{params.strokeWidth}</span>
              </div>
              <input
                type="range"
                min="0.1" max="10" step="0.1"
                value={params.strokeWidth}
                onChange={e => setParams({...params, strokeWidth: Number(e.target.value)})}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Point Size</span>
                <span className="font-mono text-gray-500">{params.pointSize}</span>
              </div>
              <input
                type="range"
                min="0.1" max="15" step="0.1"
                value={params.pointSize}
                onChange={e => setParams({...params, pointSize: Number(e.target.value)})}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between bg-[#111] p-3 rounded-md border border-[#1a1a1a]">
              <span className="text-xs text-gray-300">Color</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase">{params.strokeColor}</span>
                <div className="relative w-6 h-6 rounded overflow-hidden border border-[#333]">
                  <input
                    type="color"
                    value={params.strokeColor}
                    onChange={e => setParams({...params, strokeColor: e.target.value})}
                    className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#111] p-3 rounded-md border border-[#1a1a1a]">
              <span className="text-xs text-gray-300">Show Lines</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={params.showLines} onChange={e => setParams({...params, showLines: e.target.checked})} />
                <div className="w-9 h-5 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between bg-[#111] p-3 rounded-md border border-[#1a1a1a]">
              <span className="text-xs text-gray-300">Show Points</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={params.showPoints} onChange={e => setParams({...params, showPoints: e.target.checked})} />
                <div className="w-9 h-5 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#1a1a1a] space-y-3 bg-[#0a0a0a]">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-md text-xs font-medium transition-colors"
          >
            {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAnimating ? 'Pause Rotation' : 'Auto Rotate'}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copySvg}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-md text-xs font-medium transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" /> Copy SVG
            </button>
            <button
              onClick={copyCss}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-md text-xs font-medium transition-colors"
            >
              <FileImage className="w-3.5 h-3.5" /> Copy CSS
            </button>
          </div>
          
          <button
            onClick={downloadSvg}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Download className="w-3.5 h-3.5" /> Download SVG File
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-hidden">
        {/* Abstract background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-[#111]/80 backdrop-blur-md border border-[#222] rounded-full text-gray-400 text-xs pointer-events-none">
          <MousePointer2 className="w-3.5 h-3.5" />
          Drag to rotate in 3D space
        </div>
        
        <div className="w-full h-full max-w-4xl max-h-4xl p-12 flex items-center justify-center">
          {renderShape()}
        </div>
      </div>
    </div>
  );
}
