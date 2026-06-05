---
name: evolution-go
description: >
  Integração com Evolution Go (v3) — a versão em Go da Evolution API.
  Use esta skill sempre que o usuário quiser criar instâncias WhatsApp,
  conectar via QR code, enviar mensagens (texto, mídia, interativas),
  configurar webhooks ou gerenciar instâncias usando a Evolution Go v0.7+.
  Triggers: "evolution go", "evolution api v3", "evo go", "criar instância
  whatsapp", "conectar whatsapp evolution", "enviar mensagem evolution",
  "qr code evolution", "webhook evolution go".
---

# Evolution Go (v3) — Skill de Integração

Evolution Go é a versão de alta performance da Evolution API escrita em **Go**, usando **whatsmeow** como biblioteca de protocolo WhatsApp. Versão atual: `v0.7.1`.

- GitHub: https://github.com/evolution-foundation/evolution-go
- Docker Hub: `evoapicloud/evolution-go`
- Swagger: `http://localhost:8080/swagger/index.html`

---

## Autenticação

Todas as requisições exigem o header:

```
apikey: <GLOBAL_API_KEY>
```

Configurada no `.env` como `GLOBAL_API_KEY=sua-chave-aqui`.

---

## Configuração (.env)

```env
# Servidor
SERVER_PORT=8080
CLIENT_NAME=evolution

# Segurança
GLOBAL_API_KEY=sua-chave-segura-aqui

# Banco de dados (obrigatório)
POSTGRES_AUTH_DB=postgresql://postgres:senha@localhost:5432/evogo_auth?sslmode=disable
POSTGRES_USERS_DB=postgresql://postgres:senha@localhost:5432/evogo_users?sslmode=disable
DATABASE_SAVE_MESSAGES=false

# Logging
WADEBUG=INFO
LOGTYPE=console

# Opcional — eventos
# AMQP_URL=amqp://guest:guest@localhost:5672/
# NATS_URL=nats://localhost:4222
# WEBHOOK_URL=https://seu-servidor.com/webhook
# WEBHOOK_FILES=true

# Opcional — storage de mídia
# MINIO_ENABLED=true
# MINIO_ENDPOINT=localhost:9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin

# Opcional — controle de QR
# QRCODE_MAX_COUNT=5

# Opcional — proxy
# PROXY_PROTOCOL=socks5
```

---

## Ativação de Licença (obrigatório no primeiro uso)

A Evolution Go requer licença antes de aceitar requisições (retorna `503` até ativar).

1. Suba o servidor
2. Acesse `http://localhost:8080/manager/login`
3. Informe a URL da API e o `GLOBAL_API_KEY`
4. Conclua o fluxo de registro
5. A licença persiste na tabela `runtime_configs` do banco

---

## Fluxo completo: Criar instância → Conectar → Enviar

### 1. Criar instância

```http
POST /instance/create
apikey: <API_KEY>
Content-Type: application/json

{
  "instanceName": "minha-instancia",
  "webhook": {
    "url": "https://meu-servidor.com/webhook",
    "events": ["MESSAGE", "SEND_MESSAGE", "CONNECTION_UPDATE"]
  },
  "settings": {
    "rejectCall": false,
    "msgRejectCall": "Não posso atender agora.",
    "readMessages": false,
    "ignoreGroups": false,
    "ignoreStatus": false
  }
}
```

**Resposta:**
```json
{
  "instance": {
    "instanceName": "minha-instancia",
    "status": "created"
  }
}
```

---

### 2. Obter QR Code para parear

```http
GET /instance/{instanceName}/qrcode
apikey: <API_KEY>
```

Retorna uma imagem PNG ou base64 do QR code. Escaneie com o WhatsApp do celular (Dispositivos Vinculados).

> **Importante:** O servidor gera até `QRCODE_MAX_COUNT` QR codes antes de timeout. Se expirar, chame `/instance/{instanceName}/restart` e repita.

---

### 3. Verificar status da instância

```http
GET /instance/{instanceName}/status
apikey: <API_KEY>
```

**Estados possíveis:**
- `open` — conectado e pronto
- `connecting` — aguardando QR
- `close` — desconectado

---

### 4. Reconectar instância

```http
POST /instance/{instanceName}/restart
apikey: <API_KEY>
```

---

### 5. Deletar instância

```http
DELETE /instance/{instanceName}
apikey: <API_KEY>
```

---

## Envio de Mensagens

> **Formato do número:** sempre `{DDI}{DDD}{NÚMERO}@s.whatsapp.net`
> Exemplo: `5511999887766@s.whatsapp.net`
> Para grupos: `{grupo-id}@g.us`

### Texto simples

```http
POST /send/text
apikey: <API_KEY>
Content-Type: application/json

{
  "number": "5511999887766@s.whatsapp.net",
  "text": "Olá! Mensagem via Evolution Go.",
  "instanceName": "minha-instancia"
}
```

---

### Mídia (imagem, vídeo, áudio, documento)

```http
POST /send/media
apikey: <API_KEY>
Content-Type: application/json

{
  "number": "5511999887766@s.whatsapp.net",
  "instanceName": "minha-instancia",
  "mediatype": "image",
  "url": "https://exemplo.com/imagem.jpg",
  "caption": "Legenda da imagem"
}
```

Valores de `mediatype`: `image`, `video`, `audio`, `document`

> O campo `url` também aceita **base64**. Se não começar com `http://` ou `https://`, é tratado como base64 automaticamente.

---

### Mensagem com botões (v0.7+)

