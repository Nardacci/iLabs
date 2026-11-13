// ARQUIVO GERADO por `npm run tipos`. NÃO EDITE À MÃO.
// Fonte da verdade: o banco (banco/migracoes). Se uma função do banco mudar, este arquivo muda e o build avisa.

export type Json = string | number | boolean | null | { [chave: string]: Json | undefined } | Json[];

export type Database = {
  ilab: {
    Tables: {
      acessos: {
        Row: {
          id: number
          empresa_id: string | null
          usuario_id: string | null
          email_informado: string | null
          evento: string
          resultado: string
          origem_ip: string | null
          navegador: string | null
          detalhe: string | null
          em: string
        }
        Insert: {
          empresa_id?: string | null
          usuario_id?: string | null
          email_informado?: string | null
          evento: string
          resultado: string
          origem_ip?: string | null
          navegador?: string | null
          detalhe?: string | null
          em?: string
        }
        Update: {
          id?: number
          empresa_id?: string | null
          usuario_id?: string | null
          email_informado?: string | null
          evento?: string
          resultado?: string
          origem_ip?: string | null
          navegador?: string | null
          detalhe?: string | null
          em?: string
        }
        Relationships: []
      }
      almoxarifados: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nome: string
          tipo: string
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          situacao: string
          ativo: boolean | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          nome: string
          tipo: string
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          nome?: string
          tipo?: string
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          id: number
          empresa_id: string
          usuario_id: string
          significado: string
          tabela: string
          registro_id: string
          motivo: string
          segundo_fator: boolean
          origem_ip: string | null
          assinado_em: string
        }
        Insert: {
          empresa_id: string
          usuario_id: string
          significado: string
          tabela: string
          registro_id: string
          motivo: string
          segundo_fator?: boolean
          origem_ip?: string | null
          assinado_em?: string
        }
        Update: {
          id?: number
          empresa_id?: string
          usuario_id?: string
          significado?: string
          tabela?: string
          registro_id?: string
          motivo?: string
          segundo_fator?: boolean
          origem_ip?: string | null
          assinado_em?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          id: number
          empresa_id: string | null
          tabela: string
          registro_id: string
          acao: string
          usuario_id: string | null
          em: string
          antes: Json | null
          depois: Json | null
          motivo: string | null
        }
        Insert: {
          empresa_id?: string | null
          tabela: string
          registro_id: string
          acao: string
          usuario_id?: string | null
          em?: string
          antes?: Json | null
          depois?: Json | null
          motivo?: string | null
        }
        Update: {
          id?: number
          empresa_id?: string | null
          tabela?: string
          registro_id?: string
          acao?: string
          usuario_id?: string | null
          em?: string
          antes?: Json | null
          depois?: Json | null
          motivo?: string | null
        }
        Relationships: []
      }
      avisos_admin: {
        Row: {
          id: string
          empresa_id: string
          tipo: string
          usuario_id: string | null
          mensagem: string
          criado_em: string
          lido_em: string | null
          lido_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          tipo: string
          usuario_id?: string | null
          mensagem: string
          criado_em?: string
          lido_em?: string | null
          lido_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          tipo?: string
          usuario_id?: string | null
          mensagem?: string
          criado_em?: string
          lido_em?: string | null
          lido_por?: string | null
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          descricao: string
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          descricao: string
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          descricao?: string
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      convites: {
        Row: {
          id: string
          empresa_id: string
          email: string
          nome: string
          perfil_id: string
          token_hash: string
          expira_em: string
          usado_em: string | null
          usado_por: string | null
          cancelado_em: string | null
          convidado_por: string | null
          criado_em: string
          profissional_id: string | null
          perfis_ids: string[]
          valida_de: string | null
          valida_ate: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          email: string
          nome: string
          perfil_id: string
          token_hash: string
          expira_em: string
          usado_em?: string | null
          usado_por?: string | null
          cancelado_em?: string | null
          convidado_por?: string | null
          criado_em?: string
          profissional_id?: string | null
          perfis_ids?: string[]
          valida_de?: string | null
          valida_ate?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          email?: string
          nome?: string
          perfil_id?: string
          token_hash?: string
          expira_em?: string
          usado_em?: string | null
          usado_por?: string | null
          cancelado_em?: string | null
          convidado_por?: string | null
          criado_em?: string
          profissional_id?: string | null
          perfis_ids?: string[]
          valida_de?: string | null
          valida_ate?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          id: string
          codigo: string
          nome: string
          ativo: boolean
          criado_em: string
          situacao_acesso: string
          teste_ate: string | null
          cnpj: string | null
          razao_social: string | null
          nome_fantasia: string | null
          telefone: string | null
          email_contato: string | null
          cep: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          cidade: string | null
          uf: string | null
          afe: string | null
          responsavel_tecnico_nome: string | null
          responsavel_tecnico_crf: string | null
          responsavel_cargo: string | null
          responsavel_telefone: string | null
          usa_estoque: boolean
        }
        Insert: {
          id?: string
          codigo: string
          nome: string
          ativo?: boolean
          criado_em?: string
          situacao_acesso?: string
          teste_ate?: string | null
          cnpj?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          telefone?: string | null
          email_contato?: string | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          cidade?: string | null
          uf?: string | null
          afe?: string | null
          responsavel_tecnico_nome?: string | null
          responsavel_tecnico_crf?: string | null
          responsavel_cargo?: string | null
          responsavel_telefone?: string | null
          usa_estoque?: boolean
        }
        Update: {
          id?: string
          codigo?: string
          nome?: string
          ativo?: boolean
          criado_em?: string
          situacao_acesso?: string
          teste_ate?: string | null
          cnpj?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          telefone?: string | null
          email_contato?: string | null
          cep?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          cidade?: string | null
          uf?: string | null
          afe?: string | null
          responsavel_tecnico_nome?: string | null
          responsavel_tecnico_crf?: string | null
          responsavel_cargo?: string | null
          responsavel_telefone?: string | null
          usa_estoque?: boolean
        }
        Relationships: []
      }
      enderecos_almoxarifado: {
        Row: {
          id: string
          empresa_id: string
          almoxarifado_id: string
          codigo: string
          descricao: string | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          situacao: string
          ativo: boolean | null
        }
        Insert: {
          id?: string
          empresa_id: string
          almoxarifado_id: string
          codigo: string
          descricao?: string | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Update: {
          id?: string
          empresa_id?: string
          almoxarifado_id?: string
          codigo?: string
          descricao?: string | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Relationships: []
      }
      estrutura_organizacional: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nome: string
          tipo: string
          pai_id: string | null
          responsavel_id: string | null
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          nome: string
          tipo: string
          pai_id?: string | null
          responsavel_id?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          nome?: string
          tipo?: string
          pai_id?: string | null
          responsavel_id?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      funcoes: {
        Row: {
          chave: string
          modulo: string
          nome: string
          ativo: boolean
        }
        Insert: {
          chave: string
          modulo: string
          nome: string
          ativo?: boolean
        }
        Update: {
          chave?: string
          modulo?: string
          nome?: string
          ativo?: boolean
        }
        Relationships: []
      }
      funcoes_profissionais: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          descricao: string
          pode_assinar: string | null
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          descricao: string
          pode_assinar?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          descricao?: string
          pode_assinar?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      grupos_usuarios: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nome: string
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          nome: string
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          nome?: string
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      logradouros: {
        Row: {
          id: number
          cep: string
          tipo: string | null
          nome: string
          complemento: string | null
          uf: string
          municipio_id: number
          bairro: string | null
        }
        Insert: {
          cep: string
          tipo?: string | null
          nome: string
          complemento?: string | null
          uf: string
          municipio_id: number
          bairro?: string | null
        }
        Update: {
          id?: number
          cep?: string
          tipo?: string | null
          nome?: string
          complemento?: string | null
          uf?: string
          municipio_id?: number
          bairro?: string | null
        }
        Relationships: []
      }
      materiais: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          descricao: string
          tipo: string
          unidade_id: string
          controla_lote: boolean
          exige_analise: boolean
          prazo_reteste_dias: number | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          situacao: string
          ativo: boolean | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          descricao: string
          tipo: string
          unidade_id: string
          controla_lote?: boolean
          exige_analise?: boolean
          prazo_reteste_dias?: number | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          descricao?: string
          tipo?: string
          unidade_id?: string
          controla_lote?: boolean
          exige_analise?: boolean
          prazo_reteste_dias?: number | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Relationships: []
      }
      municipios: {
        Row: {
          id: number
          uf: string
          nome: string
        }
        Insert: {
          id: number
          uf: string
          nome: string
        }
        Update: {
          id?: number
          uf?: string
          nome?: string
        }
        Relationships: []
      }
      ocupacoes: {
        Row: {
          codigo: string
          descricao: string
        }
        Insert: {
          codigo: string
          descricao: string
        }
        Update: {
          codigo?: string
          descricao?: string
        }
        Relationships: []
      }
      operadoras_telefonia: {
        Row: {
          id: number
          nome: string
          tipo: string
        }
        Insert: {
          id: number
          nome: string
          tipo: string
        }
        Update: {
          id?: number
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      orgaos_emissores: {
        Row: {
          id: number
          sigla: string
          nome: string
        }
        Insert: {
          id: number
          sigla: string
          nome: string
        }
        Update: {
          id?: number
          sigla?: string
          nome?: string
        }
        Relationships: []
      }
      paises: {
        Row: {
          id: number
          nome: string
        }
        Insert: {
          id: number
          nome: string
        }
        Update: {
          id?: number
          nome?: string
        }
        Relationships: []
      }
      parametros_plataforma: {
        Row: {
          chave: string
          valor_inteiro: number
          descricao: string
          provisorio: boolean
          alterado_em: string
        }
        Insert: {
          chave: string
          valor_inteiro: number
          descricao: string
          provisorio?: boolean
          alterado_em?: string
        }
        Update: {
          chave?: string
          valor_inteiro?: number
          descricao?: string
          provisorio?: boolean
          alterado_em?: string
        }
        Relationships: []
      }
      perfil_funcoes: {
        Row: {
          perfil_id: string
          funcao_chave: string
          consultar: boolean
          incluir: boolean
          alterar: boolean
          excluir: boolean
          imprimir: boolean
          consultar_historico: boolean
        }
        Insert: {
          perfil_id: string
          funcao_chave: string
          consultar?: boolean
          incluir?: boolean
          alterar?: boolean
          excluir?: boolean
          imprimir?: boolean
          consultar_historico?: boolean
        }
        Update: {
          perfil_id?: string
          funcao_chave?: string
          consultar?: boolean
          incluir?: boolean
          alterar?: boolean
          excluir?: boolean
          imprimir?: boolean
          consultar_historico?: boolean
        }
        Relationships: []
      }
      perfis: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          descricao: string | null
          ativo: boolean
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nome: string
          descricao?: string | null
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nome?: string
          descricao?: string | null
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      pessoas_juridicas: {
        Row: {
          id: string
          empresa_id: string
          cnpj: string
          razao_social: string
          nome_fantasia: string | null
          tipos: string[]
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          situacao: string
          ativo: boolean | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cnpj: string
          razao_social: string
          nome_fantasia?: string | null
          tipos?: string[]
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Update: {
          id?: string
          empresa_id?: string
          cnpj?: string
          razao_social?: string
          nome_fantasia?: string | null
          tipos?: string[]
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Relationships: []
      }
      politica_seguranca: {
        Row: {
          empresa_id: string
          senha_minimo: number
          senha_validade_dias: number | null
          inatividade_minutos: number
          tentativas_max: number
          janela_minutos: number
          bloqueio_minutos: number
          convite_validade_horas: number
          dupla_etapa_aprova: boolean
          dupla_etapa_admin: boolean
          atualizado_em: string | null
          atualizado_por: string | null
        }
        Insert: {
          empresa_id: string
          senha_minimo?: number
          senha_validade_dias?: number | null
          inatividade_minutos?: number
          tentativas_max?: number
          janela_minutos?: number
          bloqueio_minutos?: number
          convite_validade_horas?: number
          dupla_etapa_aprova?: boolean
          dupla_etapa_admin?: boolean
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Update: {
          empresa_id?: string
          senha_minimo?: number
          senha_validade_dias?: number | null
          inatividade_minutos?: number
          tentativas_max?: number
          janela_minutos?: number
          bloqueio_minutos?: number
          convite_validade_horas?: number
          dupla_etapa_aprova?: boolean
          dupla_etapa_admin?: boolean
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nome: string
          cpf: string
          cbo: string | null
          funcao_profissional_id: string
          grupo_id: string | null
          usuario_id: string | null
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          setor_id: string | null
          data_nascimento: string | null
          sexo: string | null
          mae: string | null
          pai: string | null
          naturalidade_uf: string | null
          naturalidade_municipio_id: number | null
          identidade: string | null
          orgao_emissor_id: number | null
          data_emissao: string | null
          identidade_profissional: string | null
          orgao_classe_id: number | null
          tel1_ddi: string | null
          tel1_ddd: string | null
          tel1_numero: string | null
          tel2_ddi: string | null
          tel2_ddd: string | null
          tel2_numero: string | null
          cel1_ddi: string | null
          cel1_ddd: string | null
          cel1_numero: string | null
          cel1_operadora_id: number | null
          cel2_ddi: string | null
          cel2_ddd: string | null
          cel2_numero: string | null
          cel2_operadora_id: number | null
          email: string | null
          pais_id: number | null
          cep: string | null
          logradouro: string | null
          endereco_numero: string | null
          complemento: string | null
          uf: string | null
          municipio_id: number | null
          bairro: string | null
          codigo_postal: string | null
          cidade: string | null
          cargo: string | null
          matricula: string | null
          especializacao: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          nome: string
          cpf: string
          cbo?: string | null
          funcao_profissional_id: string
          grupo_id?: string | null
          usuario_id?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          setor_id?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          mae?: string | null
          pai?: string | null
          naturalidade_uf?: string | null
          naturalidade_municipio_id?: number | null
          identidade?: string | null
          orgao_emissor_id?: number | null
          data_emissao?: string | null
          identidade_profissional?: string | null
          orgao_classe_id?: number | null
          tel1_ddi?: string | null
          tel1_ddd?: string | null
          tel1_numero?: string | null
          tel2_ddi?: string | null
          tel2_ddd?: string | null
          tel2_numero?: string | null
          cel1_ddi?: string | null
          cel1_ddd?: string | null
          cel1_numero?: string | null
          cel1_operadora_id?: number | null
          cel2_ddi?: string | null
          cel2_ddd?: string | null
          cel2_numero?: string | null
          cel2_operadora_id?: number | null
          email?: string | null
          pais_id?: number | null
          cep?: string | null
          logradouro?: string | null
          endereco_numero?: string | null
          complemento?: string | null
          uf?: string | null
          municipio_id?: number | null
          bairro?: string | null
          codigo_postal?: string | null
          cidade?: string | null
          cargo?: string | null
          matricula?: string | null
          especializacao?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          nome?: string
          cpf?: string
          cbo?: string | null
          funcao_profissional_id?: string
          grupo_id?: string | null
          usuario_id?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          setor_id?: string | null
          data_nascimento?: string | null
          sexo?: string | null
          mae?: string | null
          pai?: string | null
          naturalidade_uf?: string | null
          naturalidade_municipio_id?: number | null
          identidade?: string | null
          orgao_emissor_id?: number | null
          data_emissao?: string | null
          identidade_profissional?: string | null
          orgao_classe_id?: number | null
          tel1_ddi?: string | null
          tel1_ddd?: string | null
          tel1_numero?: string | null
          tel2_ddi?: string | null
          tel2_ddd?: string | null
          tel2_numero?: string | null
          cel1_ddi?: string | null
          cel1_ddd?: string | null
          cel1_numero?: string | null
          cel1_operadora_id?: number | null
          cel2_ddi?: string | null
          cel2_ddd?: string | null
          cel2_numero?: string | null
          cel2_operadora_id?: number | null
          email?: string | null
          pais_id?: number | null
          cep?: string | null
          logradouro?: string | null
          endereco_numero?: string | null
          complemento?: string | null
          uf?: string | null
          municipio_id?: number | null
          bairro?: string | null
          codigo_postal?: string | null
          cidade?: string | null
          cargo?: string | null
          matricula?: string | null
          especializacao?: string | null
        }
        Relationships: []
      }
      profissional_funcoes: {
        Row: {
          id: string
          empresa_id: string
          profissional_id: string
          funcao_profissional_id: string
          principal: boolean
          ativo: boolean
          criado_em: string
          criado_por: string | null
          retirado_em: string | null
          retirado_por: string | null
          motivo_retirada: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          profissional_id: string
          funcao_profissional_id: string
          principal?: boolean
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          retirado_em?: string | null
          retirado_por?: string | null
          motivo_retirada?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          profissional_id?: string
          funcao_profissional_id?: string
          principal?: boolean
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          retirado_em?: string | null
          retirado_por?: string | null
          motivo_retirada?: string | null
        }
        Relationships: []
      }
      profissional_ocupacoes: {
        Row: {
          id: string
          empresa_id: string
          profissional_id: string
          ocupacao_codigo: string
          ativo: boolean
          criado_em: string
          criado_por: string | null
          retirado_em: string | null
          retirado_por: string | null
          motivo_retirada: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          profissional_id: string
          ocupacao_codigo: string
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          retirado_em?: string | null
          retirado_por?: string | null
          motivo_retirada?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          profissional_id?: string
          ocupacao_codigo?: string
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          retirado_em?: string | null
          retirado_por?: string | null
          motivo_retirada?: string | null
        }
        Relationships: []
      }
      sessoes_atividade: {
        Row: {
          sessao_id: string
          usuario_id: string
          empresa_id: string | null
          iniciada_em: string
          ultima_atividade: string
          encerrada_em: string | null
        }
        Insert: {
          sessao_id: string
          usuario_id: string
          empresa_id?: string | null
          iniciada_em?: string
          ultima_atividade?: string
          encerrada_em?: string | null
        }
        Update: {
          sessao_id?: string
          usuario_id?: string
          empresa_id?: string | null
          iniciada_em?: string
          ultima_atividade?: string
          encerrada_em?: string | null
        }
        Relationships: []
      }
      ufs: {
        Row: {
          sigla: string
          nome: string
        }
        Insert: {
          sigla: string
          nome: string
        }
        Update: {
          sigla?: string
          nome?: string
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          id: string
          empresa_id: string
          sigla: string
          nome: string
          grandeza: string
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          situacao: string
          ativo: boolean | null
        }
        Insert: {
          id?: string
          empresa_id: string
          sigla: string
          nome: string
          grandeza: string
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Update: {
          id?: string
          empresa_id?: string
          sigla?: string
          nome?: string
          grandeza?: string
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          situacao?: string
          ativo?: boolean | null
        }
        Relationships: []
      }
      usuario_perfis: {
        Row: {
          usuario_id: string
          perfil_id: string
        }
        Insert: {
          usuario_id: string
          perfil_id: string
        }
        Update: {
          usuario_id?: string
          perfil_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          email: string
          ativo: boolean
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          senha_a_trocar: boolean
          senha_alterada_em: string | null
          bloqueado_ate: string | null
          valida_de: string | null
          valida_ate: string | null
        }
        Insert: {
          id: string
          empresa_id: string
          nome: string
          email: string
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          senha_a_trocar?: boolean
          senha_alterada_em?: string | null
          bloqueado_ate?: string | null
          valida_de?: string | null
          valida_ate?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nome?: string
          email?: string
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          senha_a_trocar?: boolean
          senha_alterada_em?: string | null
          bloqueado_ate?: string | null
          valida_de?: string | null
          valida_ate?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      aceitar_convite: { Args: { p_token: string }; Returns: string }
      alterar_cadastro: { Args: { p_tabela: string; p_id: string; p_valores: Json; p_motivo: string }; Returns: undefined }
      alterar_conta_usuario: { Args: { p_usuario_id: string; p_perfil_ids: string[]; p_valida_de: string; p_valida_ate: string; p_motivo: string }; Returns: undefined }
      alterar_politica_seguranca: { Args: { p_alteracoes: Json; p_motivo: string }; Returns: undefined }
      alterar_validade_conta: { Args: { p_usuario_id: string; p_valida_de: string; p_valida_ate: string; p_motivo: string }; Returns: undefined }
      assinar_registro: { Args: { p_tabela: string; p_registro_id: string; p_significado: string; p_motivo: string; p_senha: string }; Returns: { ok: boolean | null; assinatura_id: number | null; mensagem: string | null }[] }
      bloquear_por_tentativas: { Args: { p_email: string; p_ip?: string; p_navegador?: string }; Returns: boolean }
      buscar_cep: { Args: { p_cep: string }; Returns: { logradouro: string | null; complemento: string | null; uf: string | null; municipio_id: number | null; municipio: string | null; bairro: string | null }[] }
      cancelar_convite: { Args: { p_convite_id: string; p_motivo: string }; Returns: undefined }
      consultar_convite: { Args: { p_token: string }; Returns: { situacao: string | null; empresa_nome: string | null }[] }
      criar_conta_usuario: { Args: { p_profissional_id: string; p_email: string; p_perfil_ids: string[]; p_valida_de?: string; p_valida_ate?: string }; Returns: { convite_id: string | null; token: string | null; expira_em: string | null }[] }
      criar_convite: { Args: { p_email: string; p_nome: string; p_perfil_id: string }; Returns: { convite_id: string | null; token: string | null; expira_em: string | null }[] }
      criar_minha_empresa: { Args: { p_responsavel_cargo: string; p_responsavel_telefone: string; p_razao_social: string; p_nome_fantasia: string; p_cnpj: string; p_telefone: string; p_email_contato: string; p_cep: string; p_logradouro: string; p_numero: string; p_complemento: string; p_cidade: string; p_uf: string; p_afe: string; p_responsavel_tecnico_nome: string; p_responsavel_tecnico_crf: string }; Returns: string }
      definir_permissao_perfil: { Args: { p_perfil_id: string; p_funcao: string; p_consultar: boolean; p_incluir: boolean; p_alterar: boolean; p_excluir: boolean; p_imprimir: boolean; p_historico: boolean; p_motivo: string }; Returns: undefined }
      definir_situacao_perfil: { Args: { p_perfil_id: string; p_ativo: boolean; p_motivo: string }; Returns: undefined }
      desbloquear_usuario: { Args: { p_usuario_id: string; p_motivo: string }; Returns: undefined }
      efeito_da_ultima_alteracao: { Args: { p_tabela: string; p_id: string }; Returns: { exige_novo_login: boolean | null; proprio: boolean | null; nome: string | null; campos: string[] | null }[] }
      exigir_troca_de_senha: { Args: { p_usuario_id: string; p_motivo: string }; Returns: undefined }
      inativar_usuario: { Args: { p_usuario_id: string; p_motivo: string }; Returns: undefined }
      listar_contas_usuario: { Args: never; Returns: { tipo: string | null; id: string | null; nome: string | null; email: string | null; profissional_id: string | null; cpf: string | null; ativo: boolean | null; situacao: string | null; senha_a_trocar: boolean | null; bloqueado: boolean | null; valida_de: string | null; valida_ate: string | null; na_validade: boolean | null; convite_expira_em: string | null; perfis: Json | null }[] }
      listar_perfis: { Args: { p_incluir_inativos?: boolean }; Returns: { id: string | null; nome: string | null; descricao: string | null; ativo: boolean | null; qtd_usuarios: number | null; qtd_funcoes: number | null }[] }
      listar_profissionais_sem_conta: { Args: never; Returns: { id: string | null; codigo: string | null; nome: string | null; cpf: string | null }[] }
      listar_usuarios: { Args: never; Returns: { id: string | null; nome: string | null; email: string | null; ativo: boolean | null; senha_a_trocar: boolean | null; bloqueado: boolean | null; perfis: Json | null }[] }
      marcar_aviso_lido: { Args: { p_aviso_id: string }; Returns: undefined }
      meu_estado: { Args: never; Returns: { usuario_id: string | null; empresa_id: string | null; nome: string | null; ativo: boolean | null; senha_a_trocar: boolean | null; bloqueado_ate: string | null; situacao_empresa: string | null; teste_ate: string | null; dias_restantes: number | null }[] }
      minha_sessao: { Args: never; Returns: { inatividade_minutos: number | null; aviso_segundos: number | null; renovar_segundos: number | null }[] }
      minhas_permissoes: { Args: never; Returns: { funcao_chave: string | null; consultar: boolean | null; incluir: boolean | null; alterar: boolean | null; excluir: boolean | null; imprimir: boolean | null; consultar_historico: boolean | null }[] }
      mudar_situacao: { Args: { p_tabela: string; p_id: string; p_situacao: string; p_motivo: string }; Returns: undefined }
      mudar_situacao_cadastro: { Args: { p_tabela: string; p_id: string; p_ativo: boolean; p_motivo: string }; Returns: undefined }
      proximo_passo: { Args: never; Returns: { proximo: string | null; nome: string | null; situacao_empresa: string | null; dias_restantes: number | null }[] }
      reativar_usuario: { Args: { p_usuario_id: string; p_motivo: string }; Returns: undefined }
      registrar_acesso: { Args: { p_email: string; p_evento: string; p_resultado: string; p_ip?: string; p_navegador?: string; p_detalhe?: string }; Returns: number }
      registrar_atividade: { Args: never; Returns: undefined }
      registrar_troca_de_senha: { Args: { p_usuario_id: string; p_ip?: string; p_navegador?: string }; Returns: undefined }
      salvar_profissional: { Args: { p_id: string; p_dados: Json; p_ocupacoes: string[]; p_funcoes: string[]; p_principal: string; p_motivo: string }; Returns: string }
      trocar_perfil_usuario: { Args: { p_usuario_id: string; p_perfil_ids: string[]; p_motivo: string }; Returns: undefined }
      usos_cadastro: { Args: { p_tabela: string; p_id: string }; Returns: number }
      usos_cadastros: { Args: { p_tabela: string; p_ids: string[] }; Returns: { registro_id: string | null; usos: number | null }[] }
      vinculos_do_usuario: { Args: { p_usuario_id: string }; Returns: { perfil_id: string | null; nome: string | null; perfil_ativo: boolean | null }[] }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tabelas = Database['ilab']['Tables'];
export type Funcoes = Database['ilab']['Functions'];
