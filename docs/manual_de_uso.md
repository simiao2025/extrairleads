# Manual de Uso - ExtrairLeads

Bem-vindo ao **ExtrairLeads**, o seu motor neural de prospecção B2B. Este manual detalha todas as funcionalidades da plataforma, desde a configuração inicial até a operação diária das campanhas automáticas.

---

## 1. Configurações Iniciais (Settings)

Antes de iniciar a prospecção, é essencial conectar seus serviços e o WhatsApp.

### 1.1. Conexão do WhatsApp (Evolution API)
- Vá até a página de **Configurações**.
- Clique na aba **Conexão WhatsApp**.
- Escaneie o **QR Code** com o celular que será utilizado para enviar as mensagens aos leads.
- Aguarde o status mudar para **"Conectado"**.

### 1.2. Integrações de IA (LLMs)
O sistema utiliza IA para gerar e analisar mensagens.
- Na aba **Provedores de IA**, insira suas chaves de API (OpenAI, Groq, Anthropic).
- Selecione o modelo padrão desejado para o motor de resposta inteligente.

---

## 2. Base de Conhecimento (Knowledge)

Para que a inteligência artificial responda como um vendedor especialista da sua empresa, ela precisa aprender sobre o seu negócio.

- Navegue até a aba **Base de Conhecimento**.
- Insira informações detalhadas sobre a sua empresa: O que vocês vendem? Qual o preço? Quais os diferenciais? Como responder a objeções comuns?
- A IA usará esses textos para **criar mensagens contextuais (RAG)** e contornar objeções automaticamente ao interagir com o lead.

---

## 3. Gestão de Prompts (Agents)

Os Prompts são as "personalidades" e roteiros do seu agente neural.

- Em **Agentes / Prompts**, você pode configurar mensagens padronizadas.
- Exemplo: Crie um prompt de "Primeiro Contato (Cold Outreach)" e outro para "Follow-up (Acompanhamento)".
- Utilize variáveis como `{{nome}}`, `{{empresa}}` para tornar as mensagens hiperpersonalizadas.

---

## 4. Captura e Gestão de Leads

O coração do sistema é o módulo de Leads.

### 4.1. Busca no Google Maps (Scraping)
- No painel de **Leads**, clique no botão para **Buscar no Maps**.
- Digite o termo desejado (Ex: "Clínicas Odontológicas em São Paulo").
- O sistema fará a varredura e extrairá nome, telefone, site e endereço.
- Os leads extraídos cairão automaticamente no seu banco de dados na etapa "Pendente".

### 4.2. Kanban (Funil de Vendas)
- Os leads capturados podem ser movidos livremente através do formato Kanban (arrastar e soltar).
- Estágios comuns: *Pendente, Qualificado, Contatado, Em Negociação, Fechado.*

### 4.3. Qualificação e Abordagem
- **Qualificar (Robô):** O sistema pode varrer o site do lead para validar se ele é um bom cliente potencial.
- **Iniciar Contato (Outreach):** Envia a primeira mensagem no WhatsApp do lead através da conexão da Evolution API, utilizando a IA para formular a abordagem ideal.

---

## 5. Campanhas Automáticas (Campaigns)

Se você precisa abordar centenas de leads, utilize o módulo de Campanhas.

- Crie uma nova Campanha e defina os horários de envio.
- Selecione a lista de leads ou um segmento específico.
- A campanha rodará em segundo plano, disparando mensagens de tempo em tempo (respeitando os limites do WhatsApp para evitar bloqueios / banimentos).

---

## 6. Agendamentos (Appointments)

Quando um lead avança no funil e demonstra interesse, você pode marcar uma reunião.

- Acesse o módulo de **Agendamentos** ou abra a ficha do Lead.
- Insira a data e hora da reunião (Call / Presencial).
- O sistema manterá o controle de reuniões futuras para que seu time de vendas não perca nenhum compromisso.

---

## 7. Chat e Histórico

Toda interação no WhatsApp com o lead é espelhada no sistema.
- Clicando no perfil de um Lead, você verá a aba **Chat**.
- Acompanhe o histórico de mensagens enviadas e recebidas.
- A IA sugere respostas baseadas na Base de Conhecimento, que você pode aprovar com um clique.

---

## Dicas de Segurança e Boas Práticas

- **Limite de Envios:** Ao rodar Campanhas, comece com envios espaçados para amadurecer o número do WhatsApp ("aquecimento de chip").
- **Monitoramento:** Acompanhe o Dashboard Analytics na Home para verificar sua taxa de qualificação e conversão diária.
- **Segurança da Conta:** Mantenha sua senha segura. Se esquecer, utilize o botão "Esqueceu a senha?" na tela de Login para redefini-la via e-mail corporativo.

> Desenvolvido com tecnologia de ponta para automatizar sua prospecção B2B de ponta a ponta.
