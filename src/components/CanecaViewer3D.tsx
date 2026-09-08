import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type CanecaVarianteKey } from '../lib/canecaVariantes';

// Formas 3D genéricas (cilindro/coração feitos na hora, sem depender de
// nenhum arquivo externo) — pensadas pra virar um modelo .glb de verdade
// no futuro: é só trocar a criação da geometria em `construirCaneca` por
// um GLTFLoader carregando o arquivo, mantendo o resto (textura da foto,
// controles de arrastar/zoom, efeito mágico) igual.
// O tipo `CanecaVarianteKey` e o mapa nome→variante moram em
// lib/canecaVariantes.ts (sem depender de 'three') pra Produto.tsx poder
// decidir SE mostra esse componente sem precisar baixar o Three.js inteiro
// — só quando esse arquivo é de fato importado (lazy) é que o bundle
// pesado entra.
export type { CanecaVarianteKey };

interface VarianteConfig {
  bodyShape: 'cilindro' | 'coracao';
  rTop: number; rBot: number; h: number;
  handleShape: 'argola' | 'coracao';
  corAlcaPropria: boolean;
  handleColorFixa?: string;
  colher: boolean;
  tampa: boolean;
}

const PROD_CONFIG: Record<CanecaVarianteKey, VarianteConfig> = {
  branca:        { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'argola', corAlcaPropria: false, colher: false, tampa: false },
  '180ml':       { bodyShape: 'cilindro', rTop: 0.88, rBot: 0.88, h: 1.7, handleShape: 'argola', corAlcaPropria: false, colher: false, tampa: false },
  colher:        { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'argola', corAlcaPropria: true, colher: true, tampa: false },
  // Alça Coração e Mágica Corpo Coração: corpo normal (cilíndrico) — só a
  // alça é em formato de coração, igual a caneca de referência que o dono
  // mandou. "Corpo Coração" no nome é só o material que muda de cor com o
  // calor (efeito mágico), não o formato do corpo.
  alcaCoracao:   { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'coracao', corAlcaPropria: false, colher: false, tampa: false },
  imperial:      { bodyShape: 'cilindro', rTop: 1.08, rBot: 0.92, h: 2.15, handleShape: 'argola', corAlcaPropria: false, colher: false, tampa: false },
  magicaColher:  { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'argola', corAlcaPropria: false, colher: true, tampa: false },
  magicaCoracao: { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'coracao', corAlcaPropria: false, colher: false, tampa: false },
  bambu:         { bodyShape: 'cilindro', rTop: 1, rBot: 1, h: 1.85, handleShape: 'argola', corAlcaPropria: false, handleColorFixa: '#8a6a3a', colher: false, tampa: true },
};

function pontosCoracao(escala: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push(new THREE.Vector2((x / 16) * escala, (y / 16) * escala));
  }
  return pts;
}

