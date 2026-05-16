import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { PLYLoader, STLLoader } from 'three-stdlib';
import * as THREE from 'three';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
  Camera,
  Palette
} from 'lucide-react';

interface ModelFile {
  id: string;
  url: string;
  name: string;
}

interface DentalModelProps {
  url: string;
  visible: boolean;
  opacity: number;
  useOriginalColor: boolean;
  onLoaded?: () => void;
}

interface ViewerProps {
  files: ModelFile[];
  caseId?: string;
}

// Background color from reference image (purple/violet)
const BACKGROUND_COLOR = '#5D5A87';

// Sand beige color - warm tan matching reference
const SAND_BEIGE = new THREE.Color('#C9B896');

// Single dental model component - preserves original coordinates
function DentalModel({ url, visible, opacity, useOriginalColor, onLoaded }: DentalModelProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [hasVertexColors, setHasVertexColors] = useState(false);
  const [loading, setLoading] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);

    // Determine file type from URL
    const isSTL = url.toLowerCase().endsWith('.stl');
    const isPLY = url.toLowerCase().endsWith('.ply');

    const loadGeometry = () => {
      if (isSTL) {
        const loader = new STLLoader();
        loader.load(
          url,
          (loadedGeometry) => {
            loadedGeometry.computeVertexNormals();
            setHasVertexColors(false); // STL doesn't have vertex colors
            loadedGeometry.computeBoundingBox();
            setGeometry(loadedGeometry);
            setLoading(false);
            onLoaded?.();
          },
          undefined,
          (err) => {
            console.error('Error loading STL:', err);
            setLoading(false);
          }
        );
      } else {
        // Default to PLY loader
        const loader = new PLYLoader();
        loader.load(
          url,
          (loadedGeometry) => {
            loadedGeometry.computeVertexNormals();
            const hasColors = loadedGeometry.hasAttribute('color');
            setHasVertexColors(hasColors);
            loadedGeometry.computeBoundingBox();
            setGeometry(loadedGeometry);
            setLoading(false);
            onLoaded?.();
          },
          undefined,
          (err) => {
            console.error('Error loading PLY:', err);
            setLoading(false);
          }
        );
      }
    };

    loadGeometry();

    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [url]);

  // Update material when useOriginalColor changes
  useEffect(() => {
    if (materialRef.current && geometry) {
      const showVertexColors = hasVertexColors && useOriginalColor;
      materialRef.current.vertexColors = showVertexColors;
      materialRef.current.color = showVertexColors ? new THREE.Color(0xffffff) : SAND_BEIGE;
      materialRef.current.roughness = 0.6;
      materialRef.current.metalness = 0;
      materialRef.current.needsUpdate = true;
    }
  }, [useOriginalColor, hasVertexColors, geometry]);

  if (!visible || loading || !geometry) return null;

  const showVertexColors = hasVertexColors && useOriginalColor;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={materialRef}
        vertexColors={showVertexColors}
        color={showVertexColors ? 0xffffff : SAND_BEIGE}
        roughness={0.6}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Custom controls - standard Three.js controls
function CustomControls() {
  const controlsRef = useRef<any>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      minDistance={10}
      maxDistance={1000}
      zoomSpeed={1.2}
      panSpeed={1}
      rotateSpeed={0.8}
    />
  );
}

// Loading indicator
function LoadingIndicator() {
  const { t } = useTranslation();
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">{t('viewer3d.loadingShort')}</p>
      </div>
    </Html>
  );
}

// Camera-following light - always illuminates from viewer's perspective
function CameraLight() {
  const { camera } = useThree();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      // Position light at camera position
      lightRef.current.position.copy(camera.position);
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={0.9}
      color="#fff8f0"
    />
  );
}

