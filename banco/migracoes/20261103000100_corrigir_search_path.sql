-- iLabPharma, nova versão. Migração 1.1: o aviso de segurança do Supabase (function_search_path_mutable) apontou
-- quatro funções de apoio sem search_path fixo. Fixar o caminho de busca impede que um schema alheio as desvie.
alter function ilab_interno.bloquear_auditoria() set search_path = '';
alter function ilab_interno.preencher_empresa() set search_path = '';
alter function ilab_interno.carimbar() set search_path = '';
alter procedure ilab_interno.proteger_tabela(text, text) set search_path = '';
