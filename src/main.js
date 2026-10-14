import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";

const chapters = [
  {
    id: "spacetime",
    title: "O tecido<br /><em>do universo</em>",
    kicker: "FUNDAMENTOS",
    description: "Espaço e tempo não são um palco imóvel: juntos, formam uma trama dinâmica que conecta tudo o que existe.",
    fact: "Na relatividade, não existe um “agora” universal compartilhado por todo o cosmos.",
    notes: "Comece perguntando à turma se espaço e tempo são coisas separadas. Apresente o espaço-tempo como uma estrutura de quatro dimensões: três espaciais e uma temporal. A visualização é uma analogia, não uma superfície material.",
    interaction: { label: "ONDULAÇÃO DO CAMPO", min: 0, max: 100, value: 48, unit: "%" },
    coordinate: ["CAMPO ESPACIAL", "3D · INTERATIVO"],
    camera: [0, 0, 14]
  },
  {
    id: "gravity",
    title: "A gravidade<br /><em>é geometria</em>",
    kicker: "CURVATURA",
    description: "A matéria curva o espaço-tempo. Planetas e estrelas seguem os caminhos moldados por essa geometria.",
    fact: "A Terra orbita o Sol seguindo uma trajetória no espaço-tempo curvo, não sendo puxada por uma corda invisível.",
    notes: "Use a malha para visualizar como uma concentração de massa altera a geometria ao redor. A analogia do lençol elástico ajuda a começar, mas não reproduz a gravidade em três dimensões nem a curvatura temporal.",
    interaction: { label: "MASSA DO OBJETO", min: 10, max: 100, value: 56, unit: "%" },
    coordinate: ["MASSA RELATIVA", "M · R² GEOMÉTRICA"],
    camera: [1.2, 0.4, 12]
  },
  {
    id: "blackhole",
    title: "Onde a luz<br /><em>se curva</em>",
    kicker: "REGIÃO DE COLAPSO",
    description: "Tão denso que nem a luz escapa. Ao cruzar o horizonte de eventos, nenhum caminho leva de volta.",
    fact: "O buraco negro desta cena é um modelo visual: as lentes e o disco não representam uma simulação física exata.",
    notes: "Dê tempo para a aproximação do buraco negro antes de explicar o horizonte de eventos. É a fronteira a partir da qual nem mesmo a luz pode escapar. Troque entre horizonte e curvatura nos instrumentos. Deixe explícito que o disco e a lente gravitacional são recursos didáticos, não uma previsão numérica.",
    coordinate: ["REGIÃO OBSERVADA", "MODELO · NÃO À ESCALA"],
    camera: [0, 0, 7.2]
  },
  {
    id: "waves",
    title: "O universo<br /><em>em vibração</em>",
    kicker: "ONDAS GRAVITACIONAIS",
    description: "Massas aceleradas estremecem o espaço-tempo. Essas ondulações viajam pelo cosmos à velocidade da luz.",
    fact: "Em 2015, o LIGO detectou pela primeira vez ondas gravitacionais de dois buracos negros em fusão.",
    notes: "Apresente ondas gravitacionais como ondulações do próprio espaço-tempo, não ondas que se propagam dentro dele. A detecção do LIGO veio de um sinal minúsculo, menor que o diâmetro de um próton em relação aos quatro quilômetros dos braços do instrumento.",
    interaction: { label: "AMPLITUDE DA ONDA", min: 5, max: 100, value: 56, unit: "%" },
    coordinate: ["FREQUÊNCIA", "OSCILAÇÃO · 3D"],
    camera: [0, 0, 11]
  },
  {
    id: "twins",
    title: "Dois relógios,<br /><em>dois tempos</em>",
    kicker: "PARADOXO DOS GÊMEOS",
    description: "Um viajante em alta velocidade envelhece menos que quem ficou. O tempo próprio depende do caminho percorrido.",
    fact: "O efeito é real: relógios em aviões registram diferenças minúsculas, mas mensuráveis.",
    notes: "O paradoxo é resolvido porque os dois gêmeos percorrem trajetórias diferentes pelo espaço-tempo; o viajante também precisa inverter o sentido para regressar. O efeito existe e relógios atômicos já o mediram. Explore o controle de velocidade.",
    interaction: { label: "VELOCIDADE DE VIAGEM", min: 5, max: 95, value: 52, unit: "% c" },
    coordinate: ["DILATAÇÃO TEMPORAL", "VELOCIDADE · % c"],
    camera: [0, 0.7, 12]
  },
  {
    id: "gps",
    title: "O tempo que<br /><em>guia você</em>",
    kicker: "RELATIVIDADE EM ÓRBITA",
    description: "Satélites GPS sentem a gravidade mais fraca e viajam depressa. Juntos, os dois efeitos ajustam seus relógios.",
    fact: "Sem correções relativísticas, o GPS acumularia erros de posição de vários quilômetros por dia.",
    notes: "Satélites estão em uma região de gravidade mais fraca, então seus relógios adiantam em relação aos relógios terrestres. O movimento orbital faz os relógios atrasarem. O efeito gravitacional prevalece, e o sistema precisa corrigir a diferença diariamente para manter a precisão.",
    interaction: { label: "CORREÇÃO RELATIVÍSTICA", min: 0, max: 100, value: 64, unit: "%" },
    coordinate: ["ÓRBITA", "20 200 KM · ALTITUDE"],
    camera: [0, 0.2, 12]
  }
];

