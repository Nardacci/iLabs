# Antes de lançar: valores temporários a ajustar

Lista de coisas que estão **de um jeito provisório** durante o desenvolvimento e **precisam voltar ao valor de lançamento**. Quem for preparar um lançamento confere esta lista inteira.

| Item | Hoje (provisório) | No lançamento | Onde mudar |
|---|---|---|---|
| Dias de teste da empresa nova | **365** | A definir pelo responsável (a proposta anterior era 15) | Parâmetro `dias_teste` em `ilab.parametros_plataforma` (criado na migração 3, ainda não aplicada) e a constante `DIAS_TESTE` do protótipo (`prototipo/empresa.js`) |
| Carência depois do teste | 6 dias | Confirmar | Parâmetro `dias_carencia` em `ilab.parametros_plataforma` (migração 3). Em carência a empresa só lê; passada a carência, é suspensa |
| AFE da ANVISA no cadastro | Opcional durante o teste | Exigida ao fim do teste | Regra do cadastro e da conversão do teste |
| Registros feitos durante o teste | Sem tratamento definido | Marcar como "de teste" ou limpar ao sair do teste | Decisão pendente |
| Consulta do CNPJ na Receita | Só formato e dígitos | Avaliar consultar a Receita | Cadastro da empresa |
| Conferência do CRF no conselho | Só formato (UF e número) | Avaliar conferir no conselho | Cadastro da empresa |
| Duas etapas para administradores | Só quem aprova (decisão do responsável) | Rever a recomendação de incluir administradores | `dupla_etapa_admin` em `ilab.politica_seguranca` (migração 3; desligada por padrão) |
| Administrador do sistema sem poder de aprovar | Proposta, a validar com a Qualidade | Confirmar. Numa empresa nova com uma só pessoa, ninguém aprova até existir outro perfil com a função de aprovar | Função `criar_empresa` e perfis (migração 3) |
| Perfis de teste (`T-...`) | Existem só para teste (`criar_perfis_de_teste`) | Não criar em empresa real; definir a matriz final com a Qualidade | `ilab_interno.criar_perfis_de_teste` |
| Ajustes no painel do Supabase | Nada conferido (não houve acesso ao projeto) | Confirmação de e-mail ligada, exigir a senha atual ao trocar a senha, duas etapas (TOTP) ligadas, senha mínima 12, SMTP próprio, endereços de retorno permitidos | Painel do Supabase (lista em `app/README.md`) |
| Envio do e-mail de convite | Não existe: a tela mostra o link para copiar | Função de servidor que envia o e-mail (SMTP próprio) | `app/src/app/usuarios` e nova função em `supabase/functions` |
| Códigos de recuperação das duas etapas | Não ligados | Decidir com a Qualidade (recurso novo do Supabase Auth) | `app/src/app/acesso/seguranca` |
| Lista de sessões abertas | Só "encerrar as outras sessões" | Avaliar se a Qualidade exige a lista | Função de servidor própria, se necessário |
| Mensagem de "empresa suspensa" no login | A ação aparece só depois de senha certa | Confirmar com a diretoria se prefere mensagem genérica também aqui | `decidirProximo` em `supabase/functions/login/manipulador.ts` |
