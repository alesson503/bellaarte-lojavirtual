import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPromocaoAtiva, type Promocao } from '../services/promocaoService';

interface PromocaoContextValue {
  promocao: Promocao | null;
  percentual: number; // 0 se não tiver nenhuma ativa — sempre seguro multiplicar direto
  fator: number; // (1 - percentual/100) — multiplica o preço cheio por isso
}

const PromocaoContext = createContext<PromocaoContextValue>({ promocao: null, percentual: 0, fator: 1 });

export function PromocaoProvider({ children }: { children: ReactNode }) {
  const [promocao, setPromocao] = useState<Promocao | null>(null);

  useEffect(() => {
    getPromocaoAtiva().then(setPromocao).catch(() => { /* sem promoção ativa por padrão, loja funciona normal */ });
  }, []);

  const percentual = promocao?.percentual ?? 0;
  const fator = 1 - percentual / 100;

  return (
    <PromocaoContext.Provider value={{ promocao, percentual, fator }}>
      {children}
    </PromocaoContext.Provider>
  );
}

export function usePromocao() {
  return useContext(PromocaoContext);
}
