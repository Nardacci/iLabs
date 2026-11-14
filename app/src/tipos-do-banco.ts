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
      kb_documento_versoes: {
        Row: {
          id: string
          empresa_id: string
          documento_id: string
          numero: number
          arquivo_caminho: string
          nome_original: string
          tipo_arquivo: string
          tamanho_bytes: number
          checksum: string
          criado_em: string
          criado_por: string | null
          fonte_ref: string | null
        }
        Insert: {
          id: string
          empresa_id: string
          documento_id: string
          numero: number
          arquivo_caminho: string
          nome_original: string
          tipo_arquivo: string
          tamanho_bytes: number
          checksum: string
          criado_em?: string
          criado_por?: string | null
          fonte_ref?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          documento_id?: string
          numero?: number
          arquivo_caminho?: string
          nome_original?: string
          tipo_arquivo?: string
          tamanho_bytes?: number
          checksum?: string
          criado_em?: string
          criado_por?: string | null
          fonte_ref?: string | null
        }
        Relationships: []
      }
      kb_documentos: {
        Row: {
          id: string
          empresa_id: string
          titulo: string
          legenda: string | null
          tipo: string
          origem: string
          confidencialidade: string
          data_fonte: string | null
          identificacao_oficial: string | null
          consultado_em: string | null
          situacao_lida: string | null
          situacao: string
          ativo: boolean | null
          criado_em: string
          criado_por: string | null
          atualizado_em: string | null
          atualizado_por: string | null
          fonte_id: string | null
          fonte_caminho: string | null
          sumiu_da_fonte_em: string | null
        }
        Insert: {
          id: string
          empresa_id: string
          titulo: string
          legenda?: string | null
          tipo: string
          origem: string
          confidencialidade: string
          data_fonte?: string | null
          identificacao_oficial?: string | null
          consultado_em?: string | null
          situacao_lida?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          fonte_id?: string | null
          fonte_caminho?: string | null
          sumiu_da_fonte_em?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          titulo?: string
          legenda?: string | null
          tipo?: string
          origem?: string
          confidencialidade?: string
          data_fonte?: string | null
          identificacao_oficial?: string | null
          consultado_em?: string | null
          situacao_lida?: string | null
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
          fonte_id?: string | null
          fonte_caminho?: string | null
          sumiu_da_fonte_em?: string | null
        }
        Relationships: []
      }
      kb_fontes: {
        Row: {
          id: string
          empresa_id: string
          nome: string
          origem: string
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
          nome: string
          origem: string
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
          nome?: string
          origem?: string
          situacao?: string
          ativo?: boolean | null
          criado_em?: string
          criado_por?: string | null
          atualizado_em?: string | null
          atualizado_por?: string | null
        }
        Relationships: []
      }
      kb_processamento: {
        Row: {
          versao_id: string
          empresa_id: string
          documento_id: string
          estado: string
          tentativas: number
          trechos: number
          erro: string | null
          atualizado_em: string
        }
        Insert: {
          versao_id: string
          empresa_id: string
          documento_id: string
          estado?: string
          tentativas?: number
          trechos?: number
          erro?: string | null
          atualizado_em?: string
        }
        Update: {
          versao_id?: string
          empresa_id?: string
          documento_id?: string
          estado?: string
          tentativas?: number
          trechos?: number
          erro?: string | null
          atualizado_em?: string
        }
        Relationships: []
      }
      kb_trechos: {
        Row: {
          id: string
          empresa_id: string
          documento_id: string
          versao_id: string
          ordem: number
          secao: string | null
          pagina: number | null
          texto: string
          versao_atual: boolean
          busca: unknown | null
          criado_em: string
        }
        Insert: {
          id?: string
          empresa_id: string
          documento_id: string
          versao_id: string
          ordem: number
          secao?: string | null
          pagina?: number | null
          texto: string
          versao_atual?: boolean
          busca?: unknown | null
          criado_em?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          documento_id?: string
          versao_id?: string
          ordem?: number
          secao?: string | null
          pagina?: number | null
          texto?: string
          versao_atual?: boolean
          busca?: unknown | null
          criado_em?: string
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
      kb_arquivo_ja_existe: { Args: { p_checksum: string }; Returns: { documento_id: string | null; titulo: string | null; numero: number | null }[] }
      kb_buscar: { Args: { p_consulta: string; p_tipos?: string[]; p_fonte_id?: string; p_limite?: number }; Returns: { trecho_id: string | null; documento_id: string | null; versao_id: string | null; versao_numero: number | null; titulo: string | null; tipo: string | null; origem: string | null; fonte_nome: string | null; caminho: string | null; secao: string | null; pagina: number | null; trecho: string | null; relevancia: number | null; repetido_em: number | null }[] }
      kb_criar_documento: { Args: { p_documento_id: string; p_versao_id: string; p_titulo: string; p_legenda: string; p_tipo: string; p_origem: string; p_confidencialidade: string; p_data_fonte: string; p_identificacao: string; p_consultado_em: string; p_situacao_lida: string; p_caminho: string; p_nome_original: string; p_tipo_arquivo: string; p_tamanho: number; p_checksum: string }; Returns: string }
      kb_criar_fonte: { Args: { p_empresa_id: string; p_nome: string; p_origem: string }; Returns: string }
      kb_gravar_trechos: { Args: { p_empresa_id: string; p_versao_id: string; p_trechos: Json }; Returns: number }
      kb_importacao_estado: { Args: { p_empresa_id: string }; Returns: { documento_id: string | null; fonte_id: string | null; fonte_caminho: string | null; situacao: string | null; numero: number | null; checksum: string | null }[] }
      kb_importar_documento: { Args: { p_empresa_id: string; p_fonte_id: string; p_fonte_caminho: string; p_fonte_ref: string; p_documento_id: string; p_versao_id: string; p_titulo: string; p_tipo: string; p_confidencialidade: string; p_arquivo_caminho: string; p_nome_original: string; p_tipo_arquivo: string; p_tamanho: number; p_checksum: string }; Returns: string }
      kb_marcar_processamento: { Args: { p_empresa_id: string; p_versao_id: string; p_estado: string; p_erro?: string }; Returns: undefined }
      kb_marcar_sumidos: { Args: { p_empresa_id: string; p_fonte_id: string; p_caminhos_presentes: string[] }; Returns: number }
      kb_nova_versao: { Args: { p_documento_id: string; p_versao_id: string; p_caminho: string; p_nome_original: string; p_tipo_arquivo: string; p_tamanho: number; p_checksum: string; p_motivo: string }; Returns: number }
      kb_versoes_pendentes: { Args: { p_empresa_id: string; p_limite?: number }; Returns: { versao_id: string | null; documento_id: string | null }[] }
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
