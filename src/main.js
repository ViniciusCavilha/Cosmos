import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { createBlackHole } from "./black-hole.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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
let composer;
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

const surfaceNoise = `
float surfaceHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float surfaceNoise3(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(surfaceHash(cell), surfaceHash(cell + vec3(1.0, 0.0, 0.0)), f.x),
        mix(surfaceHash(cell + vec3(0.0, 1.0, 0.0)), surfaceHash(cell + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(surfaceHash(cell + vec3(0.0, 0.0, 1.0)), surfaceHash(cell + vec3(1.0, 0.0, 1.0)), f.x),
        mix(surfaceHash(cell + vec3(0.0, 1.0, 1.0)), surfaceHash(cell + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z
  );
}

float surfaceFbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    value += surfaceNoise3(p) * amplitude;
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}
`;

function makeSphere(radius, color, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color: options.surface ? "#ffffff" : color,
    roughness: options.roughness ?? 0.56,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive ?? "#000000",
    emissiveIntensity: options.emissiveIntensity ?? 0.18
  });
  if (options.surface) {
    const type = options.surface;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vSurfacePosition;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSurfacePosition = normalize(position);");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${type === "sun" ? "uniform float uSurfaceTime;" : ""}\nvarying vec3 vSurfacePosition;\n${surfaceNoise}`)
        .replace("#include <color_fragment>", `#include <color_fragment>
          vec3 surfacePoint = normalize(vSurfacePosition);
          float broadTerrain = surfaceFbm(surfacePoint * 5.4);
          float fineTerrain = surfaceFbm(surfacePoint * 25.0);
          ${type === "earth" ? `
            float land = smoothstep(0.475, 0.535, broadTerrain + fineTerrain * 0.2);
            float elevation = smoothstep(0.54, 0.72, broadTerrain + fineTerrain * 0.18);
            vec3 oceanColor = mix(vec3(0.006, 0.035, 0.12), vec3(0.018, 0.19, 0.36), smoothstep(0.25, 0.74, fineTerrain));
            vec3 continentColor = mix(vec3(0.045, 0.12, 0.055), vec3(0.34, 0.3, 0.16), elevation);
            continentColor = mix(continentColor, vec3(0.63, 0.66, 0.6), smoothstep(0.73, 0.85, broadTerrain));
            float polarIce = smoothstep(0.77, 0.94, abs(surfacePoint.y) + broadTerrain * 0.14);
            diffuseColor.rgb = mix(oceanColor, continentColor, land);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.79, 0.86), polarIce * 0.82);
            diffuseColor.rgb *= 0.88 + fineTerrain * 0.25;
          ` : type === "rocky" ? `
            float cratered = surfaceFbm(surfacePoint * 36.0);
            float mineral = surfaceFbm(surfacePoint * 11.0);
            vec3 rockColor = mix(vec3(0.11, 0.13, 0.17), vec3(0.48, 0.45, 0.39), mineral);
            float craterRim = smoothstep(0.46, 0.52, fineTerrain) * (1.0 - smoothstep(0.55, 0.63, fineTerrain));
            diffuseColor.rgb = rockColor * (0.68 + cratered * 0.5) + craterRim * 0.12;
          ` : type === "gas" ? `
            float bands = sin(surfacePoint.y * 37.0 + surfaceFbm(surfacePoint * 9.0) * 9.0);
            float swirls = surfaceFbm(surfacePoint * 21.0 + vec3(bands * 0.18, 0.0, bands * 0.14));
            vec3 bandColor = mix(vec3(0.16, 0.22, 0.34), vec3(0.75, 0.46, 0.25), smoothstep(-0.22, 0.66, bands + swirls * 0.34));
            diffuseColor.rgb = mix(bandColor, vec3(0.92, 0.77, 0.54), smoothstep(0.71, 0.82, fineTerrain) * 0.42);
          ` : `
            float convection = surfaceFbm(surfacePoint * 18.0 + vec3(0.0, uSurfaceTime * 0.045, 0.0));
            float filaments = surfaceFbm(surfacePoint * 58.0 + vec3(convection * 1.4, 0.0, convection * 1.4));
            vec3 photosphere = mix(vec3(0.75, 0.12, 0.018), vec3(2.5, 0.72, 0.12), smoothstep(0.29, 0.78, convection + filaments * 0.2));
            photosphere += vec3(1.0, 0.35, 0.05) * smoothstep(0.69, 0.86, fineTerrain) * 0.55;
            diffuseColor.rgb = photosphere;
            totalEmissiveRadiance = photosphere * 1.35;
          `}
        `);
      if (type === "sun") {
        shader.uniforms.uSurfaceTime = { value: 0 };
        material.userData.surfaceShader = shader;
      }
    };
    material.customProgramCacheKey = () => `cosmos-surface-${type}`;
    if (type === "sun") {
      material.emissive.set("#ff5a12");
      material.emissiveIntensity = 0.75;
    }
  }
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), material);
  if (options.selectable) mesh.userData.selectable = true;
  return mesh;
}

