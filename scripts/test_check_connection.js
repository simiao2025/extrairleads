const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');
const { randomBytes } = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
const sql = neon(databaseUrl);

// Mimic getCurrentUser for Luciana
async function getTargetUser() {
    const [user] = await sql`SELECT * FROM users WHERE email = 'simacjr@hotmail.com'`;
    return user;
}

// Helper to simulate getGlobalKey
function getGlobalKey() {
	const key = process.env.EVOLUTION_GLOBAL_API_KEY;
	if (!key) {
		throw new Error(
			"EVOLUTION_GLOBAL_API_KEY não está configurada no ambiente.",
		);
	}
	return key;
}

function getBaseWebhookUrl(token) {
	const baseUrl =
		process.env.APP_URL || "https://extrairleads.brasilonthebox.shop";
	return `${baseUrl}/api/webhook/whatsapp?secret=${token}`;
}

async function testCheckConnection() {
    try {
        const user = await getTargetUser();
        if (!user) {
            console.error("User not found");
            return;
        }
        console.log("User details:", {
            id: user.id,
            email: user.email,
            cpfCnpj: user.cpf_cnpj,
            whatsappInstanceName: user.whatsapp_instance_name,
            whatsappInstanceToken: user.whatsapp_instance_token,
            whatsappProvider: user.whatsapp_provider
        });

		const instanceName =
			user.whatsapp_instance_name || user.cpf_cnpj?.toString().replace(/\D/g, "");

		if (!instanceName) {
            console.error("No instance name");
            return;
		}

		const evolutionUrl = process.env.EVOLUTION_API_URL;
		if (!evolutionUrl) {
            console.error("No evolution url");
            return;
		}

		const globalKey = getGlobalKey();

        console.log("Fetching /instance/all...");
		const response = await fetch(`${evolutionUrl}/instance/all`, {
			method: "GET",
			headers: { apikey: globalKey },
		});

		if (!response.ok) {
			const text = await response.text();
            console.error("instance/all failed:", response.status, text);
            return;
		}

		const resJson = await response.json();
		const instancesList = resJson?.data || [];
		const foundInstance = instancesList.find(
			(inst) => inst.name === instanceName,
		);

        console.log("Found instance in list:", foundInstance);

		if (!foundInstance) {
            console.log(`[checkWhatsApp] Instância "${instanceName}" não encontrada. Recriando...`);
			const newToken = randomBytes(32).toString('hex');
			const webhookUrl = getBaseWebhookUrl(newToken);

            console.log("Calling /instance/create...");
			const createRes = await fetch(`${evolutionUrl}/instance/create`, {
				method: "POST",
				headers: {
					apikey: globalKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					instanceName: instanceName,
					name: instanceName,
					token: newToken,
					qrcode: true,
					integration: "WHATSAPP-BAILEYS",
					webhook: {
						url: webhookUrl,
						enabled: true,
						events: ["MESSAGES_UPSERT"],
					},
				}),
			});

			if (!createRes.ok) {
				const errorText = await createRes.text();
				console.error(
					`[checkWhatsApp] Falha ao recriar instância: ${createRes.status} ${errorText}`,
				);
                return;
			}

			const createData = await createRes.json();
            console.log("Create Response data:", createData);

			const actualToken =
				createData.hash?.apikey || createData.instance?.apikey || newToken;

			if (actualToken !== newToken) {
				const actualWebhookUrl = getBaseWebhookUrl(actualToken);
				try {
                    console.log("Setting webhook via /webhook/set...");
					const webhookRes = await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
						method: "POST",
						headers: {
							apikey: globalKey,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							webhook: {
								url: actualWebhookUrl,
								enabled: true,
								events: ["MESSAGES_UPSERT"],
							},
						}),
					});
                    console.log("Webhook set status:", webhookRes.status);
                    const webhookText = await webhookRes.text();
                    console.log("Webhook set response:", webhookText);
				} catch (e) {
					console.error("[checkWhatsApp] Falha ao atualizar webhook:", e);
				}
			}

			// Update db
            console.log("Updating user in db with name:", instanceName, "token:", actualToken);
            await sql`UPDATE users SET whatsapp_instance_name = ${instanceName}, whatsapp_instance_token = ${actualToken} WHERE id = ${user.id}`;
			console.log(`[checkWhatsApp] Instância "${instanceName}" recriada com sucesso.`);
		} else {
            console.log("Instance already exists on server");
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

testCheckConnection();
