import { useEffect, useState } from 'react';
import { listErpProducts, type ErpProduto } from '../services/productsService';
import { fmt } from '../data';

export default function AdminProducts() {
  const [produtos, setProdutos] = useState<ErpProduto[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listErpProducts().then(setProdutos).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar produtos.'));
  }, []);

  return (
    <div className="adm-panel">
      <h2>Produtos</h2>
      <p className="sub">
        Prévia dos produtos vindos do seu ERP (só leitura, por enquanto). A vitrine que o cliente vê na loja
        ainda usa o catálogo fixo do projeto — essa tela é só pra você conferir que a ligação com o ERP está trazendo os dados certos.
      </p>
      {erro ? (
        <div className="adm-empty">{erro}</div>
      ) : !produtos ? (
        <div className="adm-empty">Carregando…</div>
      ) : produtos.length === 0 ? (
        <div className="adm-empty">Nenhum produto ativo encontrado no ERP.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Unidade</th></tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id}>
                <td><b>{p.nome}</b></td>
                <td>{p.categoria}</td>
                <td>{fmt(p.preco)}</td>
                <td>{p.unidade_venda === 'm2' ? 'por m²' : 'por unidade'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
