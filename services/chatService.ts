// Browser-side chat client. It holds NO API key and does not import the Gemini
// SDK — it just POSTs the conversation to our server (/api/chat), which talks to
// Gemini with the key server-side and returns the reply text.

export class GeminiChatService {
    async sendMessage(history: { role: string; text: string }[], newMessage: string) {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, message: newMessage }),
            });
            if (!res.ok) throw new Error(`chat ${res.status}`);
            const data = await res.json();
            return data?.reply || "I'm sorry, I couldn't generate a response.";
        } catch (error) {
            console.error('Chat error:', error);
            return "I'm having trouble connecting right now. Please try again or call us directly.";
        }
    }
}
