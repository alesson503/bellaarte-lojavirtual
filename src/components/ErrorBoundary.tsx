import { Component, type ReactNode } from 'react';
import { reportarErro } from '../services/errosService';

// Rede de segurança: se algum erro escapar de qualquer tela (produto com
// dado inesperado, falha de rede no meio de um clique etc.), sem isso o
// React desmonta o site inteiro e fica tudo branco, sem nenhuma mensagem —
// exatamente o "some tudo" que o dono relatou. Com isso, aparece uma tela
// de desculpa com botão pra voltar, em vez do branco.
//
// Sem um serviço de log ligado, o único jeito de eu ver o erro de verdade
// é o dono copiar e me mandar — por isso o botão "Copiar detalhes técnicos"
// (junta mensagem do erro + página + hora num texto só, pronto pra colar).
interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
  pilha: string;
  copiado: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null, pilha: '', copiado: false };

  static getDerivedStateFromError(erro: Error): Partial<State> {
    return { erro };
  }

  componentDidCatch(erro: Error, info: { componentStack: string }) {
    // Fica só no console — sem um serviço de log configurado, é o que dá
    // pra fazer hoje sem mexer no back-end.
    console.error('Erro não tratado na loja:', erro, info.componentStack);
    this.setState({ pilha: info.componentStack });
    reportarErro(erro.message + (erro.stack ? `\n${erro.stack}` : ''), info.componentStack, window.location.href);
  }

  copiarDetalhes = () => {
    const { erro, pilha } = this.state;
    const texto = [
      `Página: ${window.location.href}`,
      `Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Erro: ${erro?.message}`,
      erro?.stack ? `\n${erro.stack}` : '',
      pilha ? `\nComponentes:${pilha}` : '',
    ].join('\n');
    navigator.clipboard?.writeText(texto).then(
      () => this.setState({ copiado: true }),
      () => {},
    );
  };

  render() {
    if (this.state.erro) {
      const { copiado } = this.state;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
          <span className="text-5xl">😥</span>
          <h1 className="font-display text-2xl font-extrabold text-ink">Ops, algo deu errado</h1>
          <p className="max-w-sm text-sm text-ink-muted">
            Essa página travou por um instante. Isso não afeta seus pedidos — tenta recarregar ou voltar pro início.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-ink px-6 py-2.5 font-bold text-cream-50 transition hover:bg-ink-soft"
            >
              Recarregar a página
            </button>
            <a
              href="/"
              className="rounded-full border border-rose px-6 py-2.5 font-bold text-rose transition hover:bg-rose-50"
            >
              Voltar pro início
            </a>
          </div>
          <button onClick={this.copiarDetalhes} className="mt-3 text-xs font-semibold text-ink-muted underline hover:text-rose">
            {copiado ? '✓ Copiado — pode colar pro suporte' : 'Copiar detalhes técnicos (pra mandar pro suporte)'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
