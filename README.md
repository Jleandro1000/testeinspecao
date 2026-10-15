# WMoldes PRO V3.1 — Correção de permissões e área de lançamentos

**O que foi corrigido:** login bem-sucedido não equivale a autorização para gravar dados. Na V3 anterior os botões eram ocultados quando o token não tinha `writer`/`admin`, sem feedback; a V3.1 apresenta o estado da permissão e um fluxo de trabalho visível, com máquina, tipo (Molde/Blank/Neck), prefixo, editor de cotas e novo apontamento. O administrador principal tem acesso ao fluxo de ativação protegido por um segredo no Netlify.

## Após login

1. Autentique-se com e-mail e senha.
2. Na nova área **Área de lançamentos**, selecione a máquina e o tipo (Molde/Blank/Neck).
3. Clique **Definir prefixo** e salve o artigo em produção.
4. Clique **Criar / editar dimensionais**. Escolha **+ Dimensão**, informe nome, tipo, unidade, LSL, LWL, Objetivo, UWL, USL. Pode cadastrar nome global para seleção nas outras máquinas.
5. Clique **Fazer apontamento**, preencha Número + Lote, data e hora, responsável e valores medidos, e confirme.
6. Para consultar, clique na máquina e use as abas **Inspeções** / **Plano dimensional** / **Desenho técnico**.

Se não aparecerem os botões de escrita, a caixa amarela mostra a razão e permite atualizar o token quando um administrador alterar a permissão.

## Ativar o primeiro administrador principal

O proprietário `leandrodevxx@gmail.com` pode autenticar no Firebase Authentication mas continua **visualizador** até receber custom claims seguras. A nova ação **Ativar administrador** aparece após o login. Para utilizá-la, habilite Firebase Email/Password, confirme o e-mail da conta principal, publique o projeto via Git/Netlify com a Function administrativa, e configure as variáveis privadas `FIREBASE_SERVICE_ACCOUNT_JSON` e `WM_BOOTSTRAP_SECRET` no Netlify. Informe o segredo na janela de ativação. O servidor verifica o e-mail, verificação e segredo e atribui os claims. **Somente inserir o e-mail no código não concede privilégios.**

Usuários comuns precisam ser criados com papel Inspetor/`writer` pelo admin. Depois de alterar papel, devem clicar **Atualizar permissões** ou entrar novamente.

**Não são usados dados fictícios** e a V3.1 mantém o mesmo namespace `wmoldes/v2` e as regras `database.rules.json` da V3. Nunca publique regras novas sem antes verificar o efeito nos outros dados do seu Firebase. Não é necessário excluir os registros existentes nem reiniciar o banco.

## PWA e atualização

Publique esta pasta inteira, não só o HTML; o service worker agora é `wmoldes-shell-v3-1` e invalida o cache estático da V3. Se o navegador continuar com a interface antiga, use Ctrl+Shift+R uma vez depois do deploy.

**Estado dos testes:** sintaxe e testes locais de navegação e fluxo simulado podem ser executados; Firebase real, funções Netlify, regras de autorização e persistência ainda precisam ser confirmados no seu ambiente autenticado.

---

# WMoldes PRO V3 — Inspeção Dimensional / Netlify + Firebase

**Status [IMPLEMENTADO]:** código-fonte criado. **[VERIFICADO]:** sintaxe JavaScript, estrutura do ZIP e geração local do relatório PDF A4 com logo WMoldes incorporado. **[VALIDAÇÃO PENDENTE]:** implantação no Netlify, comunicação com seu Realtime Database, Auth, permissões, upload Storage, instalação PWA em aparelhos reais e fluxo CRUD ponta a ponta. Não existem inspeções, prefixos nem medições de demonstração no produto.

## 1. Como utilizar

