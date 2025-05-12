// import React, { Suspense, useRef, useState, useEffect } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
// import * as THREE from 'three';
// import DrumShell from './DrumShell';
// import './DrumViewer.css';

// const DrumViewer = () => {
//   const [veneer, setVeneer] = useState('walnut-burl');
//   const [isShiftDown, setIsShiftDown] = useState(false);
//   const shellRef = useRef();
//   const orbitRef = useRef();
//   const cameraRef = useRef();
//   const lightRef = useRef();

//   const resetView = () => {
//     const shell = shellRef.current;
//     const camera = cameraRef.current;
//     const controls = orbitRef.current;

//     if (!shell || !camera || !controls) return;

//     const box = new THREE.Box3().setFromObject(shell);
//     const size = new THREE.Vector3();
//     const center = new THREE.Vector3();
//     box.getSize(size);
//     box.getCenter(center);

//     const maxDim = Math.max(size.x, size.y, size.z);
//     const padding = 1.3;
//     const fov = camera.fov * (Math.PI / 180);
//     const distance = (maxDim * padding) / (2 * Math.tan(fov / 2));

//     camera.position.set(center.x, center.y, distance);
//     camera.lookAt(center);
//     camera.updateProjectionMatrix();

//     controls.target.copy(center);
//     controls.update();
//   };

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === 'Shift') setIsShiftDown(true);
//     };
//     const handleKeyUp = (e) => {
//       if (e.key === 'Shift') setIsShiftDown(false);
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     window.addEventListener('keyup', handleKeyUp);
//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//       window.removeEventListener('keyup', handleKeyUp);
//     };
//   }, []);

//   useEffect(() => {
//     if (shellRef.current && cameraRef.current && orbitRef.current) {
//       setTimeout(resetView, 100);
//     }
//   }, [veneer]);

//   return (
//     <div className="viewer-wrapper">
//       <div className="controls">
//         <button onClick={() => setVeneer('walnut-burl')}>Walnut Burl</button>
//         <button onClick={() => setVeneer('mappa-burl')}>Mappa Burl</button>
//         <button onClick={() => setVeneer('bubinga-waterfall')}>Bubinga Waterfall</button>
//         <button onClick={resetView}>🔄 Reset View</button>
//       </div>

//       <div className="hint-overlay">
//         💡 <strong>Tip:</strong> Shift + drag (desktop) or two fingers (mobile) to move light
//       </div>

//       <div className="canvas-container">
//         <Canvas
//           shadows
//           camera={{ position: [0, 0, 5], fov: 40 }}
//           onCreated={({ camera }) => {
//             cameraRef.current = camera;
//           }}
//         >
//           <ambientLight intensity={0.5} />
//           <directionalLight
//             ref={lightRef}
//             position={[4, 6, 4]}
//             intensity={1.4}
//             castShadow
//             shadow-mapSize-width={1024}
//             shadow-mapSize-height={1024}
//           />
//           <Suspense fallback={null}>
//             <DrumShell veneer={veneer} ref={shellRef} />
//           </Suspense>
//           <OrbitControls ref={orbitRef} enablePan={false} enableRotate={!isShiftDown} />
//         </Canvas>
//       </div>
//     </div>
//   );
// };

// export default DrumViewer;