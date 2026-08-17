export default function AdminProducts() {
  return (
    <div className="adm-panel">
      <h2>Produtos</h2>
      <p className="sub">Catálogo exibido na loja.</p>
      <div className="adm-placeholder">
        Por enquanto os produtos vêm fixos de <b>src/data.ts</b>, dentro do próprio projeto.<br />
        Quando você integrar com o seu sistema, essa tela passa a listar (e editar) os produtos puxados
        de lá direto — sem precisar editar código pra cada mudança de preço ou item novo.
      </div>
    </div>
  );
}