function createAtmosphere(radius, color = "#6da8ff", opacity = 0.55) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uAtmosphereColor: { value: new THREE.Color(color) }, uAtmosphereOpacity: { value: opacity } },
    vertexShader: `
      varying vec3 vAtmosphereNormal;
      varying vec3 vAtmosphereViewDirection;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vAtmosphereNormal = normalize(normalMatrix * normal);
        vAtmosphereViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uAtmosphereColor;
      uniform float uAtmosphereOpacity;
      varying vec3 vAtmosphereNormal;
      varying vec3 vAtmosphereViewDirection;
      void main() {
        float facing = abs(dot(normalize(vAtmosphereNormal), normalize(vAtmosphereViewDirection)));
        float fresnel = pow(1.0 - facing, 2.6);
        float glow = smoothstep(0.05, 0.88, fresnel);
        gl_FragColor = vec4(uAtmosphereColor * (0.38 + fresnel * 1.5), glow * uAtmosphereOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 48), material);
  atmosphere.renderOrder = 2;
  return atmosphere;
}

function createCloudLayer(radius) {
  const material = new THREE.MeshStandardMaterial({
    color: "#e5efff",
    transparent: true,
    opacity: 0.46,
    roughness: 1,
    depthWrite: false
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCloudPosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCloudPosition = normalize(position);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vCloudPosition;\n${surfaceNoise}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float cloudDensity = surfaceFbm(vCloudPosition * 12.0 + vec3(0.0, 0.45, 0.0));
        float cloudDetail = surfaceFbm(vCloudPosition * 35.0);
        diffuseColor.a *= smoothstep(0.49, 0.64, cloudDensity + cloudDetail * 0.12);
      `);
  };
  material.customProgramCacheKey = () => "cosmos-earth-clouds";
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.009, 72, 48), material);
  clouds.renderOrder = 1;
  return clouds;
}

function createSolarArray(width, height) {
  const array = new THREE.Group();
  const cells = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.025),
    new THREE.MeshPhysicalMaterial({
      color: "#07183f",
      emissive: "#0b2b72",
      emissiveIntensity: 0.26,
      metalness: 0.66,
      roughness: 0.18,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2
    })
  );
  array.add(cells);

  const railMaterial = new THREE.MeshStandardMaterial({ color: "#98a7b8", metalness: 0.92, roughness: 0.24 });
  for (let index = 1; index < 6; index += 1) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.008, height * 0.98, 0.032), railMaterial);
    rail.position.x = -width / 2 + (width / 6) * index;
    array.add(rail);
  }
  const centerRail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 0.009, 0.033), railMaterial);
  array.add(centerRail);
  return array;
}

function createDetailedSatellite(scale = 1) {
  const satellite = new THREE.Group();
  const goldFoil = new THREE.MeshPhysicalMaterial({
    color: "#b87924",
    emissive: "#3b1905",
    emissiveIntensity: 0.12,
    metalness: 0.86,
    roughness: 0.34,
    clearcoat: 0.28
  });
  const metal = new THREE.MeshStandardMaterial({ color: "#b7c0ca", metalness: 0.94, roughness: 0.2 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: "#171d28", metalness: 0.82, roughness: 0.28 });

  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.28, 2, 2, 2), goldFoil);
  bus.userData.selectable = true;
  const equipmentDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), darkMetal);
  equipmentDeck.rotation.z = Math.PI / 2;
  equipmentDeck.position.x = 0.2;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 10), metal);
  mast.rotation.z = Math.PI / 2;
  mast.position.x = 0.38;
  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.07, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: "#d7dbe0", metalness: 0.76, roughness: 0.17, side: THREE.DoubleSide })
  );
  dish.rotation.z = -Math.PI / 2;
  dish.position.x = 0.53;
  const receiver = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), darkMetal);
  receiver.position.x = 0.62;

  const panelLeft = createSolarArray(0.62, 0.23);
  panelLeft.position.x = -0.5;
  const panelRight = createSolarArray(0.62, 0.23);
  panelRight.position.x = 0.5;
  const panelBoom = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.022, 0.022), metal);

  const antennaOne = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.42, 8), metal);
  antennaOne.position.set(-0.08, 0.34, 0);
  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 8),
    new THREE.MeshBasicMaterial({ color: "#a8cbff", toneMapped: false })
  );
  antennaTip.position.y = 0.23;
  antennaOne.add(antennaTip);

  satellite.add(bus, equipmentDeck, mast, dish, receiver, panelBoom, panelLeft, panelRight, antennaOne);
  satellite.scale.setScalar(scale);
  satellite.rotation.set(0.18, -0.35, 0.12);
  return satellite;
}

