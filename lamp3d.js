// Real-time 3D dome pendant for the typographic hero (Three.js r128).
// window.__lampD (0..1) = how far the lamp has dropped, window.__lampE (0..1) = how lit it is.
(function () {
  const canvas = document.getElementById('lamp3d');
  if (!canvas || !window.THREE) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.physicallyCorrectLights = true;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  // studio environment for reflections on metal
  const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x151a28, side: THREE.BackSide })));
  [[0, 10, 6, 0xfff1d6, 8], [-9, 2, 4, 0xffd38a, 4], [9, 0, -4, 0x8ea2cc, 3]].forEach(([x, y, z, c, s]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  });
  scene.environment = pm.fromScene(env, 0.04).texture;

  const shell = new THREE.MeshPhysicalMaterial({ color: 0x1b2131, metalness: 0.6, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.FrontSide });
  const inner = new THREE.MeshStandardMaterial({ color: 0xd9b25a, metalness: 1, roughness: 0.22, emissive: 0xffb84d, emissiveIntensity: 0, side: THREE.BackSide });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc19a45, metalness: 1, roughness: 0.25 });
  const cordM = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.6 });
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xfff6e2, emissive: 0xffd28a, emissiveIntensity: 0.05, roughness: 0.4 });

  const lamp = new THREE.Group(); scene.add(lamp);
  // dome profile (lathe)
  const pts = [];
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * 1.5 + 0.08, Math.cos(a) * 0.95)); }
  pts.push(new THREE.Vector2(1.6, -0.02));
  const domeGeo = new THREE.LatheGeometry(pts, 128);
  lamp.add(new THREE.Mesh(domeGeo, shell));
  const innerDome = new THREE.Mesh(domeGeo, inner); innerDome.scale.setScalar(0.985); lamp.add(innerDome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.025, 12, 128), brass); rim.rotation.x = Math.PI / 2; rim.position.y = -0.02; lamp.add(rim);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.22, 32), brass); cap.position.y = 1.02; lamp.add(cap);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 20, 8), cordM); cord.position.y = 11.1; lamp.add(cord);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 32), bulbM); bulb.position.y = 0.05; lamp.add(bulb);

  // glow
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const g = gc.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,226,160,1)'); gr.addColorStop(0.2, 'rgba(255,200,110,.5)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  glow.scale.set(3.2, 3.2, 1); glow.position.y = -0.25; lamp.add(glow);

  const bulbLight = new THREE.PointLight(0xffc773, 0, 8, 2); bulbLight.position.y = 0.1; lamp.add(bulbLight);
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-3, 5, 6); scene.add(key);
  scene.add(new THREE.AmbientLight(0x9aa8c8, 0.25));

  function size() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(canvas); size();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let d = 0, e = 0;
  function frame(now) {
    d += ((window.__lampD || 0) - d) * 0.1; e += ((window.__lampE || 0) - e) * 0.1;
    const t = now / 1000;
    // drop from above the frame into place, with a soft settle sway
    lamp.position.y = 6 - d * 6.4 + (reduce ? 0 : Math.sin(t * 1.1) * 0.03);
    lamp.rotation.z = reduce ? 0 : Math.sin(t * 0.9) * 0.012 * (1 - e * 0.5);
    lamp.rotation.y = t * 0.05;
    inner.emissiveIntensity = e * 0.9;
    bulbM.emissiveIntensity = 0.05 + e * 6;
    bulbLight.intensity = e * 40;
    glow.material.opacity = e * 0.95;
    cam.position.set(0, -2.2, 9.5); cam.lookAt(0, -0.2, 0);
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
