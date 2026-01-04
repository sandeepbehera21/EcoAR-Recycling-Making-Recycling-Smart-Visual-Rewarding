import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import axios from "axios";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

const quickQuestions = [
    "Can I recycle plastic bags?",
    "Where is the nearest bin?",
    "How do I recycle electronics?",
    "What goes in the blue bin?",
];

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: "Hi! I'm your EcoAR assistant. Ask me anything about recycling! 🌱",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // Call the backend webhook endpoint
            const response = await axios.post("http://localhost:5000/api/webhook/dialogflow", {
                message: text,
                queryResult: {
                    queryText: text,
                },
            });

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.fulfillmentText || "I'm not sure about that. Can you rephrase?",
                sender: "bot",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting. Please try again later.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Simple intent detection (in production, Dialogflow handles this)
    const getIntentFromQuery = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes("nearest") || lowerQuery.includes("where") || lowerQuery.includes("find bin")) {
            return "find_nearest_bin";
        }
        if (lowerQuery.includes("recycle") || lowerQuery.includes("dispose") || lowerQuery.includes("throw")) {
            return "recycling_tip";
        }
        if (lowerQuery.includes("points") || lowerQuery.includes("score")) {
            return "points_check";
        }
        return "default";
    };

    const extractParameters = (query: string): Record<string, string> => {
        const lowerQuery = query.toLowerCase();
        const wasteTypes = ["plastic", "paper", "metal", "glass", "organic", "electronics"];

        for (const type of wasteTypes) {
            if (lowerQuery.includes(type)) {
                return { waste_type: type };
            }
        }
        return {};
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                    }`}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>

            {/* Chat Window */}
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="bg-eco-gradient text-primary-foreground rounded-t-lg py-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bot className="h-5 w-5" />
                            EcoAR Assistant
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-2 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"
                                        }`}
                                >
                                    <div
                                        className={`p-2 rounded-full ${message.sender === "user" ? "bg-primary" : "bg-muted"
                                            }`}
                                    >
                                        {message.sender === "user" ? (
                                            <User className="h-4 w-4 text-primary-foreground" />
                                        ) : (
                                            <Bot className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[75%] p-3 rounded-2xl ${message.sender === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                            }`}
                                    >
                                        <p className="text-sm">{message.text}</p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="p-2 rounded-full bg-muted">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        <div className="px-4 py-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                            <div className="flex flex-wrap gap-1">
                                {quickQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about recycling..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={() => sendMessage(inputValue)}
                                disabled={!inputValue.trim() || isLoading}
                                className="shrink-0"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
};

export default Chatbot;