const dom = {
  canvas: document.querySelector("#universe"),
  navigation: document.querySelector("#chapter-navigation"),
  kicker: document.querySelector("#scene-kicker"),
  title: document.querySelector("#scene-title"),
  description: document.querySelector("#scene-description"),
  fact: document.querySelector("#scene-fact"),
  controls: document.querySelector("#scene-controls"),
  panelIndex: document.querySelector("#panel-index"),
  coordinateLabel: document.querySelector("#coordinate-label"),
  coordinateValue: document.querySelector("#coordinate-value"),
  notesToggle: document.querySelector("#presenter-toggle"),
  notesPanel: document.querySelector("#presenter-notes"),
  notes: document.querySelector("#notes-content"),
  pause: document.querySelector("#pause-button"),
  pauseLabel: document.querySelector("#pause-label"),
  reset: document.querySelector("#reset-button"),
  fallbackMessage: document.querySelector("#webgl-fallback-message")
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentChapter = 0;
let isPaused = false;
let activeView = "horizon";
let interactionValue = chapters[0].interaction.value;
let renderer;
let scene;
let camera;
let raycaster;
let pointer = new THREE.Vector2();
let pointerTarget = new THREE.Vector2();
const cameraState = { x: 0, y: 0, z: 14 };
let activeTimeline;
let webglAvailable = false;
const sceneGroups = [];
const clock = new THREE.Clock();
const animationState = { wave: 1, curvature: 0.48 };

function addMaterial(mesh, material) {
  mesh.material = material;
  return mesh;
}

function makeLine(points, color, opacity = 0.22) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false
  }));
  return line;
}

function makeSphere(radius, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.56,
      metalness: options.metalness ?? 0.12,
      emissive: options.emissive ?? "#000000",
      emissiveIntensity: options.emissiveIntensity ?? 0.18
    })
  );
  if (options.selectable) mesh.userData.selectable = true;
  return mesh;
}

function createStarfield() {
  const starCount = 2200;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const radius = 18 + Math.random() * 68;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[index * 3 + 2] = radius * Math.cos(phi);
    const tint = 0.55 + Math.random() * 0.45;
    colors[index * 3] = tint * 0.7;
    colors[index * 3 + 1] = tint * 0.79;
    colors[index * 3 + 2] = tint;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.095,
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    sizeAttenuation: true
  }));
  scene.add(stars);
  return stars;
}

function createWarpedGrid(group, options = {}) {
  const { color = "#758acb", extent = 8, divisions = 16, depth = 1.3, centerRadius = 0 } = options;
  const lines = new THREE.Group();
  for (let lineIndex = 0; lineIndex <= divisions; lineIndex += 1) {
    const offset = -extent + (lineIndex / divisions) * extent * 2;
    for (const vertical of [false, true]) {
      const points = [];
      for (let step = 0; step <= 48; step += 1) {
        const along = -extent + (step / 48) * extent * 2;
        const x = vertical ? offset : along;
        const y = vertical ? along : offset;
        const radius = Math.sqrt(x * x + y * y) + 0.16;
        const depression = depth / Math.pow(radius, 0.72);
        const centerCut = centerRadius > 0 && radius < centerRadius;
        points.push(new THREE.Vector3(x, centerCut ? 0 : -depression, y));
      }
      lines.add(makeLine(points, color, 0.3));
    }
  }
  group.add(lines);
  return lines;
}

function createPlanetWithOrbit(group, options = {}) {
  const { radius = 1, color = "#375fba", orbitRadius = 3.3, orbitColor = "#8398ef" } = options;
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(orbitRadius, 0.009, 5, 180),
    new THREE.MeshBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.28 })
  );
  orbit.rotation.x = Math.PI / 2;
  group.add(orbit);
  const pivot = new THREE.Group();
  group.add(pivot);
  const planet = makeSphere(radius, color, { emissive: "#162c73", emissiveIntensity: 0.42, selectable: true });
  planet.position.x = orbitRadius;
  pivot.add(planet);
  return { planet, pivot, orbit };
}

function createSpacetimeScene(group) {
  const grid = createWarpedGrid(group, { color: "#566eaf", extent: 7.2, divisions: 19, depth: 0.35 });
  grid.rotation.x = -0.08;
  const center = makeSphere(0.9, "#203a77", { emissive: "#182f70", emissiveIntensity: 0.55, selectable: true });
  center.position.set(0, -0.25, 0);
  group.add(center);
  const centerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 32, 24),
    new THREE.MeshBasicMaterial({ color: "#6d8fff", transparent: true, opacity: 0.06, side: THREE.BackSide })
  );
  centerGlow.position.copy(center.position);
  group.add(centerGlow);
  return { grid, center, centerGlow };
}

function createGravityScene(group) {
  const grid = createWarpedGrid(group, { color: "#657db9", extent: 7.4, divisions: 17, depth: 3.5 });
  const sun = makeSphere(1.12, "#d29b68", { emissive: "#b35228", emissiveIntensity: 0.48, selectable: true });
  sun.position.y = -0.62;
  group.add(sun);
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.42, 32, 24),
    new THREE.MeshBasicMaterial({ color: "#f5b467", transparent: true, opacity: 0.075, side: THREE.BackSide })
  );
  aura.position.copy(sun.position);
  group.add(aura);
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.009, 6, 180),
    new THREE.MeshBasicMaterial({ color: "#b4c3ff", transparent: true, opacity: 0.3 })
  );
  orbit.rotation.x = Math.PI / 2;
  orbit.position.y = -0.45;
  group.add(orbit);
  const satellitePivot = new THREE.Group();
  satellitePivot.rotation.x = Math.PI / 2;
  group.add(satellitePivot);
  const planet = makeSphere(0.23, "#8baeff", { emissive: "#304fa5", emissiveIntensity: 0.5, selectable: true });
  planet.position.x = 3.1;
  satellitePivot.add(planet);
  return { grid, sun, aura, satellitePivot, orbit };
}

