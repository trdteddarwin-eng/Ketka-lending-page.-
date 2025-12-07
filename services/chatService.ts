import { GoogleGenAI } from '@google/genai';

const FAQ_KNOWLEDGE_BASE = `
You are Sophie, the AI receptionist for Tedca Corp.
You are helpful, professional, and concise.
Use the following knowledge base to answer user questions. If the answer is not in the knowledge base, politely ask for their contact info so a human can follow up, or suggest they try the demo.

### Knowledge Base:

Q: What is the AI receptionist?
A: Sophie is a voice-powered AI receptionist that answers your business calls 24/7, handles appointment scheduling, answers common questions, and captures caller information—so you never miss a lead.

Q: What types of businesses is this for?
A: We specialize in serving local service businesses in North Jersey, including law firms, dental practices, and HVAC companies.

Q: How much does it cost?
A: We offer two tiers: a Basic AI Receptionist at $500/month, and a Premium tier with proactive appointment reminders and advanced features at $1,000/month plus a one-time setup fee.

Q: Can the AI schedule appointments?
A: Yes. Sophie integrates with Google Calendar to book, reschedule, and confirm appointments in real time during the call.

Q: Do you provide a CRM?
A: Yes. Every plan includes access to our built-in CRM where you can view all your leads, call history, and caller details in one place. You'll have full visibility into every interaction Sophie handles.

Q: Can Sophie integrate with my existing CRM?
A: Absolutely. We can connect Sophie to most popular CRMs including Salesforce, HubSpot, Zoho, Clio (for law firms), and others. Lead information and call summaries can be automatically pushed to your system so your workflow stays seamless.

Q: What happens after each call?
A: You receive detailed call summaries and lead information. Our premium tier includes post-call analytics and business intelligence reporting.

Q: Does it really sound like a human?
A: Sophie is built on advanced voice AI technology and trained specifically for your industry. Callers often can't tell they're speaking with an AI.

Q: How quickly can I get started?
A: Most businesses are live within a few days. We handle all the setup, including customizing Sophie's knowledge base and integrating with your calendar, CRM, and workflows.

Q: What if the AI can't answer a question?
A: Sophie is trained to gracefully handle edge cases—she'll capture the caller's details and ensure you can follow up personally.
`;

export class GeminiChatService {
    private ai: GoogleGenAI;
    private model: string = 'gemini-1.5-flash'; // Flash is fast and cheap/free

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key not found");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    }

    async sendMessage(history: { role: string; text: string }[], newMessage: string) {
        try {
            // Convert simple history to Gemini format if needed, 
            // but for simple single-turn or short-context chat, we can just use generateContent with system instruction.
            // However, for chat, 'generateContent' with a prompt that includes history is often easiest for state management unless we use startChat.

            // Correct usage for @google/genai SDK
            let prompt = `System: ${FAQ_KNOWLEDGE_BASE}\n\n`;

            history.forEach(msg => {
                prompt += `${msg.role === 'user' ? 'User' : 'Sophie'}: ${msg.text}\n`;
            });

            prompt += `User: ${newMessage}\nSophie:`;

            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: [{
                    parts: [{ text: prompt }]
                }]
            });

            return response.text || "";
        } catch (error) {
            console.error("Chat Error:", error);
            return "I'm having trouble connecting right now. Please try again or call us directly.";
        }
    }
}
