// ──────────────────────────────────────────────────────────
// TEXTOS PADRÃO DAS PÁGINAS INSTITUCIONAIS (links do rodapé)
// Valem enquanto o admin não salvar outro texto em /conteudos.
// Formato simples, renderizado pelo frontend sem HTML:
//   ## Título        → subtítulo
//   - item           → item de lista
//   linha em branco  → novo parágrafo
// ──────────────────────────────────────────────────────────

const EMPRESA = 'BE YOU Maquiagem Ltda. — CNPJ 41.882.613/0001-27'
const ENDERECO = 'Rua Felipe Schmidt, 515, sala 802 — Centro, Florianópolis/SC — CEP 88010-001'
const EMAIL_SAC = 'atendimento@beyoumaquiagem.com.br'
const EMAIL_PRIVACIDADE = 'privacidade@beyoumaquiagem.com.br'
const TELEFONE = '(48) 3209-4150'
const WHATSAPP = '(48) 99120-4150'
const ATUALIZACAO = '1º de outubro de 2026'

const PAGINAS = {
    pagina_sobre: "A BE YOU nasceu em 2026, quando decidi que publicidade e maquiagem podiam andar juntas. Entre propagandas, ideias de conteúdo e testes de diferentes produtos no meu próprio rosto, descobri uma forma de unir criatividade, beleza e expressão pessoal.\n\nDessa experiência surgiu a vontade de criar a minha marca. O nome veio do que eu queria transmitir: *seja você*. Uma maquiagem que valorize quem você é e dê liberdade para experimentar, sem precisar se encaixar em um padrão.\n\nPensei a BE YOU para acolher todos os tipos e tons de pele. No catálogo, você pode usar os filtros para explorar as bases e comparar as tonalidades, buscando aquela que mais combina com você.\n\nA inovação também faz parte dessa ideia. Meu interesse pela nanotecnologia inspira a busca por fórmulas que unam maquiagem e cuidado, com atenção às diferentes necessidades da pele, incluindo a pele com tendência à acne e às manchas.\n\nA história da BE YOU está apenas começando. Quero que cada produto, cada propaganda e cada descoberta carreguem a mesma mensagem: a sua beleza tem identidade. Seja você.",

    pagina_trocas: `Queremos que você ame cada produto. Se algo não saiu como esperado, a troca é simples e sem custo dentro das condições abaixo.

## Direito de arrependimento (7 dias)
Conforme o artigo 49 do Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias corridos após o recebimento. O produto deve estar lacrado, sem sinais de uso e na embalagem original. Devolvemos 100% do valor pago, incluindo o frete.

## Troca grátis em 30 dias
Produtos lacrados podem ser trocados por outro item ou tonalidade em até 30 dias corridos após o recebimento. O frete de envio e de reenvio é por nossa conta.

## Produto com defeito
Se o produto apresentar defeito (embalagem danificada, vazamento, aplicador quebrado, alteração de cor, cheiro ou textura), entre em contato em até 30 dias após o recebimento, como prevê o artigo 26 do CDC para produtos não duráveis. Nesse caso, a troca vale também para itens abertos.

## Itens que não podem ser trocados
Por questões de higiene e segurança, não aceitamos troca ou devolução de produtos abertos ou usados, exceto em caso de defeito.

## Como solicitar
- Envie um e-mail para ${EMAIL_SAC} com o número do pedido, o produto e o motivo.
- Em até 2 dias úteis enviamos o código de postagem reversa dos Correios.
- Leve o produto embalado a qualquer agência dos Correios, sem custo.
- Após recebermos e analisarmos o item (até 5 dias úteis), enviamos o novo produto ou fazemos o reembolso.

## Reembolso
- PIX e boleto: depósito na conta do titular do pedido em até 5 dias úteis.
- Cartão de crédito: estorno solicitado em até 5 dias úteis; o crédito aparece em até 2 faturas, conforme a administradora.
- Cartão de débito: estorno em até 10 dias úteis, conforme o banco.`,

    pagina_entrega: `Enviamos para todo o Brasil a partir do nosso centro de distribuição em Florianópolis/SC, pelos Correios e por transportadoras parceiras.

## Frete
- Frete grátis em compras a partir de R$ 150,00.
- Abaixo desse valor, frete fixo de R$ 15,90 para qualquer região.

## Prazos
O prazo começa a contar após a confirmação do pagamento. A data estimada de entrega aparece no resumo do pedido e em "Meus pedidos", e normalmente é de até 7 dias corridos.
- PIX e cartão: pagamento confirmado em poucos minutos.
- Boleto: confirmação em até 2 dias úteis após o pagamento.
- Pedidos confirmados até as 14h de dias úteis são despachados no mesmo dia.

Feriados, greves e regiões de difícil acesso podem aumentar o prazo. Se isso acontecer, avisamos por e-mail.

## Acompanhe seu pedido
Assim que o pedido for despachado, o código de rastreio aparece em "Meus pedidos", junto com o status da entrega: em trânsito, saiu para entrega ou entregue.

## Ausência no endereço
Os Correios fazem até 3 tentativas de entrega. Depois disso, o pacote fica disponível para retirada na agência mais próxima por 7 dias. Se não for retirado, ele volta para nós e entramos em contato para combinar um novo envio.

## Endereço de entrega
Confira o CEP, o número e o complemento antes de finalizar. Depois que o pedido é despachado, não é possível alterar o endereço.`,

    pagina_pagamento: `Todas as transações da BE YOU são processadas em ambiente seguro, com criptografia. Não armazenamos os dados do seu cartão.

## PIX
- Aprovação em poucos minutos, 24 horas por dia.
- O código PIX vale por 30 minutos; depois disso o pedido é cancelado automaticamente.

## Cartão de crédito
- Bandeiras aceitas: Visa, Mastercard, Elo, American Express e Hipercard.
- Parcelamento em até 3x sem juros em todo o site, com parcela mínima de R$ 20,00.
- A aprovação depende da administradora do cartão e costuma levar poucos minutos.

## Cartão de débito
- Débito on-line das bandeiras Visa e Mastercard, com autenticação do seu banco.

## Boleto bancário
- Vencimento em 3 dias úteis após a emissão.
- A compensação leva até 2 dias úteis; só então o pedido é separado.
- Boletos não pagos até o vencimento cancelam o pedido automaticamente.

## Segurança
Usamos certificado SSL em todas as páginas e análise antifraude em pedidos com cartão. Em alguns casos, nossa equipe pode entrar em contato para confirmar dados antes de liberar o envio.

## Nota fiscal
A nota fiscal eletrônica é enviada para o seu e-mail assim que o pedido é faturado.`,

    pagina_contato: `Nosso time de atendimento está pronto para ajudar com dúvidas sobre produtos, tonalidades, pedidos, trocas e entregas.

## Canais
- E-mail: ${EMAIL_SAC} (resposta em até 1 dia útil)
- WhatsApp: ${WHATSAPP}
- Telefone (SAC): ${TELEFONE}

## Horário de atendimento
- Segunda a sexta, das 9h às 18h.
- Sábados, das 9h às 13h (exceto feriados).

## Antes de falar com a gente
Tenha em mãos o número do pedido (aparece em "Meus pedidos") e, em caso de defeito, uma foto do produto. Isso agiliza muito o atendimento.

## Imprensa e parcerias
Para assessoria de imprensa, parcerias com criadores de conteúdo e vendas corporativas, escreva para contato@beyoumaquiagem.com.br.

## Endereço
${EMPRESA}
${ENDERECO}

Não realizamos atendimento ou venda presencial nesse endereço.`,

    pagina_privacidade: `Última atualização: ${ATUALIZACAO}.

Esta política explica como a ${EMPRESA}, com sede em ${ENDERECO}, coleta, usa e protege seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## Dados que coletamos
- Cadastro: nome, e-mail, CPF, telefone e, opcionalmente, RG.
- Entrega: CEP, endereço, número e complemento informados no checkout.
- Pedidos: produtos comprados, valores, datas e status de entrega.
- Navegação: o carrinho e a sessão de login ficam salvos no armazenamento local do seu próprio navegador.

Não armazenamos o número, a validade ou o código de segurança do seu cartão.

## Para que usamos
- Criar e manter sua conta e autenticar seu acesso.
- Processar pagamentos, emitir nota fiscal e entregar pedidos.
- Prestar atendimento, trocas e devoluções.
- Cumprir obrigações legais e fiscais.
- Enviar novidades e promoções, apenas se você tiver se inscrito na newsletter.

## Compartilhamento
Compartilhamos apenas o necessário com transportadoras (nome e endereço), instituições de pagamento e antifraude, e autoridades quando houver obrigação legal. Não vendemos seus dados.

## Segurança
Senhas são armazenadas de forma criptografada e irreversível. O acesso às informações é restrito à equipe que precisa delas para trabalhar.

## Por quanto tempo guardamos
Mantemos os dados enquanto sua conta estiver ativa e, depois disso, pelo prazo exigido pela legislação fiscal e de defesa do consumidor (em geral, 5 anos após a última compra).

## Seus direitos
Você pode, a qualquer momento, pedir confirmação de tratamento, acesso, correção, anonimização, portabilidade ou exclusão dos seus dados, além de revogar consentimentos. Parte dos dados pode ser corrigida diretamente em "Meu perfil".

## Encarregado de dados (DPO)
Solicitações sobre privacidade: ${EMAIL_PRIVACIDADE}. Respondemos em até 15 dias.`,

    pagina_termos: `Última atualização: ${ATUALIZACAO}.

Estes termos regulam o uso do site e as compras feitas na loja on-line da ${EMPRESA}. Ao navegar ou comprar, você declara que leu e concorda com eles.

## Cadastro
- Para finalizar compras é preciso ter cadastro com dados verdadeiros e um CPF válido.
- O cadastro é pessoal; você é responsável por manter sua senha em sigilo.
- Menores de 18 anos devem comprar com a assistência de um responsável.

## Preços e disponibilidade
- Os preços são em reais e podem mudar sem aviso, mas o valor confirmado no pedido é mantido.
- Todos os pedidos estão sujeitos à disponibilidade em estoque. Um produto só pode ser adicionado à sacola se houver unidades disponíveis.
- Em caso de erro evidente de preço ou de cadastro, podemos cancelar o pedido e devolver integralmente o valor pago.

## Cores e imagens
Fazemos o possível para reproduzir as tonalidades com fidelidade, mas a cor pode variar conforme a tela e a iluminação. As fotos são ilustrativas.

## Pagamento, entrega e trocas
As condições estão descritas nas páginas Formas de pagamento, Prazos de entrega e Trocas e devoluções, que fazem parte destes termos.

## Uso adequado
É proibido usar o site para fins ilícitos, tentar acessar áreas restritas, copiar o conteúdo em massa ou interferir no funcionamento da loja. Contas usadas de forma fraudulenta podem ser bloqueadas.

## Propriedade intelectual
Marca, logotipo, textos, fotos e layout pertencem à BE YOU ou são usados com autorização. A reprodução sem permissão é proibida.

## Alterações
Podemos atualizar estes termos. A versão válida é sempre a publicada nesta página, com a data da última atualização.

## Foro
Fica eleito o foro da comarca de Florianópolis/SC, sem prejuízo do direito do consumidor de propor ação no foro do seu domicílio.`
}

module.exports = PAGINAS