```http
POST /send/button
apikey: <API_KEY>
Content-Type: application/json

{
  "number": "5511999887766@s.whatsapp.net",
  "instanceName": "minha-instancia",
  "title": "Escolha uma opção",
  "footer": "Rodapé da mensagem",
  "buttons": [
    { "buttonId": "1", "buttonText": { "displayText": "Opção 1" } },
    { "buttonId": "2", "buttonText": { "displayText": "Opção 2" } }
  ]
}
```

---

### Lista interativa

```http
POST /send/list
apikey: <API_KEY>
Content-Type: application/json

{
  "number": "5511999887766@s.whatsapp.net",
  "instanceName": "minha-instancia",
  "title": "Cardápio",
  "description": "Escolha um item",
  "buttonText": "Ver opções",
  "sections": [
    {
      "title": "Bebidas",
      "rows": [
        { "rowId": "cafe", "title": "Café", "description": "Café expresso" },
        { "rowId": "suco", "title": "Suco", "description": "Suco natural" }
      ]
    }
  ]
}
```

---

### Carrossel (v0.7+)

```http
POST /send/carousel
apikey: <API_KEY>
Content-Type: application/json

{
  "number": "5511999887766@s.whatsapp.net",
  "instanceName": "minha-instancia",
  "cards": [
    {
      "image": "https://exemplo.com/produto1.jpg",
      "text": "Produto 1",
      "footer": "R$ 29,90",
      "buttons": [
        { "buttonId": "comprar-1", "buttonText": { "displayText": "Comprar" } }
      ]
    }
  ]
}
```

> Thumbnails JPEG são gerados automaticamente para carregamento instantâneo.

---

### Status (Stories) — v0.7+

```http
# Status de texto
POST /send/status/text
apikey: <API_KEY>
Content-Type: application/json

{ "instanceName": "minha-instancia", "text": "Olá mundo!" }

# Status de mídia
POST /send/status/media
apikey: <API_KEY>
Content-Type: application/json

{ "instanceName": "minha-instancia", "url": "https://exemplo.com/foto.jpg" }
```

---

### Editar mensagem enviada

```http
POST /message/edit
apikey: <API_KEY>
Content-Type: application/json

{
  "instanceName": "minha-instancia",
  "key": {
    "remoteJid": "5511999887766@s.whatsapp.net",
    "id": "MESSAGE_ID_AQUI",
    "fromMe": true
  },
  "text": "Mensagem editada"
}
```

---

## Gerenciamento de Instâncias

### Listar todas as instâncias

```http
GET /instance/list
apikey: <API_KEY>
```

### Configurar proxy por instância

```http
POST /instance/proxy/{instanceId}
apikey: <API_KEY>
Content-Type: application/json

{
  "host": "proxy.exemplo.com",
  "port": "1080",
  "protocol": "socks5",
  "username": "user",
  "password": "senha"
}
```

Valores de `protocol`: `http`, `https`, `socks5`

---

## Webhooks

### Eventos disponíveis

| Evento | Descrição |
|---|---|
| `MESSAGE` | Mensagem recebida |
| `SEND_MESSAGE` | Mensagem enviada |
| `CONNECTION_UPDATE` | Mudança de status da conexão |
| `READ_RECEIPT` | Confirmação de leitura |
| `GROUP` | Eventos de grupos (fallback) |
| `NEWSLETTER` | Eventos de newsletters (fallback) |

> **Roteamento de grupos/newsletters:** quando `MESSAGE`/`SEND_MESSAGE`/`READ_RECEIPT` não estão subscritos, eventos de grupos (`@g.us`) vão para `GROUP` e newsletters para `NEWSLETTER`.

### Configurar webhook via API

```http
POST /webhook/set/{instanceName}
apikey: <API_KEY>
Content-Type: application/json

{
  "url": "https://meu-servidor.com/webhook",
  "events": ["MESSAGE", "CONNECTION_UPDATE"],
  "webhookByEvents": false
}
```

---

## Configurações avançadas da instância

```http
POST /settings/set/{instanceName}
apikey: <API_KEY>
Content-Type: application/json

{
  "rejectCall": true,
  "msgRejectCall": "Não posso atender, me mande uma mensagem!",
  "readMessages": true,
  "ignoreGroups": false,
  "ignoreStatus": true
}
```

---

## Verificar número no WhatsApp

```http
POST /user/check/{instanceName}
apikey: <API_KEY>
Content-Type: application/json

{
  "numbers": ["5511999887766"]
}
```

> A partir da v0.5.2, há fallback automático de `formatJid` para melhor detecção.

---

## Docker Compose (produção)

```yaml
version: '3.8'
services:
  evolution-go:
    image: evoapicloud/evolution-go:0.7.1
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: senha
      POSTGRES_USER: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Pontos de atenção v3 vs v2

| Aspecto | v2 (Node.js) | v3 / Evolution Go |
|---|---|---|
| Endpoints de envio | `/message/sendText/{instance}` | `/send/text` + `instanceName` no body |
| Listas/Botões | Suportados | Suportados (v0.7+, multi-plataforma) |
| Chatbots nativos | 7 integrações | Não incluídos (usar webhooks) |
| Chatwoot | Nativo | Separado |
| Storage S3 | Built-in | MinIO opcional |
| Performance | Moderada | Alta (Go) |

---

## Erros comuns

| Código | Causa | Solução |
|---|---|---|
| `503` | Licença não ativada | Ativar via `/manager/login` |
| `401` | `apikey` inválida ou ausente | Verificar header `apikey` |
| `404` | Instância não encontrada | Verificar `instanceName` |
| QR expirado | `QRCODE_MAX_COUNT` atingido | Chamar `/restart` e escanear novamente |
| Proxy não funciona | Protocolo errado | Definir `PROXY_PROTOCOL` no `.env` |
