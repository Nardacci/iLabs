/**
 * Endereço completo de uma tela do app, respeitando a pasta em que o site está publicado
 * (no GitHub Pages é /iLabs/, em desenvolvimento é /). Usado nos links que vão por e-mail
 * (redefinir senha, convite, confirmação): se o endereço não estiver na lista de endereços
 * permitidos do Supabase, ele ignora o pedido e manda a pessoa para outro lugar.
 */
export function urlDoApp(caminho: string, base: string = document.baseURI): string {
  return new URL(caminho.replace(/^\/+/, ''), base).href;
}