function createBlackHoleScene(group) {
  const lensGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.12, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#7147ff", transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
  );
  group.add(lensGlow);
  const lensRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.06, 0.035, 8, 180),
    new THREE.MeshBasicMaterial({ color: "#a18bff", transparent: true, opacity: 0.58 })
  );
  lensRing.rotation.x = 1.37;
  lensRing.userData.selectable = true;
  group.add(lensRing);
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#010205", transparent: true, opacity: 1 })
  );
  horizon.userData.selectable = true;
  group.add(horizon);
  const horizonEdge = new THREE.Mesh(
    new THREE.TorusGeometry(1.09, 0.026, 8, 144),
    new THREE.MeshBasicMaterial({ color: "#ccb5ff", transparent: true, opacity: 0.42 })
  );
  horizonEdge.rotation.x = 1.39;
  group.add(horizonEdge);
  const disk = new THREE.Group();
  group.add(disk);
  const diskLayers = [
    { inner: 1.22, outer: 1.62, color: "#5944e6", opacity: 0.24 },
    { inner: 1.4, outer: 2.13, color: "#9451f2", opacity: 0.35 },
    { inner: 1.7, outer: 2.78, color: "#cf6fef", opacity: 0.32 },
    { inner: 2.13, outer: 3.15, color: "#f5a46d", opacity: 0.18 }
  ];
  const diskMaterial = [];
  diskLayers.forEach((layer, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: layer.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    material.userData.baseOpacity = layer.opacity;
    diskMaterial.push(material);
    const ring = new THREE.Mesh(new THREE.RingGeometry(layer.inner, layer.outer, 144), material);
    ring.rotation.x = Math.PI * 0.43;
    ring.rotation.y = -0.17;
    ring.userData.selectable = index === 2;
    disk.add(ring);
  });
  const farHalo = new THREE.Mesh(
    new THREE.TorusGeometry(2.36, 0.11, 8, 200),
    new THREE.MeshBasicMaterial({ color: "#eda9ff", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
  );
  farHalo.rotation.x = 1.28;
  group.add(farHalo);
  const curvature = createWarpedGrid(group, { color: "#a27cff", extent: 7, divisions: 18, depth: 2.7, centerRadius: 1.1 });
  curvature.visible = false;
  const curvatureMaterials = [];
  curvature.traverse((object) => {
    if (!object.material) return;
    object.material.userData.baseOpacity = object.material.opacity;
    curvatureMaterials.push(object.material);
  });
  const particlePositions = new Float32Array(180 * 3);
  for (let index = 0; index < 180; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.35 + Math.random() * 1.05;
    particlePositions[index * 3] = Math.cos(angle) * radius;
    particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 0.22;
    particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: "#f5c6ff",
    size: 0.045,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  }));
  group.add(particles);
  return { horizon, horizonEdge, lensGlow, lensRing, disk, diskMaterial, farHalo, curvature, curvatureMaterials, particles };
}

function createWavesScene(group) {
  const binaries = new THREE.Group();
  group.add(binaries);
  const starOne = makeSphere(0.48, "#84a3ff", { emissive: "#4768ef", emissiveIntensity: 0.9, selectable: true });
  const starTwo = makeSphere(0.37, "#e1a7ff", { emissive: "#a03adb", emissiveIntensity: 0.9, selectable: true });
  starTwo.position.x = 1.8;
  binaries.add(starOne, starTwo);
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.01, 6, 120),
    new THREE.MeshBasicMaterial({ color: "#a9baff", transparent: true, opacity: 0.22 })
  );
  binaries.add(orbit);
  const waves = [];
  for (let index = 0; index < 6; index += 1) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(2 + index * 0.72, 0.013, 5, 160),
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? "#818cff" : "#ca95ff",
        transparent: true,
        opacity: 0.42 - index * 0.04
      })
    );
    wave.rotation.x = Math.PI / 2;
    wave.userData.baseScale = 1 + index * 0.12;
    waves.push(wave);
    group.add(wave);
  }
  return { binaries, starOne, starTwo, waves };
}