export default function CanecaViewer3D({
  variante,
  corAlca = '#DD6F98',
  fotoDataUrl,
  mostrarEfeito = false,
}: {
  variante: CanecaVarianteKey;
  corAlca?: string;
  fotoDataUrl: string | null;
  mostrarEfeito?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const efeitoBtnRef = useRef<HTMLButtonElement>(null);

  // Refs pra tudo que precisa sobreviver entre renders sem re-criar a cena
  // inteira (a cena 3D é montada uma vez só, no primeiro useEffect).
  const apiRef = useRef<{
    aplicarProduto: (variante: CanecaVarianteKey) => void;
    setCorAlca: (cor: string) => void;
    setFoto: (img: HTMLImageElement | null) => void;
    tocarEfeito: () => void;
  } | null>(null);

  // ── monta a cena 3D uma única vez ──
  useEffect(() => {
    const canvas = canvasRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(3, 5, 4);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-4, 2, -3);
    scene.add(dir2);

    const TW = 1024, TH = 512;
    const texCanvas = document.createElement('canvas');
    texCanvas.width = TW; texCanvas.height = TH;
    const tctx = texCanvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.offset.x = 0.75;

    const corBase = '#ffffff';
    let corAlcaAtual = corAlca;
    let produtoAtual: CanecaVarianteKey = variante;
    let fotoImg: HTMLImageElement | null = null;
    let efeitoProgresso = 0;
    let efeitoAnimando: number | null = null;

    const PRINT_X0 = TW * 0.05, PRINT_X1 = TW * 0.95;

    function desenharTextura() {
      tctx.fillStyle = corBase;
      tctx.fillRect(0, 0, TW, TH);
      if (fotoImg) {
        const areaW = PRINT_X1 - PRINT_X0, areaH = TH * 0.90;
        const areaY = (TH - areaH) / 2;
        const scale = Math.max(areaW / fotoImg.width, areaH / fotoImg.height);
        const iw = fotoImg.width * scale, ih = fotoImg.height * scale;
        const ix = PRINT_X0 + (areaW - iw) / 2, iy = areaY + (areaH - ih) / 2;
        tctx.save();
        tctx.beginPath();
        tctx.rect(PRINT_X0, areaY, areaW, areaH);
        tctx.clip();
        tctx.drawImage(fotoImg, ix, iy, iw, ih);
        tctx.restore();

        if (efeitoProgresso < 1) {
          const alturaVeu = areaH * (1 - efeitoProgresso);
          const fadeH = Math.min(alturaVeu, areaH * 0.18);
          const solidoH = alturaVeu - fadeH;
          if (solidoH > 0) {
            tctx.fillStyle = '#0a0a0a';
            tctx.fillRect(PRINT_X0, areaY, areaW, solidoH);
          }
          if (fadeH > 0) {
            const grad = tctx.createLinearGradient(0, areaY + solidoH, 0, areaY + alturaVeu);
            grad.addColorStop(0, 'rgba(10,10,10,1)');
            grad.addColorStop(1, 'rgba(10,10,10,0)');
            tctx.fillStyle = grad;
            tctx.fillRect(PRINT_X0, areaY + solidoH, areaW, fadeH);
          }
        }
      }
      texture.needsUpdate = true;
    }

    const materiais = {
      body: new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45, metalness: 0.05 }),
      inner: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6 }),
      handle: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 }),
    };

    const mugGroup = new THREE.Group();
    scene.add(mugGroup);
    let body: THREE.Mesh | null = null;
    let inner: THREE.Mesh | null = null;
    let handle: THREE.Mesh | null = null;
    let colherGroup: THREE.Group | null = null;
    let tampaGroup: THREE.Group | null = null;

    function limparGrupo() {
      ([body, inner, handle, colherGroup, tampaGroup] as (THREE.Object3D | null)[]).forEach(obj => {
        if (!obj) return;
        mugGroup.remove(obj);
        obj.traverse(o => {
          const mesh = o as THREE.Mesh;
          mesh.geometry?.dispose?.();
        });
      });
      body = inner = handle = colherGroup = tampaGroup = null;
    }

    function criarColher() {
      const g = new THREE.Group();
      const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 16), materiais.handle);
      cabo.position.y = 0.5;
      const concha = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), materiais.handle);
      concha.scale.set(1, 0.55, 1.5);
      concha.position.y = -0.32;
      g.add(cabo, concha);
      g.position.set(1.15, 0.35, 0.15);
      g.rotation.z = -0.28;
      return g;
    }

    function criarTampa(raio: number) {
      const g = new THREE.Group();
      const matTampa = new THREE.MeshStandardMaterial({ color: 0xC08A4E, roughness: 0.7 });
      const tampa = new THREE.Mesh(new THREE.CylinderGeometry(raio * 1.06, raio * 1.06, 0.12, 48), matTampa);
      tampa.position.y = 0.925 + 0.06;
      const puxador = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), matTampa);
      puxador.position.y = 0.925 + 0.17;
      g.add(tampa, puxador);
      return g;
    }

    function atualizarCorAlca() {
      const cfg = PROD_CONFIG[produtoAtual];
      materiais.handle.color.set(cfg.handleColorFixa || (cfg.corAlcaPropria ? corAlcaAtual : corBase));
    }

    function construirCaneca(cfg: VarianteConfig) {
      limparGrupo();

      {
        const geo = new THREE.CylinderGeometry(cfg.rTop, cfg.rBot, cfg.h, 64, 1, false);
        body = new THREE.Mesh(geo, materiais.body);
        const raioMedio = (cfg.rTop + cfg.rBot) / 2;
        inner = new THREE.Mesh(new THREE.CircleGeometry(raioMedio * 0.92, 48), materiais.inner);
        inner.rotation.x = -Math.PI / 2;
        inner.position.y = (cfg.h / 2) * 0.995;
      }

      if (cfg.handleShape === 'coracao') {
        // Pontos do coração já gerados direto no plano Y-Z (não XY): assim
        // a alça fica de pé, virada de lado (encostando no corpo em +X),
        // com a ponta pra baixo — sem precisar girar a malha depois e
        // arriscar deixar ela deitada/torta.
        const pts2d = pontosCoracao(0.62);
        const pts3d = pts2d.map(p => new THREE.Vector3(0, p.y, p.x));
        const curva = new THREE.CatmullRomCurve3(pts3d, true);
        handle = new THREE.Mesh(new THREE.TubeGeometry(curva, 90, 0.14, 14, true), materiais.handle);
        handle.position.set((cfg.rTop + cfg.rBot) / 2 + 0.1, 0, 0);
      } else {
        handle = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.11, 16, 48, Math.PI * 1.35), materiais.handle);
        handle.rotation.z = Math.PI / 2 + 0.18;
        handle.rotation.y = Math.PI;
        handle.position.set((cfg.rTop + cfg.rBot) / 2 + 0.02, 0, 0);
      }

      mugGroup.add(body, inner, handle);

      colherGroup = criarColher();
      colherGroup.visible = cfg.colher;
      mugGroup.add(colherGroup);

      if (cfg.tampa) {
        tampaGroup = criarTampa((cfg.rTop + cfg.rBot) / 2);
        mugGroup.add(tampaGroup);
      }

      atualizarCorAlca();
    }

    function aplicarProduto(v: CanecaVarianteKey) {
      produtoAtual = v;
      const cfg = PROD_CONFIG[v];
      construirCaneca(cfg);
      camera.position.setLength(cfg.tampa || cfg.handleShape === 'coracao' ? 4.7 : 4.2);
    }

    camera.position.set(0, 0.3, 4.2);
    camera.lookAt(0, 0, 0);

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    let dragging = false, lastX = 0, lastY = 0;
    let rotY = 0.5, rotX = 0;
    function onPointerDown(e: PointerEvent) { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); }
    function onPointerUp() { dragging = false; }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.008;
      rotX = Math.max(-0.5, Math.min(0.5, rotX + (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
    }
    function zoom(d: number) {
      const dist = camera.position.length();
      const nd = Math.max(2.6, Math.min(7, dist + d * 0.35));
      camera.position.setLength(nd);
    }
    function onWheel(e: WheelEvent) { e.preventDefault(); zoom(e.deltaY > 0 ? 1 : -1); }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', resize);

    function tocarEfeito() {
      if (!fotoImg || efeitoAnimando) return;
      const de = efeitoProgresso > 0.5 ? -1 : 1;
      const btn = efeitoBtnRef.current;
      if (btn) btn.textContent = de > 0 ? '… revelando' : '… escondendo';
      const t0 = performance.now();
      const de0 = efeitoProgresso;
      function passo(t: number) {
        const p = Math.min(1, (t - t0) / 1200);
        efeitoProgresso = de > 0 ? de0 + p * (1 - de0) : de0 - p * de0;
        desenharTextura();
        if (p < 1) {
          efeitoAnimando = requestAnimationFrame(passo);
        } else {
          efeitoAnimando = null;
          if (btn) btn.textContent = efeitoProgresso > 0.5 ? '◀ Esconder' : '▶ Revelar';
        }
      }
      efeitoAnimando = requestAnimationFrame(passo);
    }

    apiRef.current = {
      aplicarProduto,
      setCorAlca: cor => { corAlcaAtual = cor; atualizarCorAlca(); },
      setFoto: img => { fotoImg = img; efeitoProgresso = 1; desenharTextura(); },
      tocarEfeito,
    };

    aplicarProduto(variante);
    desenharTextura();

    let vivo = true;
    function loop() {
      if (!vivo) return;
      mugGroup.rotation.y = rotY;
      mugGroup.rotation.x = rotX;
      resize();
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    loop();

    return () => {
      vivo = false;
      if (efeitoAnimando) cancelAnimationFrame(efeitoAnimando);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      limparGrupo();
      renderer.dispose();
      texture.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // troca de variante (produto) sem remontar a cena inteira
  useEffect(() => { apiRef.current?.aplicarProduto(variante); }, [variante]);
  useEffect(() => { apiRef.current?.setCorAlca(corAlca); }, [corAlca]);

  // carrega a foto (data URL) como Image() sempre que ela mudar
  useEffect(() => {
    if (!fotoDataUrl) { apiRef.current?.setFoto(null); return; }
    const img = new Image();
    img.onload = () => apiRef.current?.setFoto(img);
    img.src = fotoDataUrl;
  }, [fotoDataUrl]);

  return (
    <div ref={containerRef} className="caneca3d-box">
      <canvas ref={canvasRef} className="caneca3d-canvas" />
      <div className="caneca3d-hint">🖱️ arraste pra girar · role pra dar zoom</div>
      {mostrarEfeito && fotoDataUrl && (
        <button ref={efeitoBtnRef} type="button" className="caneca3d-efeito-btn" onClick={() => apiRef.current?.tocarEfeito()}>
          ▶ Revelar
        </button>
      )}
    </div>
  );
}
