// // src/components/DrumShell.js
// import React, { useRef, useEffect, forwardRef } from 'react';
// import { useGLTF, useTexture } from '@react-three/drei';
// import * as THREE from 'three';

// const MODEL_PATH = '/models/16stave.glb';

// const veneerMap = {
//   'walnut-burl': '/textures/veneers/walnut-burl.jpg',
//   'mappa-burl': '/textures/veneers/mappa-burl.jpg',
//   'bubinga-waterfall': '/textures/veneers/bubinga-waterfall.jpg',
// };

// const DrumShell = forwardRef(({ veneer = 'walnut-burl' }, ref) => {
//   const shellRef = useRef();
//   const { scene } = useGLTF(MODEL_PATH);
//   const texturePath = veneerMap[veneer] || veneerMap['walnut-burl'];
//   const map = useTexture(texturePath);

//   useEffect(() => {
//     if (!scene || !map) return;

//     map.wrapS = map.wrapT = THREE.RepeatWrapping;
//     map.repeat.set(5, 1); // ⬅️ Tweak X (circumference) and Y (height) repeats here
//     map.encoding = THREE.sRGBEncoding;

//     const veneerMaterial = new THREE.MeshStandardMaterial({
//       map,
//       metalness: 0.1,
//       roughness: 1.0,
//     });

//     scene.traverse((child) => {
//       if (child.isMesh) {
//         if (child.name === 'ExteriorVeneer') {
//           child.material = veneerMaterial;
//         }
//         child.castShadow = true;
//         child.receiveShadow = true;
//       }
//     });

//     const box = new THREE.Box3().setFromObject(scene);
//     const center = new THREE.Vector3();
//     box.getCenter(center);
//     scene.position.sub(center);

//     shellRef.current = scene;
//     if (ref) ref.current = scene;
//   }, [scene, map, ref, veneer]);

//   return <primitive object={scene} />;
// });

// useGLTF.preload(MODEL_PATH);
// export default DrumShell;