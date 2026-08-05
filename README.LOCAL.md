# Como rodar o IMobi nesta máquina (Windows)

Sou um assistente AI usando o Copilot CLI runtime em VS Code. Este documento descreve passos testados nesta máquina (Windows) para inicializar o banco PostgreSQL e subir o servidor Node do projeto imobi.

Pré-requisitos
- Node.js 18+ (node disponível no PATH)
- PostgreSQL instalado e em execução localmente (serviço do Windows)
- Git (opcional)

Arquivos importantes
- .env (variáveis de ambiente) — copie de .env.example e ajuste as senhas
- server/db-init.js — script que cria o usuário, banco e aplica o schema
- server/index.js — servidor Express

1) Ajustar .env
1. Copie o exemplo e edite as variáveis:
   - No diretório do projeto:
     Copy-Item .env.example .env
   - Abra `.env` e ajuste PGPASSWORD e PGSUPER_DSN (DSN do superusuário postgres). Exemplo de PGSUPER_DSN:
     postgres://postgres:SUASENHA@127.0.0.1:5432/postgres

Variáveis principais que o app usa (em .env):
- PGHOST (padrão 127.0.0.1)
- PGPORT (padrão 5432)
- PGUSER (usuário do app, ex: imobi)
- PGPASSWORD (senha do PGUSER)
- PGDATABASE (nome do banco, ex: imobi)
- PGSUPER_DSN (usado só por db-init.js)
- PORT (porta do servidor Node, ex: 3000)

2) Instalar dependências Node (se necessário)
- No PowerShell (na pasta do projeto):
  Set-Location 'C:\projetos\imobi'
  npm install

3) Inicializar o banco (rodar db-init)
- O script usa PGSUPER_DSN para conectar como superuser e criar a role + database.
- Exemplo (PowerShell):
  Set-Location 'C:\projetos\imobi'
  $env:PGHOST='127.0.0.1'; $env:PGPORT='5432'; $env:PGUSER='imobi'; $env:PGPASSWORD='SUA_SENHA'; $env:PGDATABASE='imobi'; $env:PGSUPER_DSN='postgres://postgres:SUASENHA@127.0.0.1:5432/postgres'; node server/db-init.js

- Observações:
  - Se PGPASSWORD não estiver definido, o script aborta (é proposital: não há senha hardcoded).
  - Para reiniciar o banco vazio use a variável de ambiente DB_RESET=true antes de rodar (cuidado: apaga dados).

4) Subir o servidor Node (modo simples)
- Para rodar em primeiro plano (útil para debugging):
  Set-Location 'C:\projetos\imobi'
  $env:PGHOST='127.0.0.1'; $env:PGPORT='5432'; $env:PGUSER='imobi'; $env:PGPASSWORD='SUA_SENHA'; $env:PGDATABASE='imobi'; $env:PORT='3000'; node server/index.js

- Para rodar em segundo plano (detached) a partir do PowerShell (como foi feito nesta máquina):
  Start-Process -FilePath node -ArgumentList 'server/index.js' -WorkingDirectory 'C:\projetos\imobi' -NoNewWindow

- Alternativa usada nos testes (define envs temporariamente na mesma linha):
  Set-Location 'C:\projetos\imobi'; $env:PGHOST='127.0.0.1'; $env:PGPORT='5432'; $env:PGUSER='imobi'; $env:PGPASSWORD='123'; $env:PGDATABASE='imobi'; $env:PORT='3000'; node server/index.js

5) Verificar healthcheck
- Endpoint disponível em: http://127.0.0.1:3000/health
- Teste via PowerShell:
  try { Invoke-WebRequest -Uri 'http://127.0.0.1:3000/health' -UseBasicParsing } catch { $_ }
- Resposta esperada: HTTP 200 e JSON {"ok":true}

6) Parar processos do servidor (se necessário)
- Encontrar processos que executam server/index.js e finalizar (PowerShell):
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match 'server\\index.js' -or $_.CommandLine -match 'server/index.js') } | Select-Object ProcessId, CommandLine

- Parar PIDs (ex.: 712, 1816):
  Stop-Process -Id 712,1816 -Force

7) Logs e depuração
- Saída do servidor é escrita no stdout (quando rodando em primeiro plano aparece no console)
- Em background, use o Visualizador de Eventos do Windows ou capture a saída redirecionando a um arquivo:
  Start-Process -FilePath node -ArgumentList 'server/index.js > server.log 2>&1' -WorkingDirectory 'C:\projetos\imobi' -NoNewWindow

8) Problemas comuns e soluções rápidas
- Erro: "defina PGSUPER_DSN no .env" → preencha PGSUPER_DSN corretamente no .env ou na variável de ambiente.
- Erro: autenticação falhou → confirme PGPASSWORD e PGSUPER_DSN; tente conectar com psql para validar.
- PostgreSQL não inicia → verifique o serviço no Services.msc (nome típico: postgresql-x64-18) e veja logs do PostgreSQL.
- Porta 3000 já em uso → altere PORT no .env ou pare o processo que ocupa a porta.

9) Comandos úteis resumidos
- Copiar .env: Copy-Item .env.example .env
- Rodar db-init: node server/db-init.js (com PGSUPER_DSN e PGPASSWORD definidos)
- Iniciar servidor: node server/index.js
- Healthcheck: Invoke-WebRequest 'http://127.0.0.1:3000/health'
- Parar servidor: Stop-Process -Id <PID> -Force

Se quiser, posso:
- adicionar este arquivo ao repositório (já criado aqui como README.LOCAL.md),
- ou incluí-lo no README principal e commitar a alteração.

Arquivo criado: README.LOCAL.md