- **Ao abrir:** visualizador público, com máquinas A1–A6, B1–B8, C1–C8 e 10–15. Prefixos, cotas e inspeções vêm apenas do Realtime Database.
- **Clique na máquina:** abas Inspeções, Plano dimensional, Observações e Desenho técnico. O calendário inicia no dia atual e permite escolher qualquer outro dia.
- **Após login de inspetor:** utilize **Prefixo / máquina** para informar o artigo em produção, depois **Plano dimensional** para criar cotas LSL / LWL / Objetivo / UWL / USL e **Nova inspeção** para lançar medições.
- **Catálogo comum:** no editor de plano, botão **+ Nome global** adiciona o nome (ex. Diâmetro de gargalo) ao catálogo compartilhado por todas as máquinas. Campos de nome aceitam busca rápida e sugestão de nomes existentes; novos nomes digitados nos planos são adicionados automaticamente ao catálogo ao salvar. O filtro filtra cotas já adicionadas ao plano em edição.
- **Prefixo histórico:** cada plano pertence ao par **máquina + prefixo**. A máquina tem seu prefixo vigente; ao trocá-lo, inspeções antigas mantêm `prefix`, `values` e `specsSnapshot` originais. Planos de prefixos antigos continuam armazenados. Cada troca é registrada em `prefixHistory`. Isso não impede alterações maliciosas com credenciais privilegiadas: para rastreabilidade regulatória, implementar auditoria imutável no servidor.
- **Desenho técnico:** um vínculo por prefixo em `/public/drawings`, acessível em todas as máquinas que tiverem o mesmo prefixo. Pode ser URL HTTP(S), referência de caminho Windows (cópia manual) ou arquivo selecionado por um navegador. Imagens possuem zoom por roda/arrasto; PDF é mostrado com controles do visualizador embutido do navegador; há opção de abrir em nova aba. Um servidor remoto pode impedir a visualização em iframe via X-Frame-Options/CSP.
- **CRUD:** dimensões adicionáveis/editáveis/excluíveis em plano; vínculo de desenho editável/excluível; prefixo e observação da máquina editáveis. Inspetor cria, edita e exclui **somente suas inspeções**; administrador pode alterar todas. As regras RTDB são parte obrigatória da proteção.
- **Relatório:** **Relatórios** → escolha data + várias máquinas → prévia PDF → baixar ou imprimir; desenho do logo WMoldes está incorporado no arquivo. Máquinas são dispostas no mesmo A4 enquanto houver espaço e automaticamente paginadas caso necessário.
- **Administração:** a função Netlify `admin.mjs` mantém gerenciamento de usuários, claims de permissão, último login, bloqueios, mensagens e estimativa lógica do volume de dados (NÃO substitui o medidor oficial do Firebase).
- **PWA:** `manifest.webmanifest`, ícones e `sw.js` fornecem instalação e cache apenas dos arquivos estáticos. Inspeções e Auth dependem de conexão ao Firebase; não há sincronização offline de lançamentos.

## 2. Caminho do computador: restrição de segurança real

O HTML `<input type="file">` **não fornece o caminho real** do arquivo, somente os bytes selecionados e um `C:\fakepath\...` mascarado. Um navegador HTTPS **não consegue abrir automaticamente** `C:\desenho.pdf`, `Z:\Projetos\...` ou `\\servidor\compartilhamento\...` em outro PC, mesmo quando ambos têm acesso pela rede corporativa.

Três estratégias foram implementadas:

| Opção | Salva onde? | Abre em outros PCs? | Observações |
|---|---|---|---|
| URL HTTP(S) intranet | Link no Realtime Database | Sim, **se** a intranet permite acesso ao endereço e carregamento no navegador | Melhor opção mantendo arquivos na rede; ideal expor a pasta por servidor HTTPS autenticado/reverso |
| Caminho Windows/SMB | Texto de referência no Realtime Database | Apenas manualmente (copiar/colar no Explorador Windows) | Não há preview automático dentro do site; não confundir com URL |
| Arquivo selecionado → local | Blob no IndexedDB do navegador atual | Não | Permite pré-visualização PDF/imagem apenas naquele navegador/dispositivo; pode sumir se dados do site forem limpos |
| Arquivo selecionado → Firebase Storage | Arquivo no Storage e URL no RTDB | Sim | **Necessita Firebase Blaze e storage.rules**, além de custo potencial. Falhará no Spark |

