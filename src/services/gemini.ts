import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestHostname(owner: string, deviceType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 professional and systematic hostnames for a ${deviceType} owned by ${owner}. 
      The hostnames should be short, lowercase, and follow a pattern like 'dept-user-01' or 'type-user'.
      Return only the hostnames as a comma-separated list.`,
    });
    return response.text.split(",").map(s => s.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function summarizeLogs(logs: any[]) {
  try {
    const logSummary = logs.slice(0, 20).map(l => 
      `[${l.timestamp}] ${l.user} performed ${l.action} on ${l.hostname}`
    ).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these IT operation logs and provide a concise 2-3 sentence summary of the recent activity. 
      Identify any patterns or unusual events if present.
      
      Logs:
      ${logSummary}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate summary.";
  }
}

export async function askAssistant(query: string, context?: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert IT Systems Administrator for RadiusOps Manager. 
      You help manage FreeIPA host provisioning, certificate lifecycles, and FreeRADIUS EAP-TLS configurations.
      
      Context: ${context || "General IT operations"}
      
      User Query: ${query}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I encountered an error processing your request.";
  }
}