function createTwinsScene(group) {
  const homeOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.009, 5, 120),
    new THREE.MeshBasicMaterial({ color: "#99aeff", transparent: true, opacity: 0.27 })
  );
  homeOrbit.rotation.x = Math.PI / 2;
  homeOrbit.position.x = -2.15;
  homeOrbit.position.y = 1.3;
  group.add(homeOrbit);
  const earth = makeSphere(0.56, "#315ca9", { emissive: "#16346e", emissiveIntensity: 0.55, selectable: true });
  earth.position.x = -2.15;
  earth.position.y = 1.3;
  group.add(earth);
  const traveller = new THREE.Group();
  traveller.position.y = 1.3;
  group.add(traveller);
  const ship = new THREE.Group();
  traveller.add(ship);
  const shipCore = makeSphere(0.31, "#a28bfa", { emissive: "#6645dc", emissiveIntensity: 0.85, selectable: true });
  const shipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.018, 6, 80),
    new THREE.MeshBasicMaterial({ color: "#cbb8ff", transparent: true, opacity: 0.75 })
  );
  shipRing.rotation.x = Math.PI / 2;
  ship.add(shipCore, shipRing);
  const path = makeLine([
    new THREE.Vector3(-4.8, 1.3, 0),
    new THREE.Vector3(-3.2, 1.45, 0),
    new THREE.Vector3(-1.7, 1.6, 0),
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(1.7, 1.35, 0),
    new THREE.Vector3(3.3, 1.22, 0),
    new THREE.Vector3(4.8, 1.3, 0)
  ], "#929fff", 0.28);
  group.add(path);
  const clockGroup = new THREE.Group();
  group.add(clockGroup);
  const clockFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.68, 48),
    new THREE.MeshBasicMaterial({ color: "#121a31", transparent: true, opacity: 0.88, side: THREE.DoubleSide })
  );
  clockGroup.add(clockFace);
  const clockOutline = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.012, 6, 72),
    new THREE.MeshBasicMaterial({ color: "#8498eb", transparent: true, opacity: 0.55 })
  );
  clockGroup.add(clockOutline);
  const hand = makeLine([new THREE.Vector3(0, 0, 0.02), new THREE.Vector3(0.36, 0.15, 0.02)], "#e5c6ff", 0.9);
  clockGroup.add(hand);
  clockGroup.position.set(1.9, 1.45, 0);
  return { traveller, ship, shipCore, earth, hand, clockGroup };
}

function createGpsScene(group) {
  const earth = makeSphere(1.55, "#23539a", { emissive: "#102e67", emissiveIntensity: 0.6, selectable: true });
  group.add(earth);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.78, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#5396ff", transparent: true, opacity: 0.1, side: THREE.BackSide })
  );
  group.add(atmosphere);
  const orbitConfigs = [
    { radius: 3.3, color: "#8095e5", rotation: [0.35, 0.2, 0.15], speed: 0.2 },
    { radius: 4.05, color: "#9f81ef", rotation: [1.04, -0.23, 0.26], speed: -0.145 },
    { radius: 4.7, color: "#748cdf", rotation: [0.7, 0.7, -0.25], speed: 0.11 }
  ];
  const satellites = orbitConfigs.map((config, index) => {
    const orbitalGroup = new THREE.Group();
    orbitalGroup.rotation.set(...config.rotation);
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(config.radius, 0.007, 5, 180),
      new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.32 })
    );
    orbit.rotation.x = Math.PI / 2;
    orbitalGroup.add(orbit);
    const satellite = new THREE.Group();
    satellite.position.x = config.radius;
    orbitalGroup.add(satellite);
    const body = makeSphere(0.12, index === 1 ? "#d6bcff" : "#a8bcff", {
      emissive: "#647aff",
      emissiveIntensity: 0.9,
      selectable: true
    });
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.08, 0.025),
      new THREE.MeshBasicMaterial({ color: "#6f7fe0" })
    );
    panel.position.x = 0.24;
    satellite.add(body, panel);
    group.add(orbitalGroup);
    return { orbitalGroup, satellite, speed: config.speed };
  });
  return { earth, atmosphere, satellites };
}

function createUniverse() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: dom.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    webglAvailable = true;
  } catch (error) {
    console.warn("WebGL could not be initialized; continuing with the visual fallback.", error);
    document.body.classList.add("webgl-unavailable");
    dom.fallbackMessage.hidden = false;
    dom.canvas.setAttribute("aria-hidden", "true");
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#05070c");
  scene.fog = new THREE.FogExp2("#05070c", 0.006);
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 150);
  cameraState.x = chapters[0].camera[0];
  cameraState.y = chapters[0].camera[1];
  cameraState.z = chapters[0].camera[2];
  camera.position.set(cameraState.x, cameraState.y, cameraState.z);
  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.18;

  scene.add(new THREE.HemisphereLight("#8eacff", "#080b14", 1.12));
  const keyLight = new THREE.DirectionalLight("#b3c4ff", 2.1);
  keyLight.position.set(-4, 6, 7);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight("#8459ff", 5.2, 24);
  rimLight.position.set(4, 1, -3);
  scene.add(rimLight);
  const warmLight = new THREE.PointLight("#ffad78", 3.1, 20);
  warmLight.position.set(-5, 2, 3);
  scene.add(warmLight);
  const stars = createStarfield();

  const builders = [
    createSpacetimeScene,
    createGravityScene,
    createBlackHoleScene,
    createWavesScene,
    createTwinsScene,
    createGpsScene
  ];
  builders.forEach((build, index) => {
    const group = new THREE.Group();
    group.visible = index === 0;
    group.userData.homeScale = 1;
    scene.add(group);
    sceneGroups.push({ group, visual: build(group) });
  });
  scene.userData.stars = stars;

  const render = () => {
    requestAnimationFrame(render);
    if (isPaused) return;
    const elapsed = clock.getElapsedTime();
    pointer.x += (pointerTarget.x - pointer.x) * 0.018;
    pointer.y += (pointerTarget.y - pointer.y) * 0.018;
    camera.position.set(
      cameraState.x + pointer.x * 0.5,
      cameraState.y + pointer.y * 0.28,
      cameraState.z
    );
    camera.lookAt(pointer.x * 0.16, pointer.y * 0.12, 0);
    stars.rotation.y = elapsed * 0.002;

    const active = sceneGroups[currentChapter]?.visual;
    if (currentChapter === 1 && active.satellitePivot) active.satellitePivot.rotation.z += 0.003;
    if (currentChapter === 2) {
      active.disk.rotation.z += activeView === "horizon" ? 0.0018 : 0.00055;
      active.particles.rotation.y += 0.001;
      active.farHalo.rotation.z -= 0.001;
    }
    if (currentChapter === 3) {
      active.binaries.rotation.y += 0.007 * (0.4 + interactionValue / 100);
      active.starTwo.position.x = Math.cos(elapsed * 0.82) * 0.95;
      active.starTwo.position.z = Math.sin(elapsed * 0.82) * 0.42;
      active.starOne.position.x = -Math.cos(elapsed * 0.82) * 0.5;
      active.starOne.position.z = -Math.sin(elapsed * 0.82) * 0.22;
      active.waves.forEach((wave, index) => {
        wave.scale.setScalar(wave.userData.baseScale * (animationState.wave + Math.sin(elapsed * 1.1 - index * 0.65) * 0.045));
        wave.material.opacity = Math.max(0.04, 0.38 - index * 0.045 - ((wave.scale.x - 1) * 0.04));
      });
    }
    if (currentChapter === 4) {
      active.traveller.position.x = Math.sin(elapsed * (0.12 + interactionValue / 280)) * 4.2;
      active.ship.rotation.y += 0.006;
      active.hand.rotation.z = -elapsed * 0.08;
    }
    if (currentChapter === 5) {
      active.satellites.forEach(({ orbitalGroup, speed }, index) => {
        orbitalGroup.rotation.y += speed * 0.005 * (0.7 + interactionValue / 100);
        orbitalGroup.rotation.z += (index + 1) * 0.0001;
      });
    }
    renderer.render(scene, camera);
  };
  render();
}

