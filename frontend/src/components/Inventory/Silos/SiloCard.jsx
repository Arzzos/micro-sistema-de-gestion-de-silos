import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Definimos un color dorado para la iluminación y los detalles
const GOLDEN_COLOR = "#c9a14a";

// Componente para la estructura física del silo
const SiloStructure = React.memo(({ coneRadius, coneHeight, cylinderRadius, cylinderHeight, onHover, onOut, ladderPosition }) => {
  // Material del cuerpo del silo ahora con transparencia
  const transparentMaterial = new THREE.MeshPhysicalMaterial({
    color: '#8b807a',
    metalness: 0.8,
    roughness: 0.3,
    transmission: 0.8, // Permite el paso de la luz a través del material
    transparent: true,
    opacity: 0.5,
  });

  const GOLD_MATERIAL = new THREE.MeshStandardMaterial({
    color: GOLDEN_COLOR,
    metalness: 0.9,
    roughness: 0.2,
    emissive: GOLDEN_COLOR,
    emissiveIntensity: 0.1,
  });

  const RUNG_MATERIAL = new THREE.MeshStandardMaterial({
    color: '#333333',
    metalness: 0.5,
    roughness: 0.5,
  });

  return (
    <group>
      {/* Cuerpo principal del silo con material transparente */}
      <mesh material={transparentMaterial} onPointerOver={() => onHover("Cuerpo del silo")} onPointerOut={onOut} castShadow receiveShadow>
        <cylinderGeometry args={[cylinderRadius, cylinderRadius, cylinderHeight, 64]} />
      </mesh>
      
      {/* Tapa superior del silo */}
      <mesh material={GOLD_MATERIAL} position={[0, cylinderHeight / 2 + 0.02, 0]} onPointerOver={() => onHover("Tapa superior del silo")} onPointerOut={onOut}>
        <ringGeometry args={[cylinderRadius, cylinderRadius + 0.1, 64]} />
      </mesh>
      <mesh material={GOLD_MATERIAL} position={[0, cylinderHeight / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} onPointerOver={() => onHover("Techo del silo")} onPointerOut={onOut} castShadow>
        <circleGeometry args={[cylinderRadius, 64]} />
      </mesh>

      {/* Faldón cónico con el ángulo de 45 grados */}
      <mesh position={[0, -cylinderHeight / 2 - coneHeight / 2, 0]} material={transparentMaterial} onPointerOver={() => onHover("Faldón cónico")} onPointerOut={onOut} castShadow receiveShadow>
        <coneGeometry args={[coneRadius, coneHeight, 64]} />
      </mesh>

      {/* Anillos de refuerzo exteriores */}
      {Array.from({ length: 7 }).map((_, i) => {
        const yPos = (cylinderHeight / 2) - (i + 1) * (cylinderHeight / 8);
        return (
          <motion.mesh
            key={`ring-${i}`}
            position={[0, yPos, cylinderRadius + 0.05]}
            material={GOLD_MATERIAL}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerOver={() => onHover("Anillo de refuerzo")}
            onPointerOut={onOut}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 120 }}
          >
            <ringGeometry args={[cylinderRadius, cylinderRadius + 0.05, 64]} />
          </motion.mesh>
        );
      })}

      {/* Escalera mejorada */}
      {/* Rieles verticales */}
      <motion.mesh
        position={[ladderPosition, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={RUNG_MATERIAL}
        initial={{ y: cylinderHeight }}
        animate={{ y: 0 }}
        transition={{ delay: 1.0, duration: 1.0 }}
      >
        <cylinderGeometry args={[0.05, 0.05, cylinderHeight, 16]} />
      </motion.mesh>
      <motion.mesh
        position={[ladderPosition + 0.4, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={RUNG_MATERIAL}
        initial={{ y: cylinderHeight }}
        animate={{ y: 0 }}
        transition={{ delay: 1.1, duration: 1.0 }}
      >
        <cylinderGeometry args={[0.05, 0.05, cylinderHeight, 16]} />
      </motion.mesh>
      {/* Peldaños de la escalera */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.mesh
          key={`rung-${i}`}
          position={[ladderPosition + 0.2, -cylinderHeight / 2 + (cylinderHeight / 20) * (i + 0.5), 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={RUNG_MATERIAL}
          onPointerOver={() => onHover("Peldaño de la escalera")}
          onPointerOut={onOut}
          initial={{ x: ladderPosition + 1.5, opacity: 0 }}
          animate={{ x: ladderPosition + 0.2, opacity: 1 }}
          transition={{ delay: 1.2 + i * 0.03 }}
        >
          <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
        </motion.mesh>
      ))}

      {/* Tolva de descarga */}
      <motion.mesh 
        position={[0, -cylinderHeight / 2 - coneHeight - 0.2, 0]}
        material={GOLD_MATERIAL}
        onPointerOver={() => onHover("Tolva de descarga")}
        onPointerOut={onOut}
        initial={{ y: -cylinderHeight / 2 - coneHeight - 2, opacity: 0 }}
        animate={{ y: -cylinderHeight / 2 - coneHeight - 0.2, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 150 }}
      >
        <cylinderGeometry args={[0.2, 0.3, 0.4, 32]} />
      </motion.mesh>
    </group>
  );
});

// Partículas que caen
const FallingParticles = ({ fillPercentage }) => {
  const mesh = useRef();
  const particleCount = 200;
  
  useEffect(() => {
    // Inicializar partículas
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    const cylinderHeight = 13.30;
    const cylinderRadius = 4.69 / 2;
    
    for (let i = 0; i < particleCount; i++) {
      const y = (Math.random() * cylinderHeight) - cylinderHeight / 2 + cylinderHeight * (1 - fillPercentage / 100);
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * cylinderRadius * 0.9;
      positions[i * 3 + 0] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
      velocities[i * 3 + 1] = -(0.01 + Math.random() * 0.05); // Velocidad de caída
      colors[i * 3 + 0] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mesh.current.geometry = geometry;
  }, [fillPercentage]);

  useFrame(() => {
    // Actualizar la posición de las partículas
    if (mesh.current) {
      const positions = mesh.current.geometry.attributes.position.array;
      const coneHeight = 3.29;
      const cylinderHeight = 13.30;
      const fillHeight = (cylinderHeight + coneHeight) * (fillPercentage / 100) - coneHeight;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += -0.01; // Velocidad de caída constante para el ejemplo
        if (positions[i * 3 + 1] < -cylinderHeight / 2 + fillHeight) {
          positions[i * 3 + 1] = cylinderHeight / 2 + 1; // Volver a la parte superior
        }
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry attach="geometry" />
      <pointsMaterial
        size={0.1}
        vertexColors={true}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
};

// Componente para la visualización 3D del silo
function Silo3D({ fillPercentage, statusColor, onHover, onOut }) {
  const siloBodyRef = useRef();
  const [animatedFillPercentage, setAnimatedFillPercentage] = useState(fillPercentage);

  // MANTENEMOS LAS DIMENSIONES FIJAS DEL MODELO 3D
  const coneRadius = 4.69 / 2;
  const coneHeight = 3.29;
  const cylinderRadius = 4.69 / 2;
  const cylinderHeight = 13.30;
  const ladderPosition = cylinderRadius;
  
  const fillRadiusOffset = 0.05;
  
  useFrame((state, delta) => {
    // Animación de rotación para la estructura 3D
    if (siloBodyRef.current) {
      siloBodyRef.current.rotation.y += 0.005;
    }
    // Animación suave del nivel de llenado
    if (fillPercentage !== animatedFillPercentage) {
      const speed = 0.5;
      const diff = fillPercentage - animatedFillPercentage;
      setAnimatedFillPercentage(prev => prev + diff * speed * delta);
    }
  });

  // Material para el relleno del silo
  const color = new THREE.Color(statusColor);
  const fillMaterial = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.8 });

  // Cálculo del volumen para el relleno
  const fillCylinderRadius = cylinderRadius - fillRadiusOffset;
  const fillConeRadius = coneRadius - fillRadiusOffset;
  const cylinderVolume = Math.PI * fillCylinderRadius * fillCylinderRadius * cylinderHeight;
  const coneVolume = (1 / 3) * Math.PI * fillConeRadius * fillConeRadius * coneHeight;
  const totalVolume = coneVolume + cylinderVolume;
  
  const filledVolume = (animatedFillPercentage / 100) * totalVolume;

  const fillMeshes = [];
  let remainingVolume = filledVolume;

  // Rellenar el cono primero
  if (remainingVolume > 0 && coneVolume > 0) {
    const bottomConeFillVolume = Math.min(remainingVolume, coneVolume);
    const bottomConeFillHeight = coneHeight * Math.cbrt(bottomConeFillVolume / coneVolume);
    const bottomConeFillTopRadius = fillConeRadius * (bottomConeFillHeight / coneHeight);
    const bottomConeFillPosition = [0, -(cylinderHeight / 2) - coneHeight + (bottomConeFillHeight / 2), 0];
    
    fillMeshes.push(
      <mesh key="bottom-cone-fill" position={bottomConeFillPosition} rotation={[Math.PI, 0, 0]} material={fillMaterial}>
        <coneGeometry args={[bottomConeFillTopRadius, bottomConeFillHeight, 32]} />
      </mesh>
    );
    remainingVolume -= bottomConeFillVolume;
  }

  // Rellenar el cilindro después
  if (remainingVolume > 0 && cylinderVolume > 0) {
    const cylinderFillVolume = Math.min(remainingVolume, cylinderVolume);
    const cylinderFillHeight = cylinderFillVolume / (Math.PI * fillCylinderRadius * fillCylinderRadius);
    const cylinderFillPosition = [0, -cylinderHeight / 2 + (cylinderFillHeight / 2), 0];

    fillMeshes.push(
      <mesh key="cylinder-fill" position={cylinderFillPosition} material={fillMaterial}>
        <cylinderGeometry args={[fillCylinderRadius, fillCylinderRadius, cylinderFillHeight, 32]} />
      </mesh>
    );
    remainingVolume -= cylinderFillVolume;
  }
  
  return (
    <group ref={siloBodyRef} scale={[1, 1, 1]}>
      <SiloStructure 
        coneRadius={coneRadius} 
        coneHeight={coneHeight} 
        cylinderRadius={cylinderRadius} 
        cylinderHeight={cylinderHeight} 
        onHover={onHover}
        onOut={onOut}
        ladderPosition={ladderPosition}
      />
      {fillMeshes}
      {fillPercentage < 100 && <FallingParticles fillPercentage={fillPercentage} />}
    </group>
  );
}

// Custom control to prevent user from dragging the camera too far away
const ManualOrbitControls = () => {
  const controlsRef = useRef();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(6, 5, 8);

  // useFrame hook for continuous updates
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, document.querySelector('canvas')]}
      enablePan={false}
      minDistance={5}
      maxDistance={20}
    />
  );
};

// Main SiloCard component
const SiloCard = ({ silo }) => {
  const [hoveredText, setHoveredText] = useState(null);

  const getStatusColor = (porcentaje) => {
    if (porcentaje >= 80) return '#44ff44';
    if (porcentaje >= 60) return '#ffdd00';
    if (porcentaje >= 30) return '#ffaa00';
    return '#ff4444';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin lecturas';
    const date = new Date(`${dateString}Z`);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  };

  // El objeto `silo` que llega como prop contiene los datos dinámicos de la base de datos.
  // El modelo 3D usa dimensiones fijas, pero la tarjeta usa estos datos dinámicos.
  const statusColor = getStatusColor(silo.nivel_actual_porcentaje);

  const handleHover = (text) => {
    setHoveredText(text);
  };

  const handleOut = () => {
    setHoveredText(null);
  };

  return (
    <div className="bg-[#1e140a] rounded-xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] border border-[rgba(201,161,74,0.2)] min-w-[300px] max-w-[350px] transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-[0_12px_40px_0_rgba(201,161,74,0.3)] hover:border-[rgba(201,161,74,0.4)]">
      <div className="flex justify-between items-center mb-5 border-b-2 border-[#f0f0f0] pb-2">
        <h3 className="text-[#c9a14a] text-xl font-semibold drop-shadow-[0_2px_8px_rgba(116,68,20,0.5)]">{silo.nombre}</h3>
        <span className="bg-[rgba(201,161,74,0.2)] text-[#c9a14a] px-2 py-1 rounded-md text-sm font-medium border border-[rgba(201,161,74,0.3)]">
          {silo.capacidad_maxima_toneladas.toFixed(1) || '—'} ton max
        </span>
      </div>

      <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-[#2e221b] shadow-inner">
        <Canvas key={silo.nombre} camera={{ position: [6, 5, 8], fov: 75 }}>
          {/* Se ha mejorado la iluminación para un efecto más realista */}
          <color attach="background" args={['#2e221b']} />
          <ambientLight intensity={0.6} />
          <hemisphereLight skyColor={"#fff"} groundColor={"#000"} intensity={0.6} position={[0, 50, 0]} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color={GOLDEN_COLOR} castShadow />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
          
          <Silo3D 
            silo={silo} 
            fillPercentage={silo.nivel_actual_porcentaje} 
            statusColor={statusColor} 
            onHover={handleHover}
            onOut={handleOut}
          />
          <ManualOrbitControls />
        </Canvas>
        
        {hoveredText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-md z-10 transition-all duration-100 backdrop-blur-sm"
          >
            {hoveredText}
          </motion.div>
        )}

        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white text-shadow-lg">
          {silo.nivel_actual_porcentaje !== undefined ? `${silo.nivel_actual_porcentaje.toFixed(1)}%` : '—'}
        </div>
      </div>

      <div className="w-full mt-5">
        <div className="flex items-baseline justify-center mb-2">
          <span className="text-[2.5rem] font-bold leading-none text-[#c9a14a]">{silo.toneladas_actuales !== undefined ? silo.toneladas_actuales.toFixed(1) : '—'}</span>
          <span className="text-lg font-bold ml-1 text-[#c9a14a]">ton</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[rgba(201,161,74,0.1)]">
          <span className="font-medium text-[rgba(201,161,74,0.8)]">Última lectura:</span>
          <span className="font-semibold text-[#c9a14a]">{formatDate(silo.fecha_ultima_lectura)}</span>
        </div>
      </div>

      <div className="w-full mt-4">
        <div className="w-full h-2 bg-[rgba(0,0,0,0.2)] rounded-full overflow-hidden border border-[rgba(201,161,74,0.2)]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: `${silo.nivel_actual_porcentaje || 0}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SiloCard;