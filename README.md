# COSMOS — Observatório da Relatividade

Experiência interativa de creative coding para explorar conceitos da relatividade geral.

## Executar

```sh
npm install
npm run dev
```

O build de produção pode ser gerado com `npm run build` e servido localmente com `npm run preview`.

## Controles

- Selecione um capítulo pela navegação lateral ou use `←` e `→`.
- Arraste o ponteiro para influenciar suavemente a câmera.
- Ajuste o instrumento de cada capítulo; no buraco negro, alterne entre o horizonte de eventos e a curvatura.
- Use `Espaço` para pausar/retomar, `R` para reiniciar e `N` para abrir/fechar as notas privadas do apresentador.
- No celular, navegue por toque; as notas ficam ocultas até serem solicitadas.

As cenas são modelos visuais didáticos, não simulações físicas. Se o navegador não oferecer WebGL, a navegação e o conteúdo continuam disponíveis com um fundo alternativo.

## Shader do buraco negro

A cena usa um único shader em [src/black-hole.js](src/black-hole.js). Cada pixel integra uma trajetória de luz curva e acumula a emissão nas interseções com o disco: a faixa frontal e as imagens acima e abaixo da sombra vêm do mesmo disco. A textura procedural usa ruído com rotação diferencial, com brilho difuso aplicado apenas enquanto esse capítulo está visível.

O modelo aproxima um buraco negro sem rotação, com integração limitada a 180 passos. Temperatura, opacidade e borda interna foram ajustadas artisticamente à referência visual; não é uma simulação científica calibrada. O efeito renderiza em até 1200 pixels de largura e tem enquadramento próprio para celular.

Referência conceitual sobre traçado de luz em torno de buracos negros: [Eric Bruneton — A Real-time High-quality Black Hole Shader](https://ebruneton.github.io/black_hole_shader/). Esta implementação usa integração direta, não as tabelas pré-calculadas desse trabalho.
