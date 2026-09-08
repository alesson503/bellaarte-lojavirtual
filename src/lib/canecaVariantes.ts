// Mapa nome-do-produto → variante 3D, separado de CanecaViewer3D.tsx de
// propósito: esse arquivo NÃO importa 'three' (é uma lib pesada), então dá
// pra usar esse mapa em qualquer lugar (tipo Produto.tsx, só pra decidir SE
// mostra o visualizador 3D) sem forçar o carregamento do Three.js em toda
// página de produto — só quando o componente 3D é de fato carregado
// (lazy/code-split) é que o bundle pesado entra.
export type CanecaVarianteKey =
  | 'branca' | '180ml' | 'colher' | 'alcaCoracao'
  | 'imperial' | 'magicaColher' | 'magicaCoracao' | 'bambu';

export const CANECA_VARIANTE_POR_NOME: Record<string, CanecaVarianteKey> = {
  'Caneca Branca': 'branca',
  'Caneca 180ML': '180ml',
  'Caneca 180ml': '180ml',
  'Caneca Alça Colorida/colher': 'colher',
  'Caneca Alça Coração': 'alcaCoracao',
  'Caneca Imperial': 'imperial',
  'Caneca Mágica C/Colher': 'magicaColher',
  'Caneca Mágica Corpo Coração': 'magicaCoracao',
  'Caneca Tampa e Alça bambu': 'bambu',
};
