import { GoogleGenAI } from "@google/genai";
import { LogFile } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeLogs = async (
  query: string,
  relevantLogs: string
): Promise<string> => {
  try {
    const ai = createClient();
    
    // We truncate logs to avoid token limits if they are massive
    const truncatedLogs = relevantLogs.substring(0, 30000); 

    const prompt = `
      Actúa como un ingeniero de DevOps experto en análisis de tráfico y logs.
      
      Contexto: El usuario ha proporcionado los siguientes fragmentos de logs (truncados si son muy largos):
      ---
      ${truncatedLogs}
      ---
      
      Pregunta del usuario: "${query}"
      
      Instrucciones:
      1. Analiza los logs proporcionados.
      2. Responde directamente a la pregunta.
      3. Si encuentras errores (códigos 4xx, 5xx), menciónalos.
      4. Si es tráfico normal, indícalo.
      5. Formato Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response for UI
      }
    });

    return response.text || "No se pudo generar un análisis.";

  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con el servicio de IA. Verifica tu API Key.";
  }
};

export const generateSearchRegex = async (naturalLanguageQuery: string): Promise<string> => {
  try {
    const ai = createClient();
    const prompt = `Translate this natural language search request for log files into a valid JavaScript Regular Expression. ONLY return the Regex string, nothing else. Do not wrap in forward slashes.
    Request: "${naturalLanguageQuery}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    return response.text?.trim() || "";
  } catch (e) {
    return "";
  }
}
