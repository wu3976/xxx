// ChatPanel.tsx
import React from "react";

export type ChatMessage = {
    id: number | string;
    from: string;
    text: string;
    time: string;
};

type ChatPanelProps = {
    messages: ChatMessage[];
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages }) => {
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
                            (m.from === "You"
                                ? "ttt-message--me"
                                : "ttt-message--opponent")
                        }
                    >
                        <div className="ttt-message-meta">
                            <span className="ttt-message-from">{m.from}</span>
                            <span className="ttt-message-time">{m.time}</span>
                        </div>
                        <div className="ttt-message-bubble">{m.text}</div>
                    </div>
                ))}
            </div>

            <div className="ttt-chat-input">
                <input
                    type="text"
                    placeholder="Type a message..."
                    readOnly
                />
                <button
                    className="btn-send"
                    onClick={() => alert("UI only – no real send")}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
