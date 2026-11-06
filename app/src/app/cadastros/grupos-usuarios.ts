import { definirCadastro } from '../compartilhado/cadastro/descricao';

/** Grupos de usuários: ONDE a pessoa atua (o grupo restringe o alcance; quem libera função e ação é o perfil). */
export const gruposUsuarios = definirCadastro({
  tabela: 'grupos_usuarios',
  titulo: 'Grupos de usuários',
  singular: 'grupo de usuários',
  genero: 'm',
  funcao: 'acesso.grupos_usuarios',
  identificador: 'nome',
  busca: ['codigo', 'nome'],
  ordenarPor: 'nome',
  campos: [
    { nome: 'codigo', rotulo: 'Código', obrigatorio: true, max: 20 },
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true, max: 80 },
  ],
});