function createNavigation() {
  chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-link";
    button.dataset.chapter = String(index);
    button.setAttribute("aria-label", `Capítulo ${index + 1}: ${chapter.kicker}`);
    button.setAttribute("aria-current", index === currentChapter ? "step" : "false");
    button.innerHTML = `<span class="chapter-marker" aria-hidden="true"></span><span class="chapter-index">${String(index + 1).padStart(2, "0")}</span><span class="chapter-name">${chapter.kicker.replace("PARADOXO DOS GÊMEOS", "Gêmeos").replace("ONDAS GRAVITACIONAIS", "Ondas gravitacionais").replace("REGIÃO DE COLAPSO", "Buracos negros").replace("RELATIVIDADE EM ÓRBITA", "GPS relativístico").replace("FUNDAMENTOS", "Espaço-tempo").replace("CURVATURA", "Gravidade")}</span>`;
    button.addEventListener("click", () => selectChapter(index));
    dom.navigation.append(button);
  });
}

function formatValue(value, unit) {
  return unit === "% c" ? `${Math.round(value)}% c` : `${Math.round(value)}${unit}`;
}

function renderControls(chapter, index) {
  dom.controls.replaceChildren();
  if (chapter.id === "blackhole") {
    const stack = document.createElement("div");
    stack.className = "option-stack";
    [
      { id: "horizon", label: "Horizonte de eventos" },
      { id: "curvature", label: "Curvatura do espaço-tempo" }
    ].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.textContent = option.label;
      button.setAttribute("aria-pressed", String(activeView === option.id));
      button.addEventListener("click", () => setBlackHoleView(option.id));
      stack.append(button);
    });
    dom.controls.append(stack);
    return;
  }

  const control = chapter.interaction;
  const block = document.createElement("div");
  block.className = "control-block";
  const heading = document.createElement("div");
  heading.className = "control-heading";
  const label = document.createElement("label");
  label.className = "control-label";
  label.htmlFor = "chapter-range";
  label.textContent = control.label;
  const reading = document.createElement("output");
  reading.className = "control-reading";
  reading.htmlFor = "chapter-range";
  reading.textContent = formatValue(interactionValue, control.unit);
  const range = document.createElement("input");
  range.className = "range-input";
  range.id = "chapter-range";
  range.type = "range";
  range.min = String(control.min);
  range.max = String(control.max);
  range.value = String(interactionValue);
  range.setAttribute("aria-label", control.label);
  const fill = () => {
    const percentage = ((Number(range.value) - control.min) / (control.max - control.min)) * 100;
    range.style.setProperty("--range-fill", `${percentage}%`);
  };
  range.addEventListener("input", () => {
    interactionValue = Number(range.value);
    reading.textContent = formatValue(interactionValue, control.unit);
    fill();
    updateSceneInteraction(index);
  });
  fill();
  heading.append(label, reading);
  block.append(heading, range);
  const scale = document.createElement("div");
  scale.className = "control-scale";
  scale.innerHTML = `<span>${control.min}${control.unit}</span><span>${control.max}${control.unit}</span>`;
  block.append(scale);
  dom.controls.append(block);
}

