# WMoldes V3.2 — Somente Realtime Database + Firebase Authentication

**Sem Netlify Functions nem variáveis privadas.** Deploy estático por arrastar pasta no Netlify.

## Ativação
1. No Firebase Console > Authentication > Sign-in method, habilite **Email/Password**.
2. Em Authentication > Users, verifique que `leandrodevxx@gmail.com` existe. Entre no site e confirme o link de verificação do e-mail.
3. No Realtime Database > Rules, faça backup das regras existentes e publique **database.rules.json** (atenção: substitui as regras na totalidade; avalie outros sistemas no mesmo banco).
4. Publique os arquivos desta pasta no site Netlify já existente (drag-and-drop). A versão PWA deve atualizar o cache; recarregue com Ctrl+F5.
5. Entre com o e-mail principal verificado: o sistema o reconhece como administrador sem segredo de implantação.

## Contas de colaboradores
Crie as contas em Firebase Authentication > Users > Add user; o colaborador entra no site e confirma seu e-mail. Ele aparecerá na lista de contas que acessaram. No painel admin, aprove o papel **Inspetor** para o UID. Uma conta criada no console não é automaticamente aprovada. Regras de RTDB não criam usuários de Firebase Authentication nem recuperam senhas alheias.

## Dados mantidos
O namespace é **wmoldes/v2**. Não apague os dados existentes. O painel por forno, os planos, desenhos, inspeções e PDFs permanecem. Perfis são adicionados em `access/profiles` e papéis em `access/roles`.

## Segurança
O administrador principal é definido em regras **por e-mail autenticado e verificado**. Só esse e-mail pode atribuir papéis; inspetores não podem elevar privilégios. Essa abordagem dá controle seguro para um único administrador fixo, mas qualquer mudança de administrador requer editar as regras. Para gestão completa de contas (criar/remover usuário, desativar Auth, último login oficial), o Firebase Authentication exige console ou backend privilegiado. Último acesso neste painel é informado pelo cliente, não registro oficial.

**Não armazene desenhos sensíveis em ramos com leitura pública.**

## Verificação pendente
Validação contra banco real e autenticação real não executadas. Exige publicar regras antes de testar.
