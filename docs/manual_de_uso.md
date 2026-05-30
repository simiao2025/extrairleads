# Manual de Uso Básico - ExtrairLeads

Bem-vindo ao **ExtrairLeads**, a sua plataforma neural de prospecção B2B. Este manual foi atualizado para detalhar todas as funcionalidades da interface web, explicando o que cada botão faz, as áreas do painel e as configurações globais.

---

## 1. Menus de Navegação (Barra Lateral)

No lado esquerdo (ou no rodapé em dispositivos móveis), você encontrará a barra de navegação principal. 

*   **Dashboard (Painel Principal):** Sua central de comando. Mostra as estatísticas gerais de conversão, o radar para nova extração de dados, atalhos de disparo e o funil visual em formato Kanban.
*   **Leads:** Onde fica a sua base completa de contatos extraídos. É uma tabela massiva onde você pode visualizar os detalhes de cada empresa de forma crua.
*   **Campanhas:** Permite criar pastas organizadas. Cada campanha pode agrupar uma busca específica (ex: "Clínicas de Estética em SP - Junho") e automatizar o tempo de disparo (Auto-Outreach).
*   **Agendamentos:** Um calendário dedicado para gerenciar reuniões ou ligações agendadas com leads que passaram pelo funil e demonstraram interesse.
*   **Agentes IA:** Central de inteligência onde você cadastra sua **Base de Conhecimento** (o que sua empresa vende, como vender e qual o preço) e edita os **Prompts** (a "personalidade" do robô) que respondem os clientes.
*   **Configurações:** Onde você conecta o WhatsApp, define as chaves da OpenAI/Groq e verifica seu limite de uso e plano atual.

---

## 2. Dashboard: O Coração do Sistema

O Dashboard foi projetado como um "Motor Neural" para velocidade. Eis os principais componentes da tela inicial:

### 2.1. Estatísticas Rápidas (Cards Superiores)
Mostram a saúde da sua operação em tempo real:
*   **Leads Totais:** Volume total de empresas extraídas do Google Maps.
*   **Qualificados IA:** Quantidade de leads que o robô leu o site e considerou ser um perfil ideal de cliente.
*   **Msgs Enviadas:** Quantos leads já receberam o contato inicial via WhatsApp.
*   **Interessados:** A métrica mais importante — quantos responderam positivamente à abordagem.

### 2.2. Radar de Extração (Search Form)
O campo de busca luminoso no centro da tela.
*   **O que faz:** Ao digitar um segmento e localização (Ex: "Contabilidades em Brasília") e apertar **Buscar**, o ExtrairLeads vai varrer o Google Maps em tempo real e baixar os dados públicos (Telefone, Site, Endereço, Nome) diretamente para o funil "Novos".
*   **Filtro Inteligente:** O sistema possui proteção automática de saldo. Leads duplicados ou empresas **sem número de telefone cadastrado no Google** são ignorados instantaneamente, garantindo que você pague apenas por contatos válidos para prospecção.
*   **Dica:** Sempre selecione uma Campanha no botão suspensivo acima dele antes de buscar, para não misturar leads de segmentos diferentes.

### 2.3. Os Botões de Ação (Aceleradores)
Logo abaixo do título "Extrair, Qualificar & Vender", existem 3 botões poderosos para uso em massa:

1.  **🔍 Analisar Pendentes (Qualificação):** 
    *   **Função:** Pega os leads da coluna "Novos" e envia para a Inteligência Artificial analisar. A IA cruza dados do site, avaliações do Google Maps e presença digital.
    *   **Nova Inteligência (Score):** A IA agora detecta se o lead já possui site sofisticado, links de agendamento online (Booksy, Calendly) e busca ativamente por reclamações de "robô ruim" ou "demora no WhatsApp" nas avaliações do Google, elevando o score de oportunidade caso o cliente esteja insatisfeito com sua automação atual.
2.  **💬 Disparo Frio (Outreach):** 
    *   **Função:** Inicia a prospecção ativa. Pega os leads "Qualificados" e dispara a mensagem de introdução pelo seu WhatsApp conectado, de forma automática e hiperpersonalizada.
3.  **🔄 Follow-up:** 
    *   **Função:** Varre os leads que já foram contatados, mas não responderam após certo tempo, enviando uma segunda mensagem de acompanhamento ("Tudo bem? Chegou a ver a mensagem anterior?").

### 2.4. Funil Inteligente (Kanban Board)
Na base da tela, você verá o seu funil no formato de colunas.
*   **Colunas:** `Novos` > `Qualificados` > `Contatados` > `Interessados` > `Intervenção`
*   **Funcionalidade:** Você pode usar o mouse (ou 2 dedos no trackpad/toque celular) para **Arrastar e Soltar** o card do lead entre as colunas.
*   **Automação:** Sempre que a Inteligência Artificial enviar mensagens com sucesso, ela moverá o card automaticamente pelo painel. Se um lead fizer uma pergunta que a IA não saiba responder, ele será jogado para a coluna de **Intervenção**, exigindo que um humano entre no chat.

---

## 3. Configurações Globais (Settings e Onboarding)

Para que as automações e os disparos aconteçam perfeitamente, você deve completar a fundação do sistema:

### 3.1. Conectando o WhatsApp (Evolution API)
O ExtrairLeads possui uma infraestrutura dedicada de WhatsApp.
*   Vá em **Configurações > WhatsApp**.
*   Se for o seu primeiro acesso, o sistema exigirá o preenchimento de segurança do seu **CPF ou CNPJ**. O número da sua instância de envio fica bloqueado na Evolution API sem esse dado.
*   Após o CPF, o sistema vai gerar um **QR Code**. Aponte a câmera do WhatsApp do celular que fará os disparos (WhatsApp Business recomendado).

### 3.2. Créditos e Planos
*   Cada Lead extraído consome 1 crédito.
*   No canto esquerdo inferior, você pode observar uma **barra verde progressiva** com o seu limite atual (Ex: *340 leads restantes*). 
*   Se os créditos acabarem, você não conseguirá mais extrair pelo botão de busca. Contate o suporte técnico no ícone `?` para solicitar uma recarga manual de créditos ou upgrade de plano.

### 3.3. Segurança (Deslogar)
Para proteger seus dados sensíveis e sua sessão do WhatsApp, clique sobre a sua foto/letra no rodapé inferior esquerdo do menu e clique no ícone vermelho de "Sair" (LogOut).

---

> **Dica de Ouro:** Não faça varreduras aleatórias e extensas. Sempre planeje suas **Campanhas**, treine muito bem os seus **Agentes IA** na Base de Conhecimento e deixe o motor trabalhar em lotes menores para garantir um alto nível de agendamentos reais sem ser marcado como Spam.
