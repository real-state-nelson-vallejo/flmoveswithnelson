const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    // Testing gemini-2.5-flash as found in list-models-rest.js
    const model = "gemini-2.5-flash";
    console.log(`Testing Model: ${model}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [{ parts: [{ text: "Hello, confirm you are working." }] }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
        } else {
            const data = await response.json();
            console.log(`SUCCESS with ${model}`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
    }
}

test();