**Em 2026 o Firebase Storage exige Blaze**, mesmo para manter acesso a buckets existentes. Se você está no Spark, use URL da intranet ou armazenamento apenas neste navegador. Não incorpore arquivos grandes no Realtime Database em base64: eles afetam quota e tráfego.

## 3. Primeiro deploy — Netlify com Functions

1. **Faça backup** das regras e dados existentes no seu Firebase antes de publicar qualquer alteração.
2. Em Firebase Console, projeto `projetoinspecao-41fb8`, **Authentication → Sign-in method**, habilite **Email/Password**. Crie seu usuário `leandrodevxx@gmail.com` e verifique seu e-mail.
3. Em **Realtime Database → Rules**, abra o arquivo `database.rules.json` e publique o conjunto de regras. **ATENÇÃO: as regras completas negam acesso fora de `wmoldes/v2`; se seu projeto hospeda outros sistemas, faça merge cuidadoso do nó `wmoldes/v2`, sem sobrescrever regras alheias.**
4. Publique a pasta via Git conectado ao Netlify, ou rode os comandos abaixo em terminal no Windows. *Arrastar o ZIP no Netlify Drop não garante build das Netlify Functions para administração.*
5. Configure no **Netlify → Environment variables** (variáveis privadas do servidor):
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON da conta de serviço do Firebase, criado em Project settings → Service accounts; **não o coloque no site, Git ou chat**.
   - `WM_BOOTSTRAP_SECRET`: segredo forte aleatório de no mínimo 32 caracteres.
   - `MASTER_ADMIN_EMAIL`: `leandrodevxx@gmail.com` (opcional, valor padrão já definido no backend).
6. Adicione o endereço publicado em Firebase Authentication → Settings → Authorized domains, quando necessário.
7. Entre no site com a conta principal, confirme o e-mail e use o recurso **Ativar admin** com o segredo configurado no Netlify. Apenas correspondência de e-mail verificado **e** segredo **e** verificação server-side permitem a primeira promoção; o e-mail em um arquivo JS não promove ninguém.
8. Teste: visitante lê mas não grava; inspetor A cria e edita só seus lançamentos; inspetor B não consegue editar os de A; admin pode tudo; mudança de prefixo mantém os registros de ontem; PDF de várias máquinas; desenho por link acessível de outros PCs.

### CMD / PowerShell — Windows

```powershell
cd "CAMINHO\DO\WMoldes_Pro_V3"
npm install
npx netlify login
npx netlify init
npx netlify deploy --build --prod
```

Para executar com functions localmente (depois de configurar credenciais de forma segura): `npx netlify dev`.

## 4. Regras de segurança

O arquivo **`database.rules.json`** contém as regras completas, pronto para colar no editor do Firebase **somente quando o banco for dedicado a este app**.

- Realtime Database: `.read` e `.write` negados por padrão; leitura pública apenas dos recursos liberados pelo visualizador; escrita exigindo `auth.token.writer` ou `auth.token.admin` em máquinas, planos, desenhos, catálogo e histórico; inspeções criadas/alteradas/excluídas pelo autor ou admin.
- Storage opcional: arquivo `storage.rules`, publicado em **Storage → Rules**, limita gravadores a claims `writer/admin`, tipo de arquivo PDF/imagem e tamanho. **Somente necessário se habilitar Firebase Storage (Blaze)**.
- Acesso visitante é **público de verdade** aos dados da área `public`: nomes de responsáveis, prefixos, notas, desenhos e dados de inspeção podem ser consultados pelo URL do projeto. Se isso não for permitido na empresa, desabilite visualização aberta e faça autenticação também para visualizadores; não grave dados confidenciais nesses nós.
- Todas as referências externas devem estar em intranet confiável. URL externa pode hospedar conteúdo malicioso; não é executada como JavaScript diretamente, mas o destino pode mudar e a prévia em iframe é controlada pelo servidor de destino.

