// ChatPanel.tsx
import React, { useState, useRef, useEffect } from "react";

export type ChatMessage = {
    id: number | string;
    userId: string;
    username: string;
    text: string;
    time: string;
};

type ChatPanelProps = {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    disabled?: boolean;
    currentUsername?: string;
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSendMessage,
    disabled = false,
    currentUsername = "You",
}) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !disabled) {
            handleSendMessage();
        }
    };

    return (
        <div className="ttt-chat">
            <div className="ttt-chat-header">
                <div>
                    <div className="ttt-chat-title">Game Chat</div>
                    <div className="ttt-chat-subtitle">Chat with your opponent here.</div>
                </div>
            </div>

            <div className="ttt-chat-messages">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={
                            "ttt-message " +
                            (m.username === currentUsername
                                ? "ttt-message--me"
                                : "ttt-message--opponent")
                        }
                    >
                        <div className="ttt-message-meta">
                            <span className="ttt-message-from">{m.username}</span>
                            <span className="ttt-message-time">{m.time}</span>
                        </div>
                        <div className="ttt-message-bubble">{m.text}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="ttt-chat-input">
                <input
                    type="text"
                    placeholder={
                        disabled
                            ? "Game not started - wait for opponent..."
                            : "Type a message..."
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={disabled}
                />
                <button
                    className="btn-send"
                    onClick={handleSendMessage}
                    disabled={disabled || !inputValue.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
