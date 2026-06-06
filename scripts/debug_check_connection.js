const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

// Simulate the exact checkWhatsAppConnectionAction flow
// Check what happens when instanceName has special chars or with the webhook/set 404

const evolutionUrl = process.env.EVOLUTION_API_URL;
const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY;

async function simulateCheckConnection() {
    // Get all instances
    const response = await fetch(`${evolutionUrl}/instance/all`, {
        method: "GET",
        headers: { apikey: globalKey },
    });
    
    console.log(`/instance/all status: ${response.status}`);
    const resJson = await response.json();
    const instancesList = resJson?.data || [];
    
    // Find the user's instance (66228253000125 is the CPF/CNPJ cleaned)
    const testNames = ["66228253000125", "66.228.253/0001-25"];
    
    for (const name of testNames) {
        const found = instancesList.find(inst => inst.name === name);
        if (found) {
            console.log(`\nFound instance: ${found.name} | connected: ${found.connected} | token: ${found.token}`);
            
            // Try the webhook/set call that might be causing issues
            console.log(`\nTrying: POST /webhook/set/${found.name}`);
            try {
                const webhookRes = await fetch(`${evolutionUrl}/webhook/set/${found.name}`, {
                    method: "POST",
                    headers: {
                        apikey: globalKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        webhook: {
                            url: "https://example.com/test",
                            enabled: true,
                            events: ["MESSAGES_UPSERT"],
                        },
                    }),
                });
                console.log(`Status: ${webhookRes.status}`);
                const text = await webhookRes.text();
                console.log(`Body: ${text}`);
            } catch (e) {
                console.log(`FETCH ERROR: ${e.message}`);
            }
        } else {
            console.log(`Instance "${name}" not found`);
        }
    }
    
    // Now check: does the DB user have the right instance name?
    // We need to check what the app would do for the user
    console.log("\n\n=== Checking user's DB state via query ===");
    // Can't query DB here directly, but let's check the flow
    
    // The key question is: what instanceName does the user's account have?
    // If it's "66.228.253/0001-25" (with special chars), the webhook/set URL would be broken
    // If it's "66228253000125" (cleaned), it should work (but webhook/set is 404 in v3 anyway)
}

simulateCheckConnection().catch(e => console.error("Fatal:", e));
