const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY Missing");
        return;
    }

    // There isn't a direct "listModels" on the instance in this SDK version easily accessible in docs without "GoogleAIFileManager" or similar?
    // Wait, the error message literally says: "Call ListModels to see the list of available models"
    // In strict REST access, it's GET /v1beta/models.
    // Let's us fetch directly because SDK method signature might vary by version.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}
listAllModels();