// Main viewer component
export function Dental3DViewer({ files, caseId }: ViewerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useOriginalColor, setUseOriginalColor] = useState(true);

  // State for each file - visibility and opacity
  const [fileStates, setFileStates] = useState<Record<string, { visible: boolean; opacity: number; loaded: boolean }>>({});

  // Initialize file states when files change
  useEffect(() => {
    const initialStates: Record<string, { visible: boolean; opacity: number; loaded: boolean }> = {};
    files.forEach(file => {
      initialStates[file.id] = { visible: true, opacity: 1, loaded: false };
    });
    setFileStates(initialStates);
  }, [files]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const takeScreenshot = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `scan-${caseId || 'model'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const resetView = () => {
    // Reset all files to visible and full opacity
    const resetStates: Record<string, { visible: boolean; opacity: number; loaded: boolean }> = {};
    Object.keys(fileStates).forEach(id => {
      resetStates[id] = { ...fileStates[id], visible: true, opacity: 1 };
    });
    setFileStates(resetStates);
    setUseOriginalColor(true);
  };

  const toggleFileVisibility = (fileId: string) => {
    setFileStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], visible: !prev[fileId].visible }
    }));
  };

  const setFileOpacity = (fileId: string, opacity: number) => {
    setFileStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], opacity }
    }));
  };

  const setFileLoaded = (fileId: string) => {
    setFileStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], loaded: true }
    }));
  };

  const allLoaded = files.length > 0 && files.every(f => fileStates[f.id]?.loaded);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[500px] rounded-2xl'
      }`}
    >
      {/* Solid Background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: BACKGROUND_COLOR }}
      />

      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <PerspectiveCamera makeDefault position={[80, 60, 80]} fov={45} />
        <CustomControls />

        {/* Lighting - Camera-following + ambient for uniform illumination */}
        <ambientLight intensity={0.6} color="#fff5e6" />
        <hemisphereLight args={['#fffaf0', '#5D5A87', 0.4]} />
        <CameraLight />
        <directionalLight position={[0, 100, 0]} intensity={0.3} color="#ffffff" />
        <directionalLight position={[0, -50, 0]} intensity={0.2} color="#e8e0d8" />

        {/* Models - NO centering, keep original coordinates */}
        <Suspense fallback={<LoadingIndicator />}>
          <group>
            {files.map((file) => (
              <DentalModel
                key={`${file.id}-${useOriginalColor}`}
                url={file.url}
                visible={fileStates[file.id]?.visible ?? true}
                opacity={fileStates[file.id]?.opacity ?? 1}
                useOriginalColor={useOriginalColor}
                onLoaded={() => setFileLoaded(file.id)}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>

      {/* Left Side - Color Toggle Only */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2">
          <button
            onClick={() => setUseOriginalColor(!useOriginalColor)}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              useOriginalColor
                ? 'bg-white/70 text-neutral-700'
                : 'bg-amber-200/70 text-amber-800'
            }`}
            title={useOriginalColor ? t('viewer3d.switchToSandBeige') : t('viewer3d.switchToOriginalColor')}
          >
            <Palette size={16} />
          </button>
        </div>
      </div>

      {/* Right Side Panel - File Controls with Scroll */}
      <div className="absolute top-4 right-4 bottom-20 w-48 flex flex-col gap-2">
        {/* Top controls */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-1 flex items-center justify-end gap-1 flex-shrink-0">
          <button
            onClick={resetView}
            className="w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={takeScreenshot}
            className="w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            title="Screenshot"
          >
            <Camera size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            title={isFullscreen ? 'Esci Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* File controls - scrollable */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            {files.map((file) => {
              const state = fileStates[file.id] || { visible: true, opacity: 1 };
              return (
                <div key={file.id} className="flex flex-col gap-1">
                  {/* File name and visibility toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFileVisibility(file.id)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                        state.visible
                          ? 'bg-white/70 text-neutral-700'
                          : 'bg-white/10 text-white/30'
                      }`}
                      title={state.visible ? 'Nascondi' : 'Mostra'}
                    >
                      {state.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <span
                      className="text-white/70 text-[10px] truncate flex-1"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </div>

                  {/* Opacity slider */}
                  <div className="flex items-center gap-2 pl-8">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.opacity * 100}
                      onChange={(e) => setFileOpacity(file.id, Number(e.target.value) / 100)}
                      className="flex-1 h-1 bg-white/15 rounded-full appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:cursor-pointer"
                      title={`${t('viewer3d.opacityLabel')} ${Math.round(state.opacity * 100)}%`}
                      disabled={!state.visible}
                    />
                    <span className="text-white/30 text-[9px] w-6 text-right">
                      {Math.round(state.opacity * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls Help - Bottom Left */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black/15 backdrop-blur-sm rounded-lg px-2 py-1 text-[9px] text-white/30">
          <span className="text-white/50">SX</span> {t('viewer3d.rotate')} • <span className="text-white/50">DX</span> {t('viewer3d.pan')} • <span className="text-white/50">Scroll</span> {t('viewer3d.zoom')}
        </div>
      </div>

      {/* Shen3D Logo - Bottom Right (MUCH larger) */}
      <div className="absolute bottom-4 right-4">
        <img
          src="/logo-shen3d.png"
          alt="Shen3D"
          className="h-32 opacity-50"
          style={{ filter: 'brightness(1.4)' }}
        />
      </div>

      {/* Loading indicator overlay */}
      {!allLoaded && files.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="text-center text-white">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Caricamento modelli...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dental3DViewer;
