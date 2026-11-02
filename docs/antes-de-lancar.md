# Antes de lançar: valores temporários a ajustar

Lista de coisas que estão **de um jeito provisório** durante o desenvolvimento e **precisam voltar ao valor de lançamento**. Quem for preparar um lançamento confere esta lista inteira.

| Item | Hoje (provisório) | No lançamento | Onde mudar |
|---|---|---|---|
| Dias de teste da empresa nova | **365** | A definir pelo responsável (a proposta anterior era 15) | Parâmetro do banco (a criar na migração 3) e a constante `DIAS_TESTE` do protótipo (`prototipo/empresa.js`) |
| Carência depois do teste | 6 dias | Confirmar | Parâmetro do banco |
| AFE da ANVISA no cadastro | Opcional durante o teste | Exigida ao fim do teste | Regra do cadastro e da conversão do teste |
| Registros feitos durante o teste | Sem tratamento definido | Marcar como "de teste" ou limpar ao sair do teste | Decisão pendente |
| Consulta do CNPJ na Receita | Só formato e dígitos | Avaliar consultar a Receita | Cadastro da empresa |
| Conferência do CRF no conselho | Só formato (UF e número) | Avaliar conferir no conselho | Cadastro da empresa |
| Duas etapas para administradores | Só quem aprova (decisão do responsável) | Rever a recomendação de incluir administradores | Política de segurança |
