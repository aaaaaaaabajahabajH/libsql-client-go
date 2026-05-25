import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { colors } from "../theme/colors";

// Animated particle system for the hero background
function createParticleSystem(scene: THREE.Scene): THREE.Points {
  const count = 2000;
  const positions = new Float32Array(count * 3);
  const colorArr = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

    // Blue or orange particles
    const isBlue = Math.random() > 0.3;
    if (isBlue) {
      colorArr[i * 3] = 0;
      colorArr[i * 3 + 1] = 0.4;
      colorArr[i * 3 + 2] = 1.0;
    } else {
      colorArr[i * 3] = 1.0;
      colorArr[i * 3 + 1] = 0.42;
      colorArr[i * 3 + 2] = 0;
    }

    sizes[i] = Math.random() * 3 + 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

// Build a stylized brake disc / wheel rim as the hero 3D object
function createBrakeDisc(): THREE.Group {
  const group = new THREE.Group();

  // Rotor disc
  const rotorGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.18, 64, 1, false);
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x888899,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x220000,
    emissiveIntensity: 0.3,
  });
  const rotor = new THREE.Mesh(rotorGeom, rotorMat);
  group.add(rotor);

  // Drilled holes pattern
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const r = 1.6;
    const holeGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 16);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const hole = new THREE.Mesh(holeGeom, holeMat);
    hole.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    hole.rotation.x = Math.PI / 2;
    group.add(hole);
  }

  // Brake caliper (orange - Brembo style)
  const caliperGeom = new THREE.BoxGeometry(0.9, 0.5, 0.45);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0xff2200,
    emissiveIntensity: 0.2,
  });
  const caliper = new THREE.Mesh(caliperGeom, caliperMat);
  caliper.position.set(2.3, 0, 0);
  group.add(caliper);

  // Center hub
  const hubGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x444455,
    metalness: 1.0,
    roughness: 0.1,
  });
  const hub = new THREE.Mesh(hubGeom, hubMat);
  group.add(hub);

  // Wheel bolts
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const boltGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 1, roughness: 0.05 });
    const bolt = new THREE.Mesh(boltGeom, boltMat);
    bolt.position.set(Math.cos(angle) * 0.85, 0, Math.sin(angle) * 0.85);
    group.add(bolt);
  }

  return group;
}

export default function HeroSection3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.scene.ambient);
    scene.fog = new THREE.FogExp2(colors.scene.fog, 0.035);

    const camera = new THREE.PerspectiveCamera(
      50,
      canvasRef.current.offsetWidth / canvasRef.current.offsetHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0a2e, 0.5);
    scene.add(ambientLight);

    const blueRimLight = new THREE.PointLight(0x0066ff, 8, 20);
    blueRimLight.position.set(-5, 3, 2);
    scene.add(blueRimLight);

    const orangeFillLight = new THREE.PointLight(0xff6b00, 6, 15);
    orangeFillLight.position.set(5, -2, 3);
    scene.add(orangeFillLight);

    const topLight = new THREE.SpotLight(0xffffff, 4, 30, Math.PI / 6, 0.3);
    topLight.position.set(0, 10, 5);
    topLight.castShadow = true;
    scene.add(topLight);

    // 3D Objects
    const particles = createParticleSystem(scene);
    scene.add(particles);

    const brakeDisc = createBrakeDisc();
    brakeDisc.rotation.x = Math.PI * 0.15;
    scene.add(brakeDisc);

    // Ground reflection plane
    const groundGeom = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050510,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.6,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);

    setLoaded(true);

    // Animation loop
    let t = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      t += 0.008;

      // Brake disc rotation
      brakeDisc.rotation.y = t * 1.5;
      brakeDisc.position.y = Math.sin(t * 0.8) * 0.15;

      // Particle drift
      particles.rotation.y = t * 0.05;
      particles.rotation.x = t * 0.02;

      // Pulsing rim light (heartbeat of the engine)
      blueRimLight.intensity = 8 + Math.sin(t * 3) * 2;
      orangeFillLight.intensity = 6 + Math.cos(t * 2.5) * 1.5;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.offsetWidth / canvasRef.current.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, []);

  return (
    <section
      dir="rtl"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: colors.gradients.hero,
        overflow: "hidden",
      }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* Overlay gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to left, transparent 40%, rgba(10,10,15,0.95) 100%)",
          zIndex: 1,
        }}
      />

      {/* Hero content - Arabic RTL */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              right: "6%",
              transform: "translateY(-50%)",
              zIndex: 2,
              maxWidth: "540px",
              textAlign: "right",
            }}
          >
            {/* Brand tag */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                display: "inline-block",
                background: "rgba(0, 102, 255, 0.15)",
                border: "1px solid rgba(0, 102, 255, 0.4)",
                borderRadius: "100px",
                padding: "6px 18px",
                marginBottom: "20px",
                fontSize: "13px",
                color: colors.blue.neon,
                letterSpacing: "1px",
                backdropFilter: "blur(10px)",
              }}
            >
              🔥 قطع أداء عالي · تزويد نيسان · سرعة التوصيل
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 1.15,
                color: colors.text.primary,
                marginBottom: "8px",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              غياري
              <span
                style={{
                  display: "block",
                  background: `linear-gradient(135deg, ${colors.blue[500]}, ${colors.blue.neon})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                قطع الأداء
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: "1.15rem",
                color: colors.text.secondary,
                marginBottom: "40px",
                lineHeight: 1.7,
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              المنصة الأولى في السعودية لقطع التزويد، الأداء العالي،
              وإكسسوارات السيارات. تواير، بريكات، بطاريات، وأكثر.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: "flex", gap: "16px", justifyContent: "flex-end" }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: colors.orange.glow }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: `linear-gradient(135deg, ${colors.orange[500]}, ${colors.orange.neon})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "16px 36px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  letterSpacing: "0.5px",
                }}
              >
                تسوق الآن
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.03,
                  background: "rgba(0, 102, 255, 0.15)",
                  boxShadow: colors.blue.glow,
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "transparent",
                  color: colors.blue[400],
                  border: `1px solid ${colors.blue[500]}`,
                  borderRadius: "14px",
                  padding: "16px 32px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                }}
              >
                تزويد نيسان
              </motion.button>
            </motion.div>

            {/* Social proof stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{
                display: "flex",
                gap: "32px",
                marginTop: "48px",
                justifyContent: "flex-end",
              }}
            >
              {[
                { num: "+20,000", label: "قطعة متوفرة" },
                { num: "+500", label: "موزع معتمد" },
                { num: "24h", label: "توصيل سريع" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: colors.orange[400],
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    {stat.num}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: colors.text.muted,
                      fontFamily: "'Tajawal', sans-serif",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          color: colors.text.muted,
          fontSize: "0.75rem",
          fontFamily: "'Tajawal', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div>اكتشف المزيد</div>
        <div style={{ width: "1px", height: "40px", background: `linear-gradient(to bottom, ${colors.blue[500]}, transparent)` }} />
      </motion.div>
    </section>
  );
}
