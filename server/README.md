# Mandy Bridge

Local bridge for external task capture.

## Run

```bash
npm run bridge
```

The bridge listens on `http://127.0.0.1:8787`.

## Smart Capture API

```bash
curl -X POST http://127.0.0.1:8787/api/bridge/capture \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"מחר לקנות חלב לילדים, שנינו, בינוני\",\"source\":\"api\"}"
```

The React app polls `/api/bridge/inbox`, parses the text with the same smart Hebrew task logic, adds it to the board, and acknowledges the capture.

## WhatsApp Cloud API

Use a public HTTPS URL that forwards to the local bridge, for example with a tunnel during development. Configure the Meta WhatsApp webhook URL:

```text
https://YOUR-PUBLIC-URL/webhooks/whatsapp
```

Required environment variables:

```bash
WHATSAPP_VERIFY_TOKEN=choose-a-secret-token
WHATSAPP_ACCESS_TOKEN=meta-cloud-api-access-token
WHATSAPP_PHONE_NUMBER_ID=meta-phone-number-id
WHATSAPP_GRAPH_VERSION=v24.0
MANDY_BRIDGE_PORT=8787
```

The webhook verification endpoint reads Meta's `hub.mode`, `hub.verify_token`, and `hub.challenge` query parameters. Incoming text messages are added to the bridge inbox. If `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set, the bridge also replies with a short confirmation.
