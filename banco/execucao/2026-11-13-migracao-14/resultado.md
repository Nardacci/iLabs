# Migração 14: Setor do profissional e aviso de novo login (aplicada em 13/11/2026)

Autorizada pelo responsável. Aplicada no Supabase (projeto LabPharma) depois de passar nos testes (banco 548/548).

Conferido no banco real:
- coluna `ilab.profissionais.setor_id`, chave estrangeira `profissionais_setor_fk` e gatilho `profissionais_setor`: presentes;
- `ilab.efeito_da_ultima_alteracao`: executável só por usuário logado (visitante não);
- `ilab_interno.campos_que_exigem_novo_login` e `ilab_interno.conferir_setor_do_profissional`: ninguém executa direto;
- RLS de `profissionais` continua ligada;
- alertas de segurança: só os já conhecidos (`sessoes_atividade` sem política, de propósito; proteção de senha vazada desligada, a ligar no painel).