function createDetailedSpacecraft() {
  const ship = new THREE.Group();
  const hullMaterial = new THREE.MeshPhysicalMaterial({
    color: "#aeb8c4",
    metalness: 0.82,
    roughness: 0.22,
    clearcoat: 0.48,
    clearcoatRoughness: 0.18
  });
  const heatShield = new THREE.MeshStandardMaterial({ color: "#222934", metalness: 0.68, roughness: 0.42 });
  const windowMaterial = new THREE.MeshPhysicalMaterial({
    color: "#61baff",
    emissive: "#176fc4",
    emissiveIntensity: 0.72,
    metalness: 0.15,
    roughness: 0.08,
    transmission: 0.08,
    clearcoat: 1
  });

  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.68, 24, 2), hullMaterial);
  hull.rotation.z = -Math.PI / 2;
  hull.userData.selectable = true;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 24), heatShield);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.5;
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.18, 20), heatShield);
  engine.rotation.z = -Math.PI / 2;
  engine.position.x = -0.43;
  const engineGlow = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.4, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: "#6ec8ff", transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  engineGlow.rotation.z = Math.PI / 2;
  engineGlow.position.x = -0.68;

  const windowBand = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.11, 24), windowMaterial);
  windowBand.rotation.z = -Math.PI / 2;
  windowBand.position.x = 0.22;
  const truss = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.045), hullMaterial);
  truss.position.x = -0.08;
  const panels = createSolarArray(0.5, 0.24);
  panels.rotation.y = Math.PI / 2;
  panels.position.z = 0.36;
  const panelsMirror = panels.clone(true);
  panelsMirror.position.z = -0.36;
  const radiator = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.018, 0.18),
    new THREE.MeshStandardMaterial({ color: "#e0e4e7", metalness: 0.58, roughness: 0.28 })
  );
  radiator.position.set(-0.15, 0.23, 0);

  ship.add(hull, nose, engine, engineGlow, windowBand, truss, panels, panelsMirror, radiator);
  return { ship, engineGlow, windowBand };
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
  const starMaterial = new THREE.PointsMaterial({
    size: 0.095,
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    sizeAttenuation: true
  });
  starMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       float starDisc = length(gl_PointCoord - vec2(0.5));
       diffuseColor.a *= 1.0 - smoothstep(0.12, 0.5, starDisc);
       diffuseColor.rgb *= 0.78 + 0.22 * (1.0 - starDisc * 2.0);`
    );
  };
  starMaterial.customProgramCacheKey = () => "cosmos-soft-star-points";
  const stars = new THREE.Points(geometry, starMaterial);
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
  const center = makeSphere(0.9, "#203a77", { surface: "rocky", selectable: true });
  center.position.set(0, -0.25, 0);
  group.add(center);
  const atmosphere = createAtmosphere(0.99, "#719bff", 0.46);
  atmosphere.position.copy(center.position);
  group.add(atmosphere);
  const clouds = createCloudLayer(0.9);
  clouds.position.copy(center.position);
  group.add(clouds);
  const centerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 32, 24),
    new THREE.MeshBasicMaterial({ color: "#6d8fff", transparent: true, opacity: 0.06, side: THREE.BackSide })
  );
  centerGlow.position.copy(center.position);
  group.add(centerGlow);
  return { grid, center, centerGlow, atmosphere, clouds };
}

function createGravityScene(group) {
  const grid = createWarpedGrid(group, { color: "#657db9", extent: 7.4, divisions: 17, depth: 3.5 });
  const sun = makeSphere(1.12, "#d29b68", { surface: "sun", selectable: true });
  sun.position.y = -0.62;
  group.add(sun);
  const corona = createAtmosphere(1.28, "#ff9a55", 0.7);
  corona.position.copy(sun.position);
  group.add(corona);
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
  const planet = makeSphere(0.23, "#8baeff", { surface: "earth", selectable: true });
  const planetAtmosphere = createAtmosphere(0.265, "#80bfff", 0.48);
  planet.add(planetAtmosphere);
  planet.position.x = 3.1;
  satellitePivot.add(planet);
  return { grid, sun, aura, corona, satellitePivot, planet, orbit };
}

function createBlackHoleScene(group) {
  group.position.set(1.05, 0.6, 0);
  const blackHole = createBlackHole();
  group.add(blackHole.mesh);
  const curvature = createWarpedGrid(group, { color: "#a27cff", extent: 7, divisions: 18, depth: 2.7, centerRadius: 1.1 });
  curvature.visible = false;
  const curvatureMaterials = [];
  curvature.traverse((object) => {
    if (!object.material) return;
    object.renderOrder = 11;
    object.material.userData.baseOpacity = object.material.opacity;
    curvatureMaterials.push(object.material);
  });
  return { ...blackHole, curvature, curvatureMaterials };
}

function fitBlackHoleToViewport() {
  const { group, visual } = sceneGroups[2];
  const mobile = window.innerWidth <= 650;
  group.position.set(mobile ? 0 : 1.05, mobile ? 1.5 : 0.6, 0);
  visual.mesh.scale.setScalar(mobile ? 0.48 : 1);
}

function createWavesScene(group) {
  const binaries = new THREE.Group();
  group.add(binaries);
  const createBinaryHole = (radius, color) => {
    const black = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 48),
      new THREE.MeshBasicMaterial({ color: "#000000" })
    );
    black.userData.selectable = true;
    const photonRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.13, radius * 0.035, 8, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending })
    );
    photonRing.rotation.x = 0.34;
    const body = new THREE.Group();
    body.add(black, photonRing);
    return body;
  };
  const starOne = createBinaryHole(0.48, "#8c92ff");
  const starTwo = createBinaryHole(0.37, "#dba2ff");
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
  const earth = makeSphere(0.56, "#315ca9", { surface: "earth", selectable: true });
  earth.position.x = -2.15;
  earth.position.y = 1.3;
  const earthClouds = createCloudLayer(0.56);
  earthClouds.rotation.z = -0.16;
  earth.add(earthClouds);
  earth.add(createAtmosphere(0.62, "#6da8ff", 0.5));
  group.add(earth);
  const traveller = new THREE.Group();
  traveller.position.y = 1.3;
  group.add(traveller);
  const spacecraft = createDetailedSpacecraft();
  const ship = spacecraft.ship;
  traveller.add(ship);
  const shipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.009, 6, 80),
    new THREE.MeshBasicMaterial({ color: "#a5c8ff", transparent: true, opacity: 0.42 })
  );
  shipRing.rotation.x = Math.PI / 2;
  ship.add(shipRing);
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
  return { traveller, ship, shipCore: spacecraft.windowBand, engineGlow: spacecraft.engineGlow, earth, hand, clockGroup };
}

function createGpsScene(group) {
  const earth = makeSphere(1.55, "#23539a", { surface: "earth", selectable: true });
  group.add(earth);
  const clouds = createCloudLayer(1.55);
  earth.add(clouds);
  const atmosphere = createAtmosphere(1.78, "#55a5ff", 0.62);
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
    const model = createDetailedSatellite(index === 1 ? 0.48 : 0.42);
    model.rotation.y += index * 0.8;
    satellite.add(model);
    group.add(orbitalGroup);
    return { orbitalGroup, satellite, model, speed: config.speed };
  });
  return { earth, clouds, atmosphere, satellites };
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0003;
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
    group.userData.chapterId = chapters[index].id;
    scene.add(group);
    const visual = build(group);
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = object.geometry.type === "SphereGeometry";
      object.receiveShadow = object.geometry.type === "SphereGeometry";
    });
    sceneGroups.push({ group, visual });
  });
  scene.userData.stars = stars;
  fitBlackHoleToViewport();

  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1, 1200 / window.innerWidth));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.18, 0.3, 1.5));
  composer.addPass(new OutputPass());

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
    if (currentChapter === 0 && active.clouds) active.clouds.rotation.y += 0.0008;
    if (currentChapter === 1) {
      const surfaceShader = active.sun.material.userData.surfaceShader;
      if (surfaceShader?.uniforms.uSurfaceTime) surfaceShader.uniforms.uSurfaceTime.value = elapsed;
      active.planet.rotation.y += 0.002;
    }
    if (currentChapter === 2) {
      active.material.uniforms.uTime.value = elapsed;
      active.material.uniforms.uView.value.copy(pointer);
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
      active.earth.rotation.y += 0.0011;
      active.engineGlow.material.opacity = 0.3 + Math.sin(elapsed * 5.2) * 0.08 + interactionValue / 500;
      active.hand.rotation.z = -elapsed * 0.08;
    }
    if (currentChapter === 5) {
      active.earth.rotation.y += 0.0012;
      active.clouds.rotation.y += 0.0016;
      active.satellites.forEach(({ orbitalGroup, model, speed }, index) => {
        orbitalGroup.rotation.y += speed * 0.005 * (0.7 + interactionValue / 100);
        orbitalGroup.rotation.z += (index + 1) * 0.0001;
        model.rotation.z += 0.0012 * (index % 2 === 0 ? 1 : -1);
      });
    }
    if (currentChapter === 2) composer.render();
    else renderer.render(scene, camera);
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
  const isCurvature = view === "curvature";
  if (webglAvailable) {
    const visual = sceneGroups[2].visual;
    gsap.killTweensOf(visual.curvatureMaterials);
    if (isCurvature) visual.curvature.visible = true;
    gsap.to(visual.curvatureMaterials, {
      opacity: (index, material) => isCurvature ? material.userData.baseOpacity : 0,
      duration: 0.7,
      onComplete: () => {
        if (!isCurvature && activeView === "horizon") visual.curvature.visible = false;
      }
    });
    gsap.to(visual.material.uniforms.uDiskOpacity, {
      value: isCurvature ? 0.25 : 1,
      duration: 0.65
    });
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
    visual.material.uniforms.uDiskOpacity
  ]);
  visual.curvature.visible = false;
  visual.curvatureMaterials.forEach((material) => { material.opacity = 0; });
  visual.material.uniforms.uDiskOpacity.value = 1;
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

function transitionScene(fromIndex, toIndex, duration = 0.7) {
  if (!webglAvailable) return;
  activeTimeline?.kill();
  gsap.killTweensOf(cameraState);

  // Visibility changes synchronously. No delayed callback may reveal an old chapter.
  sceneGroups.forEach(({ group }, index) => {
    gsap.killTweensOf([group.scale, group.rotation]);
    group.visible = index === toIndex;
    group.scale.setScalar(1);
    group.rotation.set(0, 0, 0);
  });
  if (fromIndex === 2 || toIndex === 2) resetBlackHoleVisual();

  const incoming = sceneGroups[toIndex].group;
  const nextCamera = chapters[toIndex].camera;
  incoming.scale.setScalar(0.96);
  activeTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });
  activeTimeline.to(incoming.scale, { x: 1, y: 1, z: 1, duration }, 0);
  activeTimeline.to(cameraState, {
    x: nextCamera[0],
    y: nextCamera[1],
    z: nextCamera[2],
    duration
  }, 0);
}

function selectChapter(index, options = {}) {
  if (index < 0 || index >= chapters.length || index === currentChapter) return;
  const previous = currentChapter;
  currentChapter = index;
  interactionValue = chapters[index].interaction?.value ?? 50;
  if (index === 2) resetBlackHoleVisual();
  if (isPaused) {
    activeTimeline?.resume();
    clock.start();
  }
  isPaused = false;
  dom.pauseLabel.textContent = "PAUSAR";
  dom.pause.setAttribute("aria-label", "Pausar animação");
  document.querySelector(".play-glyph").textContent = "Ⅱ";
  setActiveChapterUi(index);
  transitionScene(previous, index, options.immediate || prefersReducedMotion ? 0.01 : 0.7);
}

function resetExperience() {
  isPaused = false;
  activeTimeline?.kill();
  activeTimeline = null;
  pointerTarget.set(0, 0);
  pointer.set(0, 0);
  interactionValue = chapters[currentChapter].interaction?.value ?? 50;
  activeView = "horizon";
  gsap.killTweensOf(cameraState);
  const homeCamera = chapters[currentChapter].camera;
  Object.assign(cameraState, { x: homeCamera[0], y: homeCamera[1], z: homeCamera[2] });
  clock.start();
  if (webglAvailable) {
    sceneGroups.forEach(({ group }, index) => {
      group.visible = index === currentChapter;
      group.scale.setScalar(1);
      group.rotation.set(0, 0, 0);
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
    activeTimeline?.pause();
    clock.stop();
    dom.pauseLabel.textContent = "RETOMAR";
    dom.pause.setAttribute("aria-label", "Retomar animação");
    document.querySelector(".play-glyph").textContent = "▶";
    document.querySelector("#scene-status").textContent = "OBSERVAÇÃO PAUSADA";
  } else {
    activeTimeline?.resume();
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
    const isHorizon = target.uv && target.uv.distanceTo(new THREE.Vector2(0.5, 0.5)) < 0.13;
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
  fitBlackHoleToViewport();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1, 1200 / window.innerWidth));
  composer.setSize(window.innerWidth, window.innerHeight);
});