function updateSceneInteraction(index) {
  if (!webglAvailable) return;
  const visual = sceneGroups[index].visual;
  const normalized = interactionValue / 100;
  if (index === 0) {
    animationState.curvature = normalized;
    visual.grid.scale.y = 0.3 + normalized * 1.8;
    visual.centerGlow.material.opacity = 0.04 + normalized * 0.12;
  } else if (index === 1) {
    visual.grid.scale.y = 0.45 + normalized * 1.55;
    visual.sun.scale.setScalar(0.8 + normalized * 0.42);
    visual.aura.material.opacity = 0.035 + normalized * 0.1;
  } else if (index === 3) {
    animationState.wave = 0.76 + normalized * 0.72;
  } else if (index === 4) {
    visual.shipCore.material.emissiveIntensity = 0.25 + normalized * 1.15;
    visual.traveller.position.x = (normalized - 0.5) * 8;
  } else if (index === 5) {
    visual.atmosphere.material.opacity = 0.045 + normalized * 0.1;
  }
}

function setBlackHoleView(view) {
  if (activeView === view) return;
  activeView = view;
  const visual = sceneGroups[2].visual;
  const isCurvature = view === "curvature";
  if (webglAvailable) {
    gsap.killTweensOf(visual.curvatureMaterials);
    if (isCurvature) visual.curvature.visible = true;
    gsap.to(visual.curvatureMaterials, {
      opacity: (index, material) => isCurvature ? material.userData.baseOpacity : 0,
      duration: 0.7,
      onComplete: () => {
        if (!isCurvature && activeView === "horizon") visual.curvature.visible = false;
      }
    });
    gsap.to(visual.diskMaterial, {
      opacity: (index, material) => material.userData.baseOpacity * (isCurvature ? 0.28 : 1),
      duration: 0.65
    });
    gsap.to(visual.lensRing.material, { opacity: isCurvature ? 0.18 : 0.58, duration: 0.65 });
    gsap.to(visual.horizonEdge.material, { opacity: isCurvature ? 0.16 : 0.65, duration: 0.55 });
    gsap.to(visual.horizon.scale, { x: isCurvature ? 0.74 : 1, y: isCurvature ? 0.74 : 1, z: isCurvature ? 0.74 : 1, duration: 0.75, ease: "power2.inOut" });
  }
  updateBlackHoleCopy(view);
}

function updateBlackHoleCopy(view) {
  const isCurvature = view === "curvature";
  dom.coordinateLabel.textContent = isCurvature ? "GEOMETRIA ILUSTRADA" : "HORIZONTE DE EVENTOS";
  dom.coordinateValue.textContent = isCurvature ? "MALHA · MODELO VISUAL" : "NENHUM SINAL ESCAPA";
  dom.description.textContent = isCurvature
    ? "A malha representa como uma grande concentração de massa curva o espaço-tempo ao redor. É uma analogia visual, não uma simulação física."
    : "O horizonte de eventos é a fronteira de não retorno: dentro dela, todos os caminhos possíveis apontam para o interior.";
  const options = dom.controls.querySelectorAll(".option-button");
  options.forEach((button, index) => button.setAttribute("aria-pressed", String((index === 1) === isCurvature)));
}

function resetBlackHoleVisual() {
  if (!webglAvailable) return;
  const visual = sceneGroups[2].visual;
  gsap.killTweensOf([
    ...visual.curvatureMaterials,
    ...visual.diskMaterial,
    visual.lensRing.material,
    visual.horizonEdge.material,
    visual.horizon.scale
  ]);
  visual.curvature.visible = false;
  visual.curvatureMaterials.forEach((material) => { material.opacity = 0; });
  visual.horizon.scale.setScalar(1);
  visual.diskMaterial.forEach((material) => { material.opacity = material.userData.baseOpacity; });
  visual.lensRing.material.opacity = 0.58;
  visual.horizonEdge.material.opacity = 0.42;
  activeView = "horizon";
}

