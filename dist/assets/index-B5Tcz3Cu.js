import{S as fe,D as X,V as $,M as p,P as Ce,a as Me,R as Oe,L as Pe,b as ke,W as Ee,c as Te,A as Re,d as ze,e as De,C as ve,F as Le,f as Ie,H as Ne,g as qe,h as de,G as C,E as Ve,i as Ge,U as He,O as Ue,j as Be,B as he,k as me,l as Fe,m as $e,n as D,o as g,p as ae,T,q as O,r as We,s as N,t as oe,u as H,v as G,w as Q,x as I,y as _e,z as je,I as Ke}from"./three-DR0ywVO2.js";import{g as w}from"./gsap-xgxdCp6f.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function t(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=t(o);fetch(o.href,s)}})();const Xe=`
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
`;function Je(){const e=new Uint8Array(262144);let a=92473;for(let n=0;n<e.length;n+=4){a=Math.imul(a,1664525)+1013904223>>>0;const o=a>>>24;e.set([o,o,o,255],n)}const t=new Me(e,256,256);return t.wrapS=t.wrapT=Oe,t.magFilter=Pe,t.minFilter=ke,t.generateMipmaps=!0,t.needsUpdate=!0,t}function Ye(){const e=new fe({uniforms:{uTime:{value:0},uOpacity:{value:1},uDiskOpacity:{value:1},uView:{value:new $},uNoise:{value:Je()}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:Xe,transparent:!0,depthTest:!1,depthWrite:!1,side:X}),a=new p(new Ce(8.4,5.6),e);return a.renderOrder=10,a.userData.selectable=!0,a.onBeforeRender=()=>{e.uniforms.uOpacity.value=e.opacity},{mesh:a,material:e}}const h=[{id:"spacetime",title:"O tecido<br /><em>do universo</em>",kicker:"FUNDAMENTOS",description:"Espaço e tempo não são um palco imóvel: juntos, formam uma trama dinâmica que conecta tudo o que existe.",fact:"Na relatividade, não existe um “agora” universal compartilhado por todo o cosmos.",notes:"Comece perguntando à turma se espaço e tempo são coisas separadas. Apresente o espaço-tempo como uma estrutura de quatro dimensões: três espaciais e uma temporal. A visualização é uma analogia, não uma superfície material.",interaction:{label:"ONDULAÇÃO DO CAMPO",min:0,max:100,value:48,unit:"%"},coordinate:["CAMPO ESPACIAL","3D · INTERATIVO"],camera:[0,0,14]},{id:"gravity",title:"A gravidade<br /><em>é geometria</em>",kicker:"CURVATURA",description:"A matéria curva o espaço-tempo. Planetas e estrelas seguem os caminhos moldados por essa geometria.",fact:"A Terra orbita o Sol seguindo uma trajetória no espaço-tempo curvo, não sendo puxada por uma corda invisível.",notes:"Use a malha para visualizar como uma concentração de massa altera a geometria ao redor. A analogia do lençol elástico ajuda a começar, mas não reproduz a gravidade em três dimensões nem a curvatura temporal.",interaction:{label:"MASSA DO OBJETO",min:10,max:100,value:56,unit:"%"},coordinate:["MASSA RELATIVA","M · R² GEOMÉTRICA"],camera:[1.2,.4,12]},{id:"blackhole",title:"Onde a luz<br /><em>se curva</em>",kicker:"REGIÃO DE COLAPSO",description:"Tão denso que nem a luz escapa. Ao cruzar o horizonte de eventos, nenhum caminho leva de volta.",fact:"O buraco negro desta cena é um modelo visual: as lentes e o disco não representam uma simulação física exata.",notes:"Dê tempo para a aproximação do buraco negro antes de explicar o horizonte de eventos. É a fronteira a partir da qual nem mesmo a luz pode escapar. Troque entre horizonte e curvatura nos instrumentos. Deixe explícito que o disco e a lente gravitacional são recursos didáticos, não uma previsão numérica.",coordinate:["REGIÃO OBSERVADA","MODELO · NÃO À ESCALA"],camera:[0,0,7.2]},{id:"waves",title:"O universo<br /><em>em vibração</em>",kicker:"ONDAS GRAVITACIONAIS",description:"Massas aceleradas estremecem o espaço-tempo. Essas ondulações viajam pelo cosmos à velocidade da luz.",fact:"Em 2015, o LIGO detectou pela primeira vez ondas gravitacionais de dois buracos negros em fusão.",notes:"Apresente ondas gravitacionais como ondulações do próprio espaço-tempo, não ondas que se propagam dentro dele. A detecção do LIGO veio de um sinal minúsculo, menor que o diâmetro de um próton em relação aos quatro quilômetros dos braços do instrumento.",interaction:{label:"AMPLITUDE DA ONDA",min:5,max:100,value:56,unit:"%"},coordinate:["FREQUÊNCIA","OSCILAÇÃO · 3D"],camera:[0,0,11]},{id:"twins",title:"Dois relógios,<br /><em>dois tempos</em>",kicker:"PARADOXO DOS GÊMEOS",description:"Um viajante em alta velocidade envelhece menos que quem ficou. O tempo próprio depende do caminho percorrido.",fact:"O efeito é real: relógios em aviões registram diferenças minúsculas, mas mensuráveis.",notes:"O paradoxo é resolvido porque os dois gêmeos percorrem trajetórias diferentes pelo espaço-tempo; o viajante também precisa inverter o sentido para regressar. O efeito existe e relógios atômicos já o mediram. Explore o controle de velocidade.",interaction:{label:"VELOCIDADE DE VIAGEM",min:5,max:95,value:52,unit:"% c"},coordinate:["DILATAÇÃO TEMPORAL","VELOCIDADE · % c"],camera:[0,.7,12]},{id:"gps",title:"O tempo que<br /><em>guia você</em>",kicker:"RELATIVIDADE EM ÓRBITA",description:"Satélites GPS sentem a gravidade mais fraca e viajam depressa. Juntos, os dois efeitos ajustam seus relógios.",fact:"Sem correções relativísticas, o GPS acumularia erros de posição de vários quilômetros por dia.",notes:"Satélites estão em uma região de gravidade mais fraca, então seus relógios adiantam em relação aos relógios terrestres. O movimento orbital faz os relógios atrasarem. O efeito gravitacional prevalece, e o sistema precisa corrigir a diferença diariamente para manter a precisão.",interaction:{label:"CORREÇÃO RELATIVÍSTICA",min:0,max:100,value:64,unit:"%"},coordinate:["ÓRBITA","20 200 KM · ALTITUDE"],camera:[0,.2,12]}],c={canvas:document.querySelector("#universe"),navigation:document.querySelector("#chapter-navigation"),kicker:document.querySelector("#scene-kicker"),title:document.querySelector("#scene-title"),description:document.querySelector("#scene-description"),fact:document.querySelector("#scene-fact"),controls:document.querySelector("#scene-controls"),panelIndex:document.querySelector("#panel-index"),coordinateLabel:document.querySelector("#coordinate-label"),coordinateValue:document.querySelector("#coordinate-value"),notesToggle:document.querySelector("#presenter-toggle"),notesPanel:document.querySelector("#presenter-notes"),notes:document.querySelector("#notes-content"),pause:document.querySelector("#pause-button"),pauseLabel:document.querySelector("#pause-label"),reset:document.querySelector("#reset-button"),fallbackMessage:document.querySelector("#webgl-fallback-message")},Z=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let m=0,R=!1,z="horizon",M=h[0].interaction.value,x,E,S,P,W,A=new $,_=new $;const y={x:0,y:0,z:14};let k,L=!1;const b=[],U=new Be,j={wave:1,curvature:.48};function ee(e,a,t=.22){const n=new he().setFromPoints(e);return new _e(n,new je({color:a,transparent:!0,opacity:t,depthWrite:!1}))}const we=`
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
`;function B(e,a,t={}){const n=new N({color:t.surface?"#ffffff":a,roughness:t.roughness??.56,metalness:t.metalness??.12,emissive:t.emissive??"#000000",emissiveIntensity:t.emissiveIntensity??.18});if(t.surface){const s=t.surface;n.onBeforeCompile=i=>{i.vertexShader=i.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vSurfacePosition;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vSurfacePosition = normalize(position);`),i.fragmentShader=i.fragmentShader.replace("#include <common>",`#include <common>
${s==="sun"?"uniform float uSurfaceTime;":""}
varying vec3 vSurfacePosition;
${we}`).replace("#include <color_fragment>",`#include <color_fragment>
          vec3 surfacePoint = normalize(vSurfacePosition);
          float broadTerrain = surfaceFbm(surfacePoint * 5.4);
          float fineTerrain = surfaceFbm(surfacePoint * 25.0);
          ${s==="earth"?`
            float land = smoothstep(0.475, 0.535, broadTerrain + fineTerrain * 0.2);
            float elevation = smoothstep(0.54, 0.72, broadTerrain + fineTerrain * 0.18);
            vec3 oceanColor = mix(vec3(0.006, 0.035, 0.12), vec3(0.018, 0.19, 0.36), smoothstep(0.25, 0.74, fineTerrain));
            vec3 continentColor = mix(vec3(0.045, 0.12, 0.055), vec3(0.34, 0.3, 0.16), elevation);
            continentColor = mix(continentColor, vec3(0.63, 0.66, 0.6), smoothstep(0.73, 0.85, broadTerrain));
            float polarIce = smoothstep(0.77, 0.94, abs(surfacePoint.y) + broadTerrain * 0.14);
            diffuseColor.rgb = mix(oceanColor, continentColor, land);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.79, 0.86), polarIce * 0.82);
            diffuseColor.rgb *= 0.88 + fineTerrain * 0.25;
          `:s==="rocky"?`
            float cratered = surfaceFbm(surfacePoint * 36.0);
            float mineral = surfaceFbm(surfacePoint * 11.0);
            vec3 rockColor = mix(vec3(0.11, 0.13, 0.17), vec3(0.48, 0.45, 0.39), mineral);
            float craterRim = smoothstep(0.46, 0.52, fineTerrain) * (1.0 - smoothstep(0.55, 0.63, fineTerrain));
            diffuseColor.rgb = rockColor * (0.68 + cratered * 0.5) + craterRim * 0.12;
          `:s==="gas"?`
            float bands = sin(surfacePoint.y * 37.0 + surfaceFbm(surfacePoint * 9.0) * 9.0);
            float swirls = surfaceFbm(surfacePoint * 21.0 + vec3(bands * 0.18, 0.0, bands * 0.14));
            vec3 bandColor = mix(vec3(0.16, 0.22, 0.34), vec3(0.75, 0.46, 0.25), smoothstep(-0.22, 0.66, bands + swirls * 0.34));
            diffuseColor.rgb = mix(bandColor, vec3(0.92, 0.77, 0.54), smoothstep(0.71, 0.82, fineTerrain) * 0.42);
          `:`
            float convection = surfaceFbm(surfacePoint * 18.0 + vec3(0.0, uSurfaceTime * 0.045, 0.0));
            float filaments = surfaceFbm(surfacePoint * 58.0 + vec3(convection * 1.4, 0.0, convection * 1.4));
            vec3 photosphere = mix(vec3(0.75, 0.12, 0.018), vec3(2.5, 0.72, 0.12), smoothstep(0.29, 0.78, convection + filaments * 0.2));
            photosphere += vec3(1.0, 0.35, 0.05) * smoothstep(0.69, 0.86, fineTerrain) * 0.55;
            diffuseColor.rgb = photosphere;
            totalEmissiveRadiance = photosphere * 1.35;
          `}
        `),s==="sun"&&(i.uniforms.uSurfaceTime={value:0},n.userData.surfaceShader=i)},n.customProgramCacheKey=()=>`cosmos-surface-${s}`,s==="sun"&&(n.emissive.set("#ff5a12"),n.emissiveIntensity=.75)}const o=new p(new D(e,96,64),n);return t.selectable&&(o.userData.selectable=!0),o}function F(e,a="#6da8ff",t=.55){const n=new fe({uniforms:{uAtmosphereColor:{value:new ve(a)},uAtmosphereOpacity:{value:t}},vertexShader:`
      varying vec3 vAtmosphereNormal;
      varying vec3 vAtmosphereViewDirection;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vAtmosphereNormal = normalize(normalMatrix * normal);
        vAtmosphereViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,fragmentShader:`
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
    `,side:ae,transparent:!0,blending:oe,depthWrite:!1}),o=new p(new D(e,72,48),n);return o.renderOrder=2,o}function ne(e){const a=new N({color:"#e5efff",transparent:!0,opacity:.46,roughness:1,depthWrite:!1});a.onBeforeCompile=n=>{n.vertexShader=n.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vCloudPosition;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vCloudPosition = normalize(position);`),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vCloudPosition;
${we}`).replace("#include <color_fragment>",`#include <color_fragment>
        float cloudDensity = surfaceFbm(vCloudPosition * 12.0 + vec3(0.0, 0.45, 0.0));
        float cloudDetail = surfaceFbm(vCloudPosition * 35.0);
        diffuseColor.a *= smoothstep(0.49, 0.64, cloudDensity + cloudDetail * 0.12);
      `)},a.customProgramCacheKey=()=>"cosmos-earth-clouds";const t=new p(new D(e*1.009,72,48),a);return t.renderOrder=1,t}function te(e,a){const t=new C,n=new p(new I(e,a,.025),new H({color:"#07183f",emissive:"#0b2b72",emissiveIntensity:.26,metalness:.66,roughness:.18,clearcoat:.72,clearcoatRoughness:.2}));t.add(n);const o=new N({color:"#98a7b8",metalness:.92,roughness:.24});for(let i=1;i<6;i+=1){const r=new p(new I(.008,a*.98,.032),o);r.position.x=-e/2+e/6*i,t.add(r)}const s=new p(new I(e*.98,.009,.033),o);return t.add(s),t}function Qe(e=1){const a=new C,t=new H({color:"#b87924",emissive:"#3b1905",emissiveIntensity:.12,metalness:.86,roughness:.34,clearcoat:.28}),n=new N({color:"#b7c0ca",metalness:.94,roughness:.2}),o=new N({color:"#171d28",metalness:.82,roughness:.28}),s=new p(new I(.34,.28,.28,2,2,2),t);s.userData.selectable=!0;const i=new p(new G(.14,.14,.08,20),o);i.rotation.z=Math.PI/2,i.position.x=.2;const r=new p(new G(.018,.018,.28,10),n);r.rotation.z=Math.PI/2,r.position.x=.38;const l=new p(new Q(.16,.07,32,1,!0),new H({color:"#d7dbe0",metalness:.76,roughness:.17,side:X}));l.rotation.z=-Math.PI/2,l.position.x=.53;const d=new p(new D(.025,12,8),o);d.position.x=.62;const u=te(.62,.23);u.position.x=-.5;const f=te(.62,.23);f.position.x=.5;const v=new p(new I(1.05,.022,.022),n),q=new p(new G(.009,.009,.42,8),n);q.position.set(-.08,.34,0);const V=new p(new D(.025,12,8),new g({color:"#a8cbff",toneMapped:!1}));return V.position.y=.23,q.add(V),a.add(s,i,r,l,d,v,u,f,q),a.scale.setScalar(e),a.rotation.set(.18,-.35,.12),a}function Ze(){const e=new C,a=new H({color:"#aeb8c4",metalness:.82,roughness:.22,clearcoat:.48,clearcoatRoughness:.18}),t=new N({color:"#222934",metalness:.68,roughness:.42}),n=new H({color:"#61baff",emissive:"#176fc4",emissiveIntensity:.72,metalness:.15,roughness:.08,transmission:.08,clearcoat:1}),o=new p(new G(.15,.22,.68,24,2),a);o.rotation.z=-Math.PI/2,o.userData.selectable=!0;const s=new p(new Q(.22,.34,24),t);s.rotation.z=-Math.PI/2,s.position.x=.5;const i=new p(new G(.16,.11,.18,20),t);i.rotation.z=-Math.PI/2,i.position.x=-.43;const r=new p(new Q(.1,.4,20,1,!0),new g({color:"#6ec8ff",transparent:!0,opacity:.42,blending:oe,side:X,depthWrite:!1}));r.rotation.z=Math.PI/2,r.position.x=-.68;const l=new p(new G(.158,.158,.11,24),n);l.rotation.z=-Math.PI/2,l.position.x=.22;const d=new p(new I(.62,.045,.045),a);d.position.x=-.08;const u=te(.5,.24);u.rotation.y=Math.PI/2,u.position.z=.36;const f=u.clone(!0);f.position.z=-.36;const v=new p(new I(.34,.018,.18),new N({color:"#e0e4e7",metalness:.58,roughness:.28}));return v.position.set(-.15,.23,0),e.add(o,s,i,r,l,d,u,f,v),{ship:e,engineGlow:r,windowBand:l}}function et(){const a=new Float32Array(6600),t=new Float32Array(2200*3);for(let i=0;i<2200;i+=1){const r=18+Math.random()*68,l=Math.random()*Math.PI*2,d=Math.acos(Math.random()*2-1);a[i*3]=r*Math.sin(d)*Math.cos(l),a[i*3+1]=r*Math.sin(d)*Math.sin(l),a[i*3+2]=r*Math.cos(d);const u=.55+Math.random()*.45;t[i*3]=u*.7,t[i*3+1]=u*.79,t[i*3+2]=u}const n=new he;n.setAttribute("position",new me(a,3)),n.setAttribute("color",new me(t,3));const o=new Fe({size:.095,vertexColors:!0,transparent:!0,opacity:.76,sizeAttenuation:!0});o.onBeforeCompile=i=>{i.fragmentShader=i.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
       float starDisc = length(gl_PointCoord - vec2(0.5));
       diffuseColor.a *= 1.0 - smoothstep(0.12, 0.5, starDisc);
       diffuseColor.rgb *= 0.78 + 0.22 * (1.0 - starDisc * 2.0);`)},o.customProgramCacheKey=()=>"cosmos-soft-star-points";const s=new $e(n,o);return S.add(s),s}function re(e,a={}){const{color:t="#758acb",extent:n=8,divisions:o=16,depth:s=1.3,centerRadius:i=0}=a,r=new C;for(let l=0;l<=o;l+=1){const d=-n+l/o*n*2;for(const u of[!1,!0]){const f=[];for(let v=0;v<=48;v+=1){const q=-n+v/48*n*2,V=u?d:q,Y=u?q:d,ue=Math.sqrt(V*V+Y*Y)+.16,xe=s/Math.pow(ue,.72),Ae=i>0&&ue<i;f.push(new O(V,Ae?0:-xe,Y))}r.add(ee(f,t,.3))}}return e.add(r),r}function tt(e){const a=re(e,{color:"#566eaf",extent:7.2,divisions:19,depth:.35});a.rotation.x=-.08;const t=B(.9,"#203a77",{surface:"rocky",selectable:!0});t.position.set(0,-.25,0),e.add(t);const n=F(.99,"#719bff",.46);n.position.copy(t.position),e.add(n);const o=ne(.9);o.position.copy(t.position),e.add(o);const s=new p(new D(1.12,32,24),new g({color:"#6d8fff",transparent:!0,opacity:.06,side:ae}));return s.position.copy(t.position),e.add(s),{grid:a,center:t,centerGlow:s,atmosphere:n,clouds:o}}function at(e){const a=re(e,{color:"#657db9",extent:7.4,divisions:17,depth:3.5}),t=B(1.12,"#d29b68",{surface:"sun",selectable:!0});t.position.y=-.62,e.add(t);const n=F(1.28,"#ff9a55",.7);n.position.copy(t.position),e.add(n);const o=new p(new D(1.42,32,24),new g({color:"#f5b467",transparent:!0,opacity:.075,side:ae}));o.position.copy(t.position),e.add(o);const s=new p(new T(3.1,.009,6,180),new g({color:"#b4c3ff",transparent:!0,opacity:.3}));s.rotation.x=Math.PI/2,s.position.y=-.45,e.add(s);const i=new C;i.rotation.x=Math.PI/2,e.add(i);const r=B(.23,"#8baeff",{surface:"earth",selectable:!0}),l=F(.265,"#80bfff",.48);return r.add(l),r.position.x=3.1,i.add(r),{grid:a,sun:t,aura:o,corona:n,satellitePivot:i,planet:r,orbit:s}}function ot(e){e.position.set(1.05,.6,0);const a=Ye();e.add(a.mesh);const t=re(e,{color:"#a27cff",extent:7,divisions:18,depth:2.7,centerRadius:1.1});t.visible=!1;const n=[];return t.traverse(o=>{o.material&&(o.renderOrder=11,o.material.userData.baseOpacity=o.material.opacity,n.push(o.material))}),{...a,curvature:t,curvatureMaterials:n}}function ge(){const{group:e,visual:a}=b[2],t=window.innerWidth<=650;e.position.set(t?0:1.05,t?1.5:.6,0),a.mesh.scale.setScalar(t?.48:1)}function nt(e){const a=new C;e.add(a);const t=(r,l)=>{const d=new p(new D(r,64,48),new g({color:"#000000"}));d.userData.selectable=!0;const u=new p(new T(r*1.13,r*.035,8,96),new g({color:l,transparent:!0,opacity:.78,blending:oe}));u.rotation.x=.34;const f=new C;return f.add(d,u),f},n=t(.48,"#8c92ff"),o=t(.37,"#dba2ff");o.position.x=1.8,a.add(n,o);const s=new p(new T(.9,.01,6,120),new g({color:"#a9baff",transparent:!0,opacity:.22}));a.add(s);const i=[];for(let r=0;r<6;r+=1){const l=new p(new T(2+r*.72,.013,5,160),new g({color:r%2===0?"#818cff":"#ca95ff",transparent:!0,opacity:.42-r*.04}));l.rotation.x=Math.PI/2,l.userData.baseScale=1+r*.12,i.push(l),e.add(l)}return{binaries:a,starOne:n,starTwo:o,waves:i}}function rt(e){const a=new p(new T(1.35,.009,5,120),new g({color:"#99aeff",transparent:!0,opacity:.27}));a.rotation.x=Math.PI/2,a.position.x=-2.15,a.position.y=1.3,e.add(a);const t=B(.56,"#315ca9",{surface:"earth",selectable:!0});t.position.x=-2.15,t.position.y=1.3;const n=ne(.56);n.rotation.z=-.16,t.add(n),t.add(F(.62,"#6da8ff",.5)),e.add(t);const o=new C;o.position.y=1.3,e.add(o);const s=Ze(),i=s.ship;o.add(i);const r=new p(new T(.4,.009,6,80),new g({color:"#a5c8ff",transparent:!0,opacity:.42}));r.rotation.x=Math.PI/2,i.add(r);const l=ee([new O(-4.8,1.3,0),new O(-3.2,1.45,0),new O(-1.7,1.6,0),new O(0,1.5,0),new O(1.7,1.35,0),new O(3.3,1.22,0),new O(4.8,1.3,0)],"#929fff",.28);e.add(l);const d=new C;e.add(d);const u=new p(new We(.68,48),new g({color:"#121a31",transparent:!0,opacity:.88,side:X}));d.add(u);const f=new p(new T(.7,.012,6,72),new g({color:"#8498eb",transparent:!0,opacity:.55}));d.add(f);const v=ee([new O(0,0,.02),new O(.36,.15,.02)],"#e5c6ff",.9);return d.add(v),d.position.set(1.9,1.45,0),{traveller:o,ship:i,shipCore:s.windowBand,engineGlow:s.engineGlow,earth:t,hand:v,clockGroup:d}}function it(e){const a=B(1.55,"#23539a",{surface:"earth",selectable:!0});e.add(a);const t=ne(1.55);a.add(t);const n=F(1.78,"#55a5ff",.62);e.add(n);const s=[{radius:3.3,color:"#8095e5",rotation:[.35,.2,.15],speed:.2},{radius:4.05,color:"#9f81ef",rotation:[1.04,-.23,.26],speed:-.145},{radius:4.7,color:"#748cdf",rotation:[.7,.7,-.25],speed:.11}].map((i,r)=>{const l=new C;l.rotation.set(...i.rotation);const d=new p(new T(i.radius,.007,5,180),new g({color:i.color,transparent:!0,opacity:.32}));d.rotation.x=Math.PI/2,l.add(d);const u=new C;u.position.x=i.radius,l.add(u);const f=Qe(r===1?.48:.42);return f.rotation.y+=r*.8,u.add(f),e.add(l),{orbitalGroup:l,satellite:u,model:f,speed:i.speed}});return{earth:a,clouds:t,atmosphere:n,satellites:s}}function st(){try{x=new Ee({canvas:c.canvas,antialias:!0,alpha:!1,powerPreference:"high-performance"}),x.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8)),x.setSize(window.innerWidth,window.innerHeight),x.outputColorSpace=Te,x.toneMapping=Re,x.toneMappingExposure=1.25,x.shadowMap.enabled=!0,x.shadowMap.type=ze,L=!0}catch(i){console.warn("WebGL could not be initialized; continuing with the visual fallback.",i),document.body.classList.add("webgl-unavailable"),c.fallbackMessage.hidden=!1,c.canvas.setAttribute("aria-hidden","true");return}S=new De,S.background=new ve("#05070c"),S.fog=new Le("#05070c",.006),P=new Ie(40,window.innerWidth/window.innerHeight,.1,150),y.x=h[0].camera[0],y.y=h[0].camera[1],y.z=h[0].camera[2],P.position.set(y.x,y.y,y.z),W=new Ke,W.params.Points.threshold=.18,S.add(new Ne("#8eacff","#080b14",1.12));const e=new qe("#b3c4ff",2.1);e.position.set(-4,6,7),e.castShadow=!0,e.shadow.mapSize.set(1024,1024),e.shadow.camera.left=-10,e.shadow.camera.right=10,e.shadow.camera.top=10,e.shadow.camera.bottom=-10,e.shadow.bias=-3e-4,S.add(e);const a=new de("#8459ff",5.2,24);a.position.set(4,1,-3),S.add(a);const t=new de("#ffad78",3.1,20);t.position.set(-5,2,3),S.add(t);const n=et();[tt,at,ot,nt,rt,it].forEach((i,r)=>{const l=new C;l.visible=r===0,l.userData.homeScale=1,l.userData.chapterId=h[r].id,S.add(l);const d=i(l);l.traverse(u=>{u.isMesh&&(u.castShadow=u.geometry.type==="SphereGeometry",u.receiveShadow=u.geometry.type==="SphereGeometry")}),b.push({group:l,visual:d})}),S.userData.stars=n,ge(),E=new Ve(x),E.setPixelRatio(Math.min(window.devicePixelRatio||1,1,1200/window.innerWidth)),E.addPass(new Ge(S,P)),E.addPass(new He(new $(window.innerWidth,window.innerHeight),.18,.3,1.5)),E.addPass(new Ue);const s=()=>{if(requestAnimationFrame(s),R)return;const i=U.getElapsedTime();A.x+=(_.x-A.x)*.018,A.y+=(_.y-A.y)*.018,P.position.set(y.x+A.x*.5,y.y+A.y*.28,y.z),P.lookAt(A.x*.16,A.y*.12,0),n.rotation.y=i*.002;const r=b[m]?.visual;if(m===1&&r.satellitePivot&&(r.satellitePivot.rotation.z+=.003),m===0&&r.clouds&&(r.clouds.rotation.y+=8e-4),m===1){const l=r.sun.material.userData.surfaceShader;l?.uniforms.uSurfaceTime&&(l.uniforms.uSurfaceTime.value=i),r.planet.rotation.y+=.002}m===2&&(r.material.uniforms.uTime.value=i,r.material.uniforms.uView.value.copy(A)),m===3&&(r.binaries.rotation.y+=.007*(.4+M/100),r.starTwo.position.x=Math.cos(i*.82)*.95,r.starTwo.position.z=Math.sin(i*.82)*.42,r.starOne.position.x=-Math.cos(i*.82)*.5,r.starOne.position.z=-Math.sin(i*.82)*.22,r.waves.forEach((l,d)=>{l.scale.setScalar(l.userData.baseScale*(j.wave+Math.sin(i*1.1-d*.65)*.045)),l.material.opacity=Math.max(.04,.38-d*.045-(l.scale.x-1)*.04)})),m===4&&(r.traveller.position.x=Math.sin(i*(.12+M/280))*4.2,r.ship.rotation.y+=.006,r.earth.rotation.y+=.0011,r.engineGlow.material.opacity=.3+Math.sin(i*5.2)*.08+M/500,r.hand.rotation.z=-i*.08),m===5&&(r.earth.rotation.y+=.0012,r.clouds.rotation.y+=.0016,r.satellites.forEach(({orbitalGroup:l,model:d,speed:u},f)=>{l.rotation.y+=u*.005*(.7+M/100),l.rotation.z+=(f+1)*1e-4,d.rotation.z+=.0012*(f%2===0?1:-1)})),m===2?E.render():x.render(S,P)};s()}function ct(){h.forEach((e,a)=>{const t=document.createElement("button");t.type="button",t.className="chapter-link",t.dataset.chapter=String(a),t.setAttribute("aria-label",`Capítulo ${a+1}: ${e.kicker}`),t.setAttribute("aria-current",a===m?"step":"false"),t.innerHTML=`<span class="chapter-marker" aria-hidden="true"></span><span class="chapter-index">${String(a+1).padStart(2,"0")}</span><span class="chapter-name">${e.kicker.replace("PARADOXO DOS GÊMEOS","Gêmeos").replace("ONDAS GRAVITACIONAIS","Ondas gravitacionais").replace("REGIÃO DE COLAPSO","Buracos negros").replace("RELATIVIDADE EM ÓRBITA","GPS relativístico").replace("FUNDAMENTOS","Espaço-tempo").replace("CURVATURA","Gravidade")}</span>`,t.addEventListener("click",()=>ce(a)),c.navigation.append(t)})}function pe(e,a){return a==="% c"?`${Math.round(e)}% c`:`${Math.round(e)}${a}`}function ye(e,a){if(c.controls.replaceChildren(),e.id==="blackhole"){const u=document.createElement("div");u.className="option-stack",[{id:"horizon",label:"Horizonte de eventos"},{id:"curvature",label:"Curvatura do espaço-tempo"}].forEach(f=>{const v=document.createElement("button");v.type="button",v.className="option-button",v.textContent=f.label,v.setAttribute("aria-pressed",String(z===f.id)),v.addEventListener("click",()=>be(f.id)),u.append(v)}),c.controls.append(u);return}const t=e.interaction,n=document.createElement("div");n.className="control-block";const o=document.createElement("div");o.className="control-heading";const s=document.createElement("label");s.className="control-label",s.htmlFor="chapter-range",s.textContent=t.label;const i=document.createElement("output");i.className="control-reading",i.htmlFor="chapter-range",i.textContent=pe(M,t.unit);const r=document.createElement("input");r.className="range-input",r.id="chapter-range",r.type="range",r.min=String(t.min),r.max=String(t.max),r.value=String(M),r.setAttribute("aria-label",t.label);const l=()=>{const u=(Number(r.value)-t.min)/(t.max-t.min)*100;r.style.setProperty("--range-fill",`${u}%`)};r.addEventListener("input",()=>{M=Number(r.value),i.textContent=pe(M,t.unit),l(),lt(a)}),l(),o.append(s,i),n.append(o,r);const d=document.createElement("div");d.className="control-scale",d.innerHTML=`<span>${t.min}${t.unit}</span><span>${t.max}${t.unit}</span>`,n.append(d),c.controls.append(n)}function lt(e){if(!L)return;const a=b[e].visual,t=M/100;e===0?(j.curvature=t,a.grid.scale.y=.3+t*1.8,a.centerGlow.material.opacity=.04+t*.12):e===1?(a.grid.scale.y=.45+t*1.55,a.sun.scale.setScalar(.8+t*.42),a.aura.material.opacity=.035+t*.1):e===3?j.wave=.76+t*.72:e===4?(a.shipCore.material.emissiveIntensity=.25+t*1.15,a.traveller.position.x=(t-.5)*8):e===5&&(a.atmosphere.material.opacity=.045+t*.1)}function be(e){if(z===e)return;z=e;const a=e==="curvature";if(L){const t=b[2].visual;w.killTweensOf(t.curvatureMaterials),a&&(t.curvature.visible=!0),w.to(t.curvatureMaterials,{opacity:(n,o)=>a?o.userData.baseOpacity:0,duration:.7,onComplete:()=>{!a&&z==="horizon"&&(t.curvature.visible=!1)}}),w.to(t.material.uniforms.uDiskOpacity,{value:a?.25:1,duration:.65})}J(e)}function J(e){const a=e==="curvature";c.coordinateLabel.textContent=a?"GEOMETRIA ILUSTRADA":"HORIZONTE DE EVENTOS",c.coordinateValue.textContent=a?"MALHA · MODELO VISUAL":"NENHUM SINAL ESCAPA",c.description.textContent=a?"A malha representa como uma grande concentração de massa curva o espaço-tempo ao redor. É uma analogia visual, não uma simulação física.":"O horizonte de eventos é a fronteira de não retorno: dentro dela, todos os caminhos possíveis apontam para o interior.",c.controls.querySelectorAll(".option-button").forEach((n,o)=>n.setAttribute("aria-pressed",String(o===1===a)))}function ie(){if(!L)return;const e=b[2].visual;w.killTweensOf([...e.curvatureMaterials,e.material.uniforms.uDiskOpacity]),e.curvature.visible=!1,e.curvatureMaterials.forEach(a=>{a.opacity=0}),e.material.uniforms.uDiskOpacity.value=1,z="horizon"}function ut(e,a){w.killTweensOf([c.kicker,c.title,c.description,c.fact]);const t=[c.kicker,c.title,c.description,c.fact];w.to(t,{opacity:0,y:12,duration:Z?.01:.2,stagger:.025,overwrite:!0,onComplete:()=>{c.kicker.innerHTML=`<span>${String(a+1).padStart(2,"0")}</span><span class="kicker-line"></span><span>${e.kicker}</span>`,c.title.innerHTML=e.title,c.description.textContent=e.description,c.fact.textContent=e.fact,c.notes.innerHTML=`<p>${e.notes}</p><p><strong>Interação:</strong> ${e.id==="blackhole"?"Alterne entre horizonte de eventos e curvatura do espaço-tempo.":`${e.interaction.label.toLowerCase()} com o controle da cena.`}</p>`,e.id==="blackhole"&&m===a&&J(z),w.fromTo(t,{opacity:0,y:13},{opacity:1,y:0,duration:Z?.01:.72,stagger:.085,ease:"power2.out",clearProps:"transform"})}})}function se(e,{animate:a=!0}={}){const t=h[e];document.querySelectorAll(".chapter-link").forEach((n,o)=>{n.setAttribute("aria-current",o===e?"step":"false")}),c.panelIndex.textContent=`${String(e+1).padStart(2,"0")} / 06`,c.coordinateLabel.textContent=t.coordinate[0],c.coordinateValue.textContent=t.coordinate[1],document.querySelector("#scene-coordinate").textContent=`SETOR 0${e+1} · 00′`,document.querySelector("#scene-status").textContent=R?"OBSERVAÇÃO PAUSADA":"OBSERVAÇÃO EM CURSO",ye(t,e),a?ut(t,e):(c.kicker.innerHTML=`<span>${String(e+1).padStart(2,"0")}</span><span class="kicker-line"></span><span>${t.kicker}</span>`,c.title.innerHTML=t.title,c.description.textContent=t.description,c.fact.textContent=t.fact,w.set([c.kicker,c.title,c.description,c.fact],{opacity:1,y:0,clearProps:"transform"})),t.id==="blackhole"&&J(z)}function dt(e,a,t=.7){if(!L)return;k?.kill(),w.killTweensOf(y),b.forEach(({group:s},i)=>{w.killTweensOf([s.scale,s.rotation]),s.visible=i===a,s.scale.setScalar(1),s.rotation.set(0,0,0)}),(e===2||a===2)&&ie();const n=b[a].group,o=h[a].camera;n.scale.setScalar(.96),k=w.timeline({defaults:{ease:"power2.out"}}),k.to(n.scale,{x:1,y:1,z:1,duration:t},0),k.to(y,{x:o[0],y:o[1],z:o[2],duration:t},0)}function ce(e,a={}){if(e<0||e>=h.length||e===m)return;const t=m;m=e,M=h[e].interaction?.value??50,e===2&&ie(),R&&(k?.resume(),U.start()),R=!1,c.pauseLabel.textContent="PAUSAR",c.pause.setAttribute("aria-label","Pausar animação"),document.querySelector(".play-glyph").textContent="Ⅱ",se(e),dt(t,e,a.immediate||Z?.01:.7)}function le(){R=!1,k?.kill(),k=null,_.set(0,0),A.set(0,0),M=h[m].interaction?.value??50,z="horizon",w.killTweensOf(y);const e=h[m].camera;if(Object.assign(y,{x:e[0],y:e[1],z:e[2]}),U.start(),L){if(b.forEach(({group:a},t)=>{a.visible=t===m,a.scale.setScalar(1),a.rotation.set(0,0,0)}),m===2&&ie(),m===3&&(j.wave=1),m===0){const a=b[0].visual;a.grid.scale.y=1,a.centerGlow.material.opacity=.06}if(m===1){const a=b[1].visual;a.grid.scale.y=1,a.sun.scale.setScalar(1),a.aura.material.opacity=.075}}document.querySelector(".play-glyph").textContent="Ⅱ",c.pauseLabel.textContent="PAUSAR",c.pause.setAttribute("aria-label","Pausar animação"),se(m),m===2&&(ye(h[m],m),J("horizon"))}function Se(){R=!R,R?(k?.pause(),U.stop(),c.pauseLabel.textContent="RETOMAR",c.pause.setAttribute("aria-label","Retomar animação"),document.querySelector(".play-glyph").textContent="▶",document.querySelector("#scene-status").textContent="OBSERVAÇÃO PAUSADA"):(k?.resume(),U.start(),c.pauseLabel.textContent="PAUSAR",c.pause.setAttribute("aria-label","Pausar animação"),document.querySelector(".play-glyph").textContent="Ⅱ",document.querySelector("#scene-status").textContent="OBSERVAÇÃO EM CURSO")}function K(e){const a=e??c.notesPanel.hidden;c.notesPanel.hidden=!a,c.notesToggle.setAttribute("aria-expanded",String(a)),a?c.notesPanel.querySelector(".notes-close").focus():c.notesToggle.focus()}function mt(e){_.set((e.clientX/window.innerWidth-.5)*2,-(e.clientY/window.innerHeight-.5)*2)}function pt(e){if(!L)return;const a=c.canvas.getBoundingClientRect();A.set((e.clientX-a.left)/a.width*2-1,-((e.clientY-a.top)/a.height)*2+1),W.setFromCamera(A,P);const t=[];b[m].group.traverse(o=>{o.userData.selectable&&t.push(o)});const n=W.intersectObjects(t,!0)[0];if(n)if(m===2){const o=n.uv&&n.uv.distanceTo(new $(.5,.5))<.13;be(o?"horizon":"curvature")}else{const o=b[m].visual;m===1&&o.satellitePivot?w.to(o.satellitePivot.rotation,{z:o.satellitePivot.rotation.z+Math.PI*.65,duration:1.1,ease:"power2.inOut"}):m===3?w.to(o.binaries.rotation,{y:o.binaries.rotation.y+Math.PI*.4,duration:1.1,ease:"power2.inOut"}):w.to(n.object.rotation,{y:n.object.rotation.y+Math.PI*.7,duration:1.1,ease:"power2.inOut"})}}function ft(e){if(e.altKey||e.ctrlKey||e.metaKey)return;const a=e.target;if(!(a instanceof HTMLElement&&(a.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(a.tagName))))if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const n=e.key==="ArrowRight"?1:-1;ce((m+n+h.length)%h.length)}else e.key.toLowerCase()==="r"?le():e.code==="Space"?(e.preventDefault(),Se()):e.key.toLowerCase()==="n"?K():e.key==="Escape"&&!c.notesPanel.hidden&&K(!1)}ct();st();se(m,{animate:!1});c.notes.innerHTML=`<p>${h[m].notes}</p><p><strong>Interação:</strong> ${h[m].interaction.label.toLowerCase()} com o controle da cena.</p>`;c.pause.addEventListener("click",Se);c.reset.addEventListener("click",le);c.notesToggle.addEventListener("click",()=>K());c.notesPanel.querySelector(".notes-close").addEventListener("click",()=>K(!1));document.querySelector("#brand-home").addEventListener("click",e=>{e.preventDefault(),m===0?le():ce(0)});window.addEventListener("pointermove",mt,{passive:!0});c.canvas.addEventListener("click",pt);window.addEventListener("keydown",ft);window.addEventListener("resize",()=>{L&&(ge(),P.aspect=window.innerWidth/window.innerHeight,P.updateProjectionMatrix(),x.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8)),x.setSize(window.innerWidth,window.innerHeight),E.setPixelRatio(Math.min(window.devicePixelRatio||1,1,1200/window.innerWidth)),E.setSize(window.innerWidth,window.innerHeight))});
