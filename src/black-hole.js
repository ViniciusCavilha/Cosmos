import * as THREE from "three";

// Numerical, non-rotating Schwarzschild approximation in units where Rs = 0.5.
// The two images of the disk come from repeated ray/plane intersections.
// This is an artistic real-time model, not a calibrated scientific renderer.
const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uDiskOpacity;
  uniform vec2 uView;
  uniform sampler2D uNoise;
  varying vec2 vUv;

  const float RS = 0.5;
  const float INNER = 1.15;
  const float OUTER = 6.5;

  float noise(vec2 p) {
    return texture2D(uNoise, p / 256.0).r;
  }

  // Anisotropic, advected noise makes irregular streams, not concentric sine bands.
  float plasma(float r, float angle) {
    float orbit = uTime * 0.27 / pow(r, 1.5);
    vec2 q = vec2(log(r) * 125.0, (angle + orbit) * 40.743665);
    float warp = noise(vec2(r * 6.0, q.y));
    q.x += (warp - 0.5) * 1.2;
    float value = noise(q) * 0.48;
    value += noise(q * vec2(2.03, 2.0) + 31.4) * 0.27;
    value += noise(q * vec2(4.11, 4.0) + 73.2) * 0.16;
    value += noise(q * vec2(8.23, 8.0) + 123.4) * 0.09;
    return value;
  }

  vec4 diskSample(vec3 p, vec3 velocity) {
    float radius = length(p.xz);
    if (radius < INNER || radius > OUTER) return vec4(0.0);
    float angle = atan(p.z, p.x);
    float texture = plasma(radius, angle);
    float grain = noise(vec2(radius * 330.0, angle * 162.97466 + uTime * 0.15));
    float rim = smoothstep(INNER, INNER + 0.25, radius);
    float fade = 1.0 - smoothstep(3.7, OUTER, radius);
    float falloff = pow(INNER / radius, 2.0);
    float structure = pow(mix(0.55, 1.4, texture), 2.0) * (0.92 + 0.16 * grain);
    float heat = pow(INNER / radius, 0.72);
    vec3 thermal = mix(vec3(0.65, 0.36, 0.22), vec3(0.82, 0.94, 1.12), heat);
    vec3 orbitalVelocity = normalize(vec3(-p.z, 0.0, p.x));
    float boost = clamp(1.0 + dot(orbitalVelocity, -normalize(velocity)) * 0.3, 0.65, 1.35);
    float emission = 4.5 * rim * fade * falloff * structure * pow(boost, 2.0);
    float opacity = rim * fade * (0.62 + texture * 0.3) * uDiskOpacity;
    return vec4(thermal * emission, opacity);
  }

  vec3 acceleration(vec3 p, float h2) {
    float r2 = dot(p, p);
    return -1.5 * RS * h2 * p / (r2 * r2 * sqrt(r2));
  }

  void main() {
    vec2 screen = (vUv - 0.5) * vec2(15.0, 10.0);
    float tilt = 0.16;
    screen = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * screen;
    vec3 origin = vec3(uView.x * 0.5, 2.7 + uView.y * 0.55, 17.0);
    vec3 forward = normalize(-origin);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 velocity = normalize(forward * length(origin) + right * screen.x + up * screen.y);
    vec3 p = origin;
    vec3 angularMomentum = cross(p, velocity);
    float h2 = dot(angularMomentum, angularMomentum);
    vec3 radiance = vec3(0.0);
    float transmission = 1.0;
    float captured = 0.0;

    // Velocity Verlet, shorter steps around the photon sphere.
    // Texture work is only done at intersections, not on every integration step.
    for (int i = 0; i < 180; i++) {
      float radius = length(p);
      if (radius < RS * 1.015) { captured = 1.0; break; }
      if (radius > 22.0 || transmission < 0.015) break;
      float stepSize = clamp(radius * 0.075, 0.025, 0.75);
      vec3 a = acceleration(p, h2);
      vec3 next = p + velocity * stepSize + 0.5 * a * stepSize * stepSize;
      vec3 nextVelocity = velocity + 0.5 * (a + acceleration(next, h2)) * stepSize;
      if (p.y * next.y < 0.0) {
        float intersection = p.y / (p.y - next.y);
        vec3 hit = mix(p, next, intersection);
        vec4 disk = diskSample(hit, mix(velocity, nextVelocity, intersection));
        radiance += transmission * disk.rgb * disk.a;
        transmission *= 1.0 - disk.a;
      }
      p = next;
      velocity = nextVelocity;
    }

    float alpha = 1.0 - transmission * (1.0 - captured);
    // Straight alpha lets the traced shadow occlude the existing star field.
    vec3 color = radiance / max(alpha, 0.0001);
    gl_FragColor = vec4(color, alpha * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function makeNoiseTexture() {
  const data = new Uint8Array(256 * 256 * 4);
  let seed = 92473;
  for (let i = 0; i < data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = seed >>> 24;
    data.set([value, value, value, 255], i);
  }
  const texture = new THREE.DataTexture(data, 256, 256);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createBlackHole() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uDiskOpacity: { value: 1 },
      uView: { value: new THREE.Vector2() },
      uNoise: { value: makeNoiseTexture() }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.6), material);
  mesh.renderOrder = 10;
  mesh.userData.selectable = true;
  mesh.onBeforeRender = () => { material.uniforms.uOpacity.value = material.opacity; };
  return { mesh, material };
}