function transitionText(chapter, index) {
  gsap.killTweensOf([dom.kicker, dom.title, dom.description, dom.fact]);
  const textElements = [dom.kicker, dom.title, dom.description, dom.fact];
  gsap.to(textElements, {
    opacity: 0,
    y: 12,
    duration: prefersReducedMotion ? 0.01 : 0.2,
    stagger: 0.025,
    overwrite: true,
    onComplete: () => {
      dom.kicker.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><span class="kicker-line"></span><span>${chapter.kicker}</span>`;
      dom.title.innerHTML = chapter.title;
      dom.description.textContent = chapter.description;
      dom.fact.textContent = chapter.fact;
      dom.notes.innerHTML = `<p>${chapter.notes}</p><p><strong>Interação:</strong> ${chapter.id === "blackhole" ? "Alterne entre horizonte de eventos e curvatura do espaço-tempo." : `${chapter.interaction.label.toLowerCase()} com o controle da cena.`}</p>`;
      if (chapter.id === "blackhole" && currentChapter === index) updateBlackHoleCopy(activeView);
      gsap.fromTo(textElements, { opacity: 0, y: 13 }, {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0.01 : 0.72,
        stagger: 0.085,
        ease: "power2.out",
        clearProps: "transform"
      });
    }
  });
}

function setActiveChapterUi(index, { animate = true } = {}) {
  const chapter = chapters[index];
  document.querySelectorAll(".chapter-link").forEach((button, buttonIndex) => {
    button.setAttribute("aria-current", buttonIndex === index ? "step" : "false");
  });
  dom.panelIndex.textContent = `${String(index + 1).padStart(2, "0")} / 06`;
  dom.coordinateLabel.textContent = chapter.coordinate[0];
  dom.coordinateValue.textContent = chapter.coordinate[1];
  document.querySelector("#scene-coordinate").textContent = `SETOR 0${index + 1} · 00′`;
  document.querySelector("#scene-status").textContent = isPaused ? "OBSERVAÇÃO PAUSADA" : "OBSERVAÇÃO EM CURSO";
  renderControls(chapter, index);
  if (animate) {
    transitionText(chapter, index);
  } else {
    dom.kicker.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><span class="kicker-line"></span><span>${chapter.kicker}</span>`;
    dom.title.innerHTML = chapter.title;
    dom.description.textContent = chapter.description;
    dom.fact.textContent = chapter.fact;
    gsap.set([dom.kicker, dom.title, dom.description, dom.fact], { opacity: 1, y: 0, clearProps: "transform" });
  }
  if (chapter.id === "blackhole") updateBlackHoleCopy(activeView);
}

function transitionScene(fromIndex, toIndex, duration = 1.6) {
  if (!webglAvailable) return;
  activeTimeline?.kill();
  activeTimeline = null;
  sceneGroups.forEach(({ group }, index) => {
    group.visible = index === fromIndex;
    group.scale.setScalar(1);
    group.rotation.set(0, 0, 0);
    group.traverse((object) => {
      if (!object.material || Array.isArray(object.material)) return;
      gsap.killTweensOf(object.material);
      if (object.material.userData.sceneBaseOpacity !== undefined) {
        object.material.opacity = object.material.userData.sceneBaseOpacity;
        object.material.transparent = object.material.userData.sceneBaseTransparent;
        object.material.needsUpdate = true;
      }
    });
  });
  if (fromIndex === 2 || toIndex === 2) resetBlackHoleVisual();
  const outgoing = sceneGroups[fromIndex];
  const incoming = sceneGroups[toIndex];
  incoming.group.visible = true;
  incoming.group.scale.setScalar(0.88);
  incoming.group.rotation.set(0, 0, 0);
  outgoing.group.traverse((object) => {
    if (object.material && !Array.isArray(object.material) && object.material.opacity !== undefined) {
      object.material.userData.sceneBaseOpacity ??= object.material.opacity;
      object.material.userData.sceneBaseTransparent ??= object.material.transparent;
    }
  });
  incoming.group.traverse((object) => {
    if (object.material && !Array.isArray(object.material) && object.material.opacity !== undefined) {
      object.material.userData.sceneBaseOpacity ??= object.material.opacity;
      object.material.userData.sceneBaseTransparent ??= object.material.transparent;
      object.material.transparent = true;
      object.material.opacity = 0;
      object.material.needsUpdate = true;
    }
  });
  activeTimeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  activeTimeline.to(outgoing.group.scale, { x: 0.84, y: 0.84, z: 0.84, duration: duration * 0.42 }, 0);
  activeTimeline.to(outgoing.group.rotation, { y: 0.28, x: -0.08, duration: duration * 0.42 }, 0);
  const opacityMaterials = [];
  incoming.group.traverse((object) => {
    if (object.material && !Array.isArray(object.material) && object.material.opacity !== undefined) opacityMaterials.push(object.material);
  });
  activeTimeline.to(incoming.group.scale, { x: 1, y: 1, z: 1, duration }, 0.08);
  if (opacityMaterials.length > 0) {
    activeTimeline.to(opacityMaterials, {
      opacity: (index, material) => material.userData.sceneBaseOpacity,
      duration: duration * 0.74,
      stagger: 0.001
    }, 0.08);
  }
  const nextCamera = chapters[toIndex].camera;
  activeTimeline.to(cameraState, {
    x: nextCamera[0],
    y: nextCamera[1],
    z: nextCamera[2],
    duration: duration * 0.9,
    ease: "power3.inOut"
  }, 0);
  activeTimeline.call(() => {
    opacityMaterials.forEach((material) => {
      material.transparent = material.userData.sceneBaseTransparent;
      material.needsUpdate = true;
    });
    outgoing.group.visible = false;
    outgoing.group.scale.setScalar(1);
    outgoing.group.rotation.set(0, 0, 0);
  }, [], duration * 0.92);
  if (toIndex === 2) {
    activeTimeline.fromTo(incoming.group.rotation, { y: -0.32 }, { y: 0, duration: 1.15, ease: "power2.out" }, 0.1);
  }
}

function selectChapter(index, options = {}) {
  if (index < 0 || index >= chapters.length || index === currentChapter) return;
  const previous = currentChapter;
  currentChapter = index;
  if (index === 2) resetBlackHoleVisual();
  if (isPaused) {
    gsap.globalTimeline.resume();
    clock.start();
  }
  isPaused = false;
  dom.pauseLabel.textContent = "PAUSAR";
  dom.pause.setAttribute("aria-label", "Pausar animação");
  document.querySelector(".play-glyph").textContent = "Ⅱ";
  setActiveChapterUi(index);
  transitionScene(previous, index, options.immediate || prefersReducedMotion ? 0.01 : index === 2 ? 2.5 : 1.55);
}

function resetExperience() {
  isPaused = false;
  activeTimeline?.kill();
  activeTimeline = null;
  pointerTarget.set(0, 0);
  pointer.set(0, 0);
  interactionValue = chapters[currentChapter].interaction?.value ?? 50;
  activeView = "horizon";
  gsap.globalTimeline.resume();
  clock.start();
  if (webglAvailable) {
    sceneGroups.forEach(({ group }, index) => {
      group.visible = index === currentChapter;
      group.scale.setScalar(1);
      group.rotation.set(0, 0, 0);
      group.traverse((object) => {
        if (!object.material || Array.isArray(object.material)) return;
        gsap.killTweensOf(object.material);
        if (object.material.userData.sceneBaseOpacity !== undefined) {
          object.material.opacity = object.material.userData.sceneBaseOpacity;
          object.material.transparent = object.material.userData.sceneBaseTransparent;
          object.material.needsUpdate = true;
        }
      });
    });
    if (currentChapter === 2) {
      resetBlackHoleVisual();
    }
    if (currentChapter === 3) animationState.wave = 1;
    if (currentChapter === 0) {
      const visual = sceneGroups[0].visual;
      visual.grid.scale.y = 1;
      visual.centerGlow.material.opacity = 0.06;
    }
    if (currentChapter === 1) {
      const visual = sceneGroups[1].visual;
      visual.grid.scale.y = 1;
      visual.sun.scale.setScalar(1);
      visual.aura.material.opacity = 0.075;
    }
  }
  document.querySelector(".play-glyph").textContent = "Ⅱ";
  dom.pauseLabel.textContent = "PAUSAR";
  dom.pause.setAttribute("aria-label", "Pausar animação");
  setActiveChapterUi(currentChapter);
  if (currentChapter === 2) {
    renderControls(chapters[currentChapter], currentChapter);
    updateBlackHoleCopy("horizon");
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    gsap.globalTimeline.pause();
    clock.stop();
    dom.pauseLabel.textContent = "RETOMAR";
    dom.pause.setAttribute("aria-label", "Retomar animação");
    document.querySelector(".play-glyph").textContent = "▶";
    document.querySelector("#scene-status").textContent = "OBSERVAÇÃO PAUSADA";
  } else {
    gsap.globalTimeline.resume();
    clock.start();
    dom.pauseLabel.textContent = "PAUSAR";
    dom.pause.setAttribute("aria-label", "Pausar animação");
    document.querySelector(".play-glyph").textContent = "Ⅱ";
    document.querySelector("#scene-status").textContent = "OBSERVAÇÃO EM CURSO";
  }
}

function togglePresenterNotes(force) {
  const visible = force ?? dom.notesPanel.hidden;
  dom.notesPanel.hidden = !visible;
  dom.notesToggle.setAttribute("aria-expanded", String(visible));
  if (visible) dom.notesPanel.querySelector(".notes-close").focus();
  else dom.notesToggle.focus();
}

function onPointerMove(event) {
  pointerTarget.set(
    ((event.clientX / window.innerWidth) - 0.5) * 2,
    -((event.clientY / window.innerHeight) - 0.5) * 2
  );
}

function onCanvasClick(event) {
  if (!webglAvailable) return;
  const bounds = dom.canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const objects = [];
  sceneGroups[currentChapter].group.traverse((object) => {
    if (object.userData.selectable) objects.push(object);
  });
  const target = raycaster.intersectObjects(objects, true)[0];
  if (!target) return;
  if (currentChapter === 2) {
    const isHorizon = target.object === sceneGroups[2].visual.horizon || target.object === sceneGroups[2].visual.lensRing;
    setBlackHoleView(isHorizon ? "horizon" : "curvature");
  } else {
    const element = sceneGroups[currentChapter].visual;
    if (currentChapter === 1 && element.satellitePivot) gsap.to(element.satellitePivot.rotation, { z: element.satellitePivot.rotation.z + Math.PI * 0.65, duration: 1.1, ease: "power2.inOut" });
    else if (currentChapter === 3) gsap.to(element.binaries.rotation, { y: element.binaries.rotation.y + Math.PI * 0.4, duration: 1.1, ease: "power2.inOut" });
    else gsap.to(target.object.rotation, { y: target.object.rotation.y + Math.PI * 0.7, duration: 1.1, ease: "power2.inOut" });
  }
}

function onKeyDown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target;
  const isEditing = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
  if (isEditing) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    selectChapter((currentChapter + delta + chapters.length) % chapters.length);
  } else if (event.key.toLowerCase() === "r") {
    resetExperience();
  } else if (event.code === "Space") {
    event.preventDefault();
    togglePause();
  } else if (event.key.toLowerCase() === "n") {
    togglePresenterNotes();
  } else if (event.key === "Escape" && !dom.notesPanel.hidden) {
    togglePresenterNotes(false);
  }
}

createNavigation();
createUniverse();
setActiveChapterUi(currentChapter, { animate: false });
dom.notes.innerHTML = `<p>${chapters[currentChapter].notes}</p><p><strong>Interação:</strong> ${chapters[currentChapter].interaction.label.toLowerCase()} com o controle da cena.</p>`;

dom.pause.addEventListener("click", togglePause);
dom.reset.addEventListener("click", resetExperience);
dom.notesToggle.addEventListener("click", () => togglePresenterNotes());
dom.notesPanel.querySelector(".notes-close").addEventListener("click", () => togglePresenterNotes(false));
document.querySelector("#brand-home").addEventListener("click", (event) => {
  event.preventDefault();
  if (currentChapter === 0) resetExperience();
  else selectChapter(0);
});
window.addEventListener("pointermove", onPointerMove, { passive: true });
dom.canvas.addEventListener("click", onCanvasClick);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("resize", () => {
  if (!webglAvailable) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
