-- =====================================================================
-- IMobi — Schema PostgreSQL (backend relacional)
-- Ordem respeita FKs: imoveis -> contratos -> inquilinos/cobrancas;
-- imoveis -> manutencoes/documentos. Dados fictícios em seed.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS imoveis (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  endereco      TEXT NOT NULL,
  cidade        TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('Apartamento','Casa','Sala comercial')),
  valor         NUMERIC(12,2) NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('Alugado','Disponível','Manutenção')),
  proprietario  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contratos (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  imovel_id     INTEGER REFERENCES imoveis(id) ON DELETE CASCADE,
  proprietario  TEXT NOT NULL,
  inquilino     TEXT NOT NULL,
  aluguel       NUMERIC(12,2) NOT NULL,
  iptu          NUMERIC(12,2) NOT NULL,
  condominio    NUMERIC(12,2) NOT NULL,
  inicio        DATE NOT NULL,
  fim           DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('Ativo','Vencendo','Encerrado'))
);

CREATE TABLE IF NOT EXISTS inquilinos (
  id            SERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  cpf           TEXT NOT NULL,
  tel           TEXT NOT NULL,
  email         TEXT NOT NULL,
  profissao     TEXT NOT NULL,
  renda         NUMERIC(12,2) NOT NULL,
  contrato_id   INTEGER REFERENCES contratos(id) ON DELETE SET NULL,
  status        TEXT NOT NULL CHECK (status IN ('Ativo','Atrasado'))
);

CREATE TABLE IF NOT EXISTS proprietarios (
  id            SERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  doc           TEXT NOT NULL,
  email         TEXT NOT NULL,
  tel           TEXT NOT NULL,
  imoveis_count INTEGER NOT NULL DEFAULT 0,
  banco         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cobrancas (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  cliente       TEXT NOT NULL,
  contrato_id   INTEGER REFERENCES contratos(id) ON DELETE SET NULL,
  vencimento    DATE NOT NULL,
  valor         NUMERIC(12,2) NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('Boleto','PIX','Cartão')),
  status        TEXT NOT NULL CHECK (status IN ('Pago','Pendente','Atrasado'))
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id            SERIAL PRIMARY KEY,
  data          DATE NOT NULL,
  descricao     TEXT NOT NULL,
  categoria     TEXT NOT NULL CHECK (categoria IN ('Receita','Despesa')),
  valor         NUMERIC(12,2) NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('Pago','Pendente'))
);

CREATE TABLE IF NOT EXISTS manutencoes (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  titulo        TEXT NOT NULL,
  imovel_id     INTEGER REFERENCES imoveis(id) ON DELETE CASCADE,
  fornecedor    TEXT NOT NULL,
  prioridade    TEXT NOT NULL CHECK (prioridade IN ('Alta','Média','Baixa')),
  status        TEXT NOT NULL CHECK (status IN ('Aberto','Em andamento','Finalizado')),
  valor         NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS documentos (
  id            SERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('Contrato','Escritura','Comprovante','Imagem','Vistoria')),
  imovel_id     INTEGER REFERENCES imoveis(id) ON DELETE CASCADE,
  tamanho       TEXT NOT NULL DEFAULT '',
  caminho_arquivo TEXT,
  icone         TEXT NOT NULL DEFAULT 'FileText',
  tom           TEXT NOT NULL DEFAULT 'primary' CHECK (tom IN ('primary','success','warning'))
);

CREATE TABLE IF NOT EXISTS eventos (
  id            SERIAL PRIMARY KEY,
  dia           INTEGER NOT NULL,
  titulo        TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('Visita','Vistoria','Renovação','Assinatura')),
  hora          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS serie_receita (id SERIAL PRIMARY KEY, mes TEXT NOT NULL, valor NUMERIC(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS serie_fluxo  (id SERIAL PRIMARY KEY, mes text not null, receita NUMERIC(12,2) NOT NULL, despesa NUMERIC(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS serie_ocupacao (id SERIAL PRIMARY KEY, mes text not null, valor NUMERIC(12,2) NOT NULL);
CREATE TABLE IF NOT EXISTS pizza_portfolio (id SERIAL PRIMARY KEY, label text not null, valor NUMERIC(12,2) NOT NULL, cor text not null);

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY, nome TEXT NOT NULL, cargo TEXT NOT NULL, email TEXT NOT NULL
);
INSERT INTO usuario (nome, cargo, email) VALUES ('Marcus C.', 'Corretor', 'marcus@imobi.com')
  ON CONFLICT DO NOTHING;
