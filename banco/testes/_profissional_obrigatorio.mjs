// Campos que o banco passou a exigir no Profissional (migração 15). Usados pelos testes das migrações 11 a 14,
// que só precisam de um profissional válido (a base de apoio traz o Rio de Janeiro).
export const OBR_COLS = 'data_nascimento, sexo, mae, naturalidade_uf, naturalidade_municipio_id, pais_id, logradouro, endereco_numero, cep, uf, municipio_id, bairro';
export const OBR_VALS = "date '1990-01-15', 'feminino', 'MAE TESTE', 'RJ', 3304557, 1, 'RUA TESTE', '1', '22631003', 'RJ', 3304557, 'BARRA DA TIJUCA'";
