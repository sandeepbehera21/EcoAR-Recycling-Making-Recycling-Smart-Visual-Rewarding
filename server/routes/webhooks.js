const express = require('express');
const router = express.Router();
const BinLocation = require('../models/BinLocation');

// Dialogflow CX Integration
let dialogflowClient = null;
let dialogflowEnabled = false;

// Try to initialize Dialogflow CX
try {
    if (process.env.DIALOGFLOW_PROJECT_ID &&
        process.env.DIALOGFLOW_PROJECT_ID !== 'your-gcp-project-id' &&
        process.env.GOOGLE_APPLICATION_CREDENTIALS) {

        const { SessionsClient } = require('@google-cloud/dialogflow-cx');
        dialogflowClient = new SessionsClient();
        dialogflowEnabled = true;
        console.log('✅ Dialogflow CX connected');
    } else {
        console.log('ℹ️ Dialogflow CX not configured, using local responses');
    }
} catch (error) {
    console.log('ℹ️ Dialogflow CX not available, using local responses');
}

// Local recycling knowledge base (fallback when Dialogflow is not configured)
const recyclingKnowledge = {
    plastic: {
        tips: [
            "Rinse plastic containers before recycling. Remove caps and labels if possible.",
            "Check the recycling number (1-7) on the bottom - most programs accept 1 and 2.",
            "Plastic bags usually can't go in curbside bins - take them to grocery store collection points."
        ],
        bin: "blue"
    },
    paper: {
        tips: [
            "Keep paper dry and clean. Remove staples and paper clips.",
            "Shredded paper should be contained in a paper bag before recycling.",
            "Pizza boxes with grease stains go in compost, not paper recycling."
        ],
        bin: "blue"
    },
    metal: {
        tips: [
            "Rinse metal cans and crush them to save space.",
            "Aluminum foil can be recycled if clean - ball it up so it doesn't blow away.",
            "Aerosol cans should be empty before recycling."
        ],
        bin: "blue"
    },
    glass: {
        tips: [
            "Remove caps and rinse glass containers.",
            "Don't recycle broken glass, mirrors, or window glass in regular bins.",
            "Separate by color if your local program requires it."
        ],
        bin: "green"
    },
    organic: {
        tips: [
            "Compost food scraps including fruit peels, coffee grounds, and eggshells.",
            "Avoid putting cooked food with oils in green waste.",
            "Yard trimmings and leaves are great for composting."
        ],
        bin: "green"
    },
    electronics: {
        tips: [
            "Never throw electronics in regular trash - they contain hazardous materials.",
            "Many stores offer e-waste collection programs.",
            "Remove batteries before recycling devices."
        ],
        bin: "special"
    }
};

// Function to get local response
function getLocalResponse(query) {
    const lowerQuery = query.toLowerCase();

    // Check for waste type questions
    for (const [type, data] of Object.entries(recyclingKnowledge)) {
        if (lowerQuery.includes(type)) {
            const tip = data.tips[Math.floor(Math.random() * data.tips.length)];
            return `♻️ **${type.charAt(0).toUpperCase() + type.slice(1)} recycling tip:** ${tip} (Goes in the ${data.bin} bin)`;
        }
    }

    // Location/bin finding
    if (lowerQuery.includes('nearest') || lowerQuery.includes('where') || lowerQuery.includes('find bin') || lowerQuery.includes('locate')) {
        return "📍 To find the nearest recycling bin, go to the 'Locate Bins' page in the app, or enable location services so I can help you find one!";
    }

    // Points questions
    if (lowerQuery.includes('points') || lowerQuery.includes('score') || lowerQuery.includes('reward')) {
        return "🏆 You can check your eco-points in your Profile! Earn more by scanning and correctly sorting waste. Every scan helps the planet!";
    }

    // Greeting
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
        return "Hello! 👋 I'm your EcoAR recycling assistant. I can help you with recycling tips, finding bins, and answering questions about waste sorting. What would you like to know?";
    }

    // Blue bin
    if (lowerQuery.includes('blue bin')) {
        return "🔵 **Blue bins** are typically for recyclables: plastic containers (#1 & #2), paper, cardboard, metal cans, and glass bottles. Remember to rinse containers!";
    }

    // Green bin
    if (lowerQuery.includes('green bin')) {
        return "🟢 **Green bins** are for organic waste: food scraps, yard trimmings, and compostable materials. No plastic bags!";
    }

    // How to recycle
    if (lowerQuery.includes('how') && lowerQuery.includes('recycle')) {
        return "🌱 **How to recycle properly:** 1) Clean and dry your recyclables 2) Check the recycling symbol 3) Remove caps and labels when possible 4) Don't bag recyclables 5) When in doubt, check your local guidelines!";
    }

    // Default response
    return "I can help you with recycling! Try asking about:\n• How to recycle plastic, paper, metal, glass, or electronics\n• What goes in blue or green bins\n• Finding the nearest recycling bin\n• Your eco-points and rewards\n\nWhat would you like to know? 🌍";
}

