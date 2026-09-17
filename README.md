# Central da Turma

Site para gerenciar atividades, prazos, avisos e chat em tempo real de uma turma.

## O que já funciona de verdade

- Login com usuário/senha (bcrypt, cookie de sessão assinado com JWT, bloqueio após 5 tentativas erradas, limite de tentativas por IP).
- 4 papéis: proprietário (👑), administrador (🛠️), suporte (🆘) e aluno (👤), cada um com permissões diferentes checadas **no servidor** (nunca só no navegador).
- Atividades/trabalhos/avisos com ID automático (ATV-001, TRB-002...), anexos, status calculado automaticamente pela data de entrega.
- Calendário mensal com os prazos.
- Chat em tempo real (Socket.io) com histórico salvo no banco e carregamento progressivo.
- Painel administrativo, painel exclusivo do proprietário e logs de ações importantes.
- Modo claro/escuro e layout responsivo (celular, tablet, computador).
- Música de fundo com loop automático e botão de som (veja a seção "Música" abaixo — navegadores bloqueiam áudio com som sem interação do usuário, isso não é uma limitação deste projeto específico, é regra de todo navegador).

## 1. Instalar e rodar localmente

Pré-requisito: [Node.js](https://nodejs.org) versão 18 ou mais recente.

```bash
cd turma-central
npm install
cp .env.example .env
```

Abra o arquivo `.env` e preencha:
- `JWT_SECRET`: gere um valor aleatório rodando `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` e cole o resultado.
- `OWNER_USERNAME` e `OWNER_PASSWORD`: o login e senha que o **proprietário** vai usar.
- `NOME_DA_TURMA`: o nome que aparece no site.

Depois crie a conta do proprietário (só precisa rodar isso uma vez):

```bash
npm run seed
```

Isso cria a conta do dono com a senha já criptografada no banco — a senha em texto puro nunca fica salva em lugar nenhum depois disso. Por segurança, depois de rodar o seed você pode apagar `OWNER_USERNAME`/`OWNER_PASSWORD` do `.env`.

Agora inicie o servidor:

```bash
npm start
```

Acesse **http://localhost:3000** e faça login com a conta do proprietário. A partir daí, crie as contas de administradores, suporte e alunos direto pelo Painel administrativo (👥 Usuários → Criar usuário).

## 2. Música de fundo

Coloque um arquivo de áudio em `public/uploads/musica-fundo.mp3` (esse é o nome que o site já procura). Use uma música livre de direitos autorais ou com licença que permita esse uso — eu não posso incluir o áudio de um vídeo do YouTube diretamente por questão de direitos autorais.

Como todo navegador bloqueia som automático sem interação do usuário, a música entra tocando **mutada** assim que a página abre, e existe um botão flutuante (🔈/🔊) no canto superior direito: no primeiro clique o som é liberado, e a partir daí ela toca em loop, reiniciando sozinha sempre que a faixa terminar.

Se preferir só um botão que abre o vídeo do YouTube em vez de tocar dentro do site, me avise que eu troco essa parte.

## 3. Enviar para o GitHub

O projeto já vem com um repositório git iniciado e o primeiro commit feito (o `.gitignore` garante que `.env`, o banco de dados e os arquivos de upload nunca vão parar no GitHub). Para enviar:

1. Crie um repositório novo e **vazio** no GitHub (sem README, sem .gitignore — já tem esses arquivos aqui). Nome sugerido: `Turma7-b` (o GitHub não aceita o símbolo `°` em nomes de repositório, só letras, números, hífen, underscore e ponto). Copie a URL do repositório depois de criado.
2. No terminal, dentro da pasta do projeto:

```bash
git remote add origin https://github.com/seu-usuario/Turma7-b.git
git branch -M main
git push -u origin main
```

3. Pronto — o código está no GitHub. **Confira lá que o arquivo `.env` não aparece na lista** (ele nunca deve aparecer; só o `.env.example` deve estar visível).

Depois disso, no Render ou Railway você conecta esse mesmo repositório do GitHub e configura as variáveis de ambiente (`JWT_SECRET`, `OWNER_USERNAME`, `OWNER_PASSWORD`, `NOME_DA_TURMA`) direto no painel da plataforma — nunca dentro do código.

## 4. Colocar o site no ar (hospedagem)

Este projeto precisa rodar num servidor Node.js (não é um site estático). Opções gratuitas/simples:

- **Render.com** ou **Railway.app**: conecte o repositório, defina o comando de start (`npm start`) e cadastre as variáveis de ambiente do `.env` no painel do serviço. Rode `npm run seed` uma vez pelo terminal/shell da plataforma (ambas oferecem um shell integrado).
- Importante: o banco (`db/turma.db`) e a pasta `public/uploads` precisam ficar num **disco persistente** — em muitos planos gratuitos o sistema de arquivos é apagado a cada novo deploy. Verifique nas configurações do serviço a opção de "persistent disk"/"volume".
- Configure `NODE_ENV=production` em produção.

## 5. Estrutura do projeto

```
server.js              → servidor Express + Socket.io
db/schema.sql           → estrutura das tabelas
db/seed.js               → cria a conta do proprietário a partir do .env
middleware/auth.js       → autenticação e checagem de permissões
routes/auth.js           → login/logout
routes/users.js          → gerenciar usuários (criar/editar/excluir/papéis)
routes/activities.js     → atividades/trabalhos/avisos + upload de anexos
routes/chat.js            → histórico de mensagens
routes/logs.js            → registros administrativos (painel do proprietário)
public/                   → frontend (HTML, CSS, JS puro, sem build)
```

## 6. Segurança — o que já está implementado

- Senhas: nunca em texto puro, sempre com `bcrypt`.
- Sessão: cookie `httpOnly`, assinado com `JWT_SECRET` (que não fica no código).
- Permissões: checadas em cada rota da API no servidor — o frontend só esconde botões, quem garante mesmo é o backend.
- Rate limiting no login (8 tentativas por IP a cada 10 min) + bloqueio de conta após 5 senhas erradas seguidas.
- Upload de arquivo com limite de tamanho (15 MB) e lista de extensões permitidas.
- Proteção contra SQL Injection: todas as consultas usam parâmetros (`better-sqlite3` prepared statements), nunca concatenação de string.

## 7. Próximos passos que você pode pedir para expandir

- Notificações push via PWA (dá pra adicionar depois com um Service Worker).
- Exportar relatórios de atividades.
- Editar/excluir suas próprias mensagens no chat.
