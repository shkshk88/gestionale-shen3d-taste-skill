import { Suspense, useRef, useState, useEffect } from 'react';
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
  name?: string;
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
function DentalModel({ url, name, visible, opacity, useOriginalColor, onLoaded }: DentalModelProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [hasVertexColors, setHasVertexColors] = useState(false);
  const [loading, setLoading] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);

    // Determine file type from name (original filename) or fallback to URL
    const fileRef = (name || url).toLowerCase();
    const isSTL = fileRef.endsWith('.stl');

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

// Custom controls - standard Three.js controls.
// `makeDefault` exposes the controls via useThree() so AutoFrame can retarget them.
function CustomControls() {
  const controlsRef = useRef<any>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      minDistance={1}
      maxDistance={5000}
      zoomSpeed={1.2}
      panSpeed={1}
      rotateSpeed={0.8}
    />
  );
}

// Frames the camera on the loaded model(s) and, crucially, sets the orbit pivot to
// the model center. Dental scans keep their original (often off-origin) coordinates,
// so without this the camera orbits around (0,0,0) and rotation feels inverted/wrong.
function AutoFrame({ trigger }: { trigger: number }) {
  const { scene, camera, controls } = useThree() as any;

  useEffect(() => {
    if (!controls) return;

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let hasMesh = false;
    scene.traverse((obj: any) => {
      if (obj.isMesh && obj.geometry && obj.visible) {
        box.expandByObject(obj);
        hasMesh = true;
      }
    });
    if (!hasMesh || box.isEmpty()) return;

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 100;

    // Place the camera along a consistent 3/4 view direction at a framing distance.
    const dir = new THREE.Vector3(0.8, 0.6, 1).normalize();
    camera.position.copy(center.clone().add(dir.multiplyScalar(maxDim * 2.2)));
    camera.near = Math.max(maxDim / 100, 0.1);
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return null;
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
  const [frameNonce, setFrameNonce] = useState(0);

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
    setFrameNonce((n) => n + 1); // re-frame the camera on the model
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
  const loadedCount = files.filter(f => fileStates[f.id]?.loaded).length;

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
        <AutoFrame trigger={loadedCount * 1000 + frameNonce} />

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
                name={file.name}
                visible={fileStates[file.id]?.visible ?? true}
                opacity={fileStates[file.id]?.opacity ?? 1}
                useOriginalColor={useOriginalColor}
                onLoaded={() => setFileLoaded(file.id)}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>

      {/* Unified control panel — everything in a single transparent tab (top-right) */}
      <div className="absolute top-3 right-3 z-10 w-52 max-h-[calc(100%-1.5rem)] flex flex-col bg-black/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-lg">
        {/* Action row */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10">
          <button
            onClick={resetView}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
            title={t('viewer3d.reset')}
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={takeScreenshot}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
            title={t('common.screenshot')}
          >
            <Camera size={15} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
            title={isFullscreen ? t('viewer3d.exitFullscreen') : t('viewer3d.fullscreen')}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setUseOriginalColor(!useOriginalColor)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              useOriginalColor ? 'bg-white/80 text-neutral-700' : 'bg-amber-300/80 text-amber-900'
            }`}
            title={useOriginalColor ? t('viewer3d.switchToSandBeige') : t('viewer3d.switchToOriginalColor')}
          >
            <Palette size={15} />
          </button>
        </div>

        {/* Models: visibility + opacity */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 min-h-[60px]">
          {files.map((file) => {
            const state = fileStates[file.id] || { visible: true, opacity: 1 };
            return (
              <div key={file.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFileVisibility(file.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                      state.visible ? 'bg-white/80 text-neutral-700' : 'bg-white/10 text-white/40'
                    }`}
                    title={state.visible ? t('viewer3d.hide') : t('viewer3d.show')}
                  >
                    {state.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <span className="text-white/80 text-[10px] truncate flex-1" title={file.name} dir="auto">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.opacity * 100}
                    onChange={(e) => setFileOpacity(file.id, Number(e.target.value) / 100)}
                    className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                    title={`${t('viewer3d.opacityLabel')} ${Math.round(state.opacity * 100)}%`}
                    disabled={!state.visible}
                  />
                  <span className="text-white/40 text-[9px] w-6 text-right">
                    {Math.round(state.opacity * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-2 border-t border-white/10 text-[9px] text-white/50 leading-tight">
          <span className="text-white/80">SX</span> {t('viewer3d.rotate')} · <span className="text-white/80">DX</span> {t('viewer3d.pan')} · <span className="text-white/80">Scroll</span> {t('viewer3d.zoom')}
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
            <p className="text-sm">{t('viewer3d.loadingModelsShort')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dental3DViewer;