// POST /webhook/dialogflow - Chat endpoint
router.post('/dialogflow', async (req, res) => {
    try {
        const queryText = req.body.queryResult?.queryText || req.body.message || '';

        console.log('📩 Received message:', queryText);

        // Always use local responses (works great without Dialogflow setup)
        let responseText = getLocalResponse(queryText);

        // Optionally try Dialogflow CX if configured and has proper intents
        // Uncomment below when Dialogflow intents are configured
        /*
        if (dialogflowEnabled && dialogflowClient) {
            try {
                const sessionId = req.body.sessionId || Math.random().toString(36).substring(7);
                const sessionPath = dialogflowClient.projectLocationAgentSessionPath(
                    process.env.DIALOGFLOW_PROJECT_ID,
                    process.env.DIALOGFLOW_LOCATION || 'asia-south1',
                    process.env.DIALOGFLOW_AGENT_ID,
                    sessionId
                );

                const request = {
                    session: sessionPath,
                    queryInput: {
                        text: {
                            text: queryText,
                        },
                        languageCode: 'en',
                    },
                };

                const [response] = await dialogflowClient.detectIntent(request);
                const messages = response.queryResult.responseMessages;

                if (messages && messages.length > 0 && messages[0].text && messages[0].text.text[0]) {
                    // Only use Dialogflow response if it's not empty
                    const dfResponse = messages[0].text.text[0];
                    if (dfResponse && dfResponse.trim().length > 0) {
                        responseText = dfResponse;
                    }
                }
            } catch (dfError) {
                console.error('Dialogflow error:', dfError.message);
            }
        }
        */

        console.log('📤 Sending response:', responseText.substring(0, 50) + '...');

        res.json({
            fulfillmentText: responseText,
            fulfillmentMessages: [{ text: { text: [responseText] } }]
        });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.json({
            fulfillmentText: "I'm having a moment! Let me think... You can ask me about recycling plastic, paper, metal, glass, or electronics. 🌱",
            fulfillmentMessages: [{ text: { text: ["I'm having a moment! Let me think... You can ask me about recycling plastic, paper, metal, glass, or electronics. 🌱"] } }]
        });
    }
});

// POST /webhook/classify - Trigger image classification (placeholder)
router.post('/classify', async (req, res) => {
    const { imageURL } = req.body;

    try {
        // This is a placeholder - in production, integrate with AI service
        const mockClassification = {
            wasteType: 'plastic',
            confidence: 0.92,
            itemDescription: 'Plastic bottle',
            tip: 'Rinse before recycling. Remove cap if possible.',
            pointsEarned: 10
        };

        res.json({
            success: true,
            classification: mockClassification
        });
    } catch (error) {
        res.status(500).json({ error: 'Classification failed' });
    }
});

module.exports = router;
