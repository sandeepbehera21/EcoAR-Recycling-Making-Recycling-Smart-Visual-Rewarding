import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Classifying waste image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert waste classification AI assistant for a recycling app. Your job is to analyze images of waste items and classify them into one of these categories:

- plastic: Plastic bottles, containers, bags, packaging, straws, cups, etc.
- metal: Aluminum cans, tin cans, metal lids, foil, metal containers, etc.
- paper: Paper, cardboard, newspapers, magazines, paper bags, cartons, etc.
- organic: Food waste, fruit peels, vegetables, leaves, garden waste, etc.
- glass: Glass bottles, jars, broken glass, etc.
- ewaste: Electronics, batteries, cables, phones, computers, etc.
- general: Items that don't fit the above categories or mixed waste.

Analyze the image and respond with a JSON object containing:
- type: The waste category (one of: plastic, metal, paper, organic, glass, ewaste, general)
- confidence: A number between 0 and 100 representing your confidence
- item: A brief description of what the item appears to be
- tip: A short disposal tip specific to this item

Respond ONLY with the JSON object, no additional text.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: "Please classify this waste item and provide disposal instructions."
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to classify waste" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON response from the AI
    let classification;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      classification = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback classification
      classification = {
        type: "general",
        confidence: 50,
        item: "Unknown item",
        tip: "Please check local guidelines for proper disposal."
      };
    }

    // Validate the type
    const validTypes = ["plastic", "metal", "paper", "organic", "glass", "ewaste", "general"];
    if (!validTypes.includes(classification.type)) {
      classification.type = "general";
    }

    return new Response(
      JSON.stringify({ classification }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in classify-waste function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
