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
- Música de fundo tocando direto do YouTube em loop, com botão de som (veja a seção "Música" abaixo — navegadores bloqueiam áudio com som sem interação do usuário, isso não é uma limitação deste projeto específico, é regra de todo navegador).
- **Não precisa configurar nada manualmente**: a chave de segurança das sessões (antigamente chamada de JWT_SECRET) é gerada sozinha na primeira vez que o servidor liga, e a conta do proprietário é criada direto pela tela do site.

## 1. Instalar e rodar localmente

Pré-requisito: [Node.js](https://nodejs.org) versão 18 ou mais recente.

```bash
cd turma-central
npm install
npm start
```

Não precisa criar `.env`, gerar chave nenhuma nem rodar `npm run seed` — o site cuida disso tudo sozinho. Acesse **http://localhost:3000**: como é a primeira vez, vai aparecer uma tela pedindo para criar a conta do **proprietário** (nome, usuário e senha). Depois de criada, você já entra automaticamente logado como proprietário e essa tela nunca mais aparece.

A partir daí, crie as contas de administradores, suporte e alunos direto pelo Painel administrativo (👥 Usuários → Criar usuário).

Se quiser, ainda dá pra personalizar o nome da turma copiando `.env.example` para `.env` e preenchendo `NOME_DA_TURMA` — mas isso é opcional.

## 2. Música de fundo

A música toca direto do vídeo do YouTube que você escolheu, sem precisar baixar nem hospedar nenhum arquivo de áudio (o player fica escondido na página, só o som é usado).

Como todo navegador bloqueia som automático sem interação do usuário, a música entra tocando **mutada** assim que a página abre, e existe um botão flutuante (🔈/🔊) no canto superior direito: no primeiro clique o som é liberado, e a partir daí ela toca em loop, reiniciando sozinha sempre que a faixa terminar. Ela continua tocando enquanto a pessoa navega pelas páginas do site dentro da mesma aba — nenhum site, porém, consegue continuar tocando som com a aba ou o navegador fechados, isso não é algo que dê pra contornar.

Para trocar a música depois, basta editar a constante `BGM_VIDEO_ID` no topo de `public/js/app.js` com o ID de outro vídeo do YouTube.

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
