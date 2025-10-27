import React, { useState } from "react";

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      // AI Reply
      const botMessage = { role: "assistant", content: data.reply };

      // Decision visualization
      const decisionMessage = {
        role: "assistant",
        content: `【Decision】 ${data.decision.next_action} | ${data.decision.emotion.label} (${data.decision.emotion.intensity})`,
      };

      setMessages((prev) => [...prev, botMessage, decisionMessage]);
    } catch (error) {
      console.error("Error contacting backend:", error);
      const errorMsg = { role: "assistant", content: "⚠️ Unable to reach server." };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h2>AI Mental Health Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          height: "400px",
          padding: "10px",
          overflowY: "scroll",
          marginBottom: "12px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "6px" }}>
            <strong>{msg.role === "user" ? "🧑 You: " : "🤖 Bot: "}</strong>
            {msg.content}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your feelings..."
        style={{ width: "70%", marginRight: "8px" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatPage;