## 5. Modelo de dados (não há registros pré-criados)

```text
wmoldes/v2/
  public/
    machines/A1/{prefix,machineNote,updatedBy,updatedAt}
    plans/A1/<prefixKey>/{prefix,specs:{dimensionId:{name,type,unit,lsl,lwl,target,uwl,usl}},updatedBy,updatedAt}
    dimensionCatalog/<id>/{name,createdBy,createdAt}
    drawings/<prefixKey>/{prefix,source,kind,fileName,url|path,updatedBy,updatedAt}
    prefixHistory/A1/<id>/{prefix,previousPrefix,effectiveAt,changedBy}
    inspections/A1/YYYY-MM-DD/<id>/{machine,day,type,numberLot,prefix,inspectedAt,inspector,equipmentNote,values,specsSnapshot,createdBy,createdAt,updatedBy,updatedAt}
  private/messages/<uid>/<id>/{subject,body,senderUid,senderEmail,sentAt}
```

`prefixKey` = UTF-8 prefixo convertido para Base64 URL-safe sem padding; o nome real do prefixo permanece salvo no documento. Compatível com caracteres proibidos em chaves RTDB.

**Migração sem destruir V2:** a versão nova mantém `wmoldes/v2` e a estrutura de inspeções existentes. Se um registro antigo de máquina ainda tiver `machine.specs`, o novo editor usa essas cotas como fallback até salvar um plano separado. Alterar prefixo migra o fallback do prefixo antigo, quando necessário. **Faça backup antes de iniciar**.

## 6. Deploy, uso gratuito e operação

- O campo `logicalBytes` em **Admin → Uso Firebase** é **uma estimativa do JSON do namespace WMoldes**, não consumo faturado, download em tempo real, número oficial de conexões ou capacidade do armazenamento de arquivos.
- As cotas de armazenamento e tráfego oficiais estão em **Firebase Console → Realtime Database → Usage**; Firebase Storage, quando habilitado, tem cobrança/medidores próprios.
- PWA requer HTTPS (Netlify) ou localhost. Em `file://` o app não deve ser considerado corretamente executado: módulos ES, service worker e SDK dependem de servir arquivos HTTP.
- Documentos locais no IndexedDB não equivalem a backup corporativo. Limpeza de dados, navegação anônima e novas máquinas podem não enxergá-los.
- **Produção industrial:** validar o plano de controle conforme procedimento interno; criar backup, revisão/aprovação dos planos, histórico de mudanças imutável no backend e mecanismos anti-concorrência. A regra de classificação automática se baseia nos limites definidos pelo usuário, não é certificação metrológica.

## 7. Arquivos relevantes

- `index.html` / `assets/style.css` / `assets/app.js`: dashboard, modais, editor do plano, catálogo, documento técnico, PWA e admin.
- `assets/firebase-api.js`, `assets/firebase-config.js`: Firebase SDK e dados públicos de configuração informados pelo usuário.
- `assets/pdf.js`, `assets/wmoldes-logo-pdf.jpg`: relatório PDF com logo real incorporado ao PDF.
- `assets/wmoldes-logo.png`, `assets/icon-192.png`, `assets/icon-512.png`: logo fornecido e ícones da instalação.
- `database.rules.json`: regras do Realtime Database. `storage.rules`: regras opcionais do Cloud Storage.
- `netlify/functions/admin.mjs`: funções administrativas protegidas.
- `netlify.toml`, `package.json`, `manifest.webmanifest`, `sw.js`: implantação, PWA e cache da interface.

**Limitações dos testes nesta entrega:** testes automáticos de sintaxe e PDF puderam rodar; a navegação automatizada por Chromium foi bloqueada neste ambiente e não houve acesso autenticado ao Firebase nem ao seu Netlify. Por isso, **a interface em navegadores reais e os fluxos Firebase dependem de validação após deploy**.
