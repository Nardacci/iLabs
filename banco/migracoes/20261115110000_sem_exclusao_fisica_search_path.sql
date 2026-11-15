-- iLabs, nova versão. Migração 17: fixa o search_path da função que impede apagar vínculos do profissional.
-- Corrige o aviso do Supabase (function_search_path_mutable) trazido pela migração 15, que já está aplicada e por isso não se edita.
alter function ilab_interno.sem_exclusao_fisica() set search_path = '';
