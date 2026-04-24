import { useState, useEffect, useRef } from "react";
import { entities } from "@/lib/firestore";
import { uploadFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Paperclip, Loader2 } from "lucide-react";
import moment from "moment";

export default function TaskChat({ taskId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    entities.Message.filter({ task_id: taskId }, "created_date", 100).then(setMessages);
  }, [taskId]);

  useEffect(() => {
    if (isOpen) setUnread(0);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileAttach(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadFile({ file });
    setAttachedFile({ url: file_url, name: file.name });
    setUploading(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;
    setSending(true);
    const newMsg = await entities.Message.create({
      task_id: taskId,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_role: currentUser.user_role || "student",
      content: input.trim() || (attachedFile ? attachedFile.name : ""),
      file_url: attachedFile?.url || "",
      file_name: attachedFile?.name || "",
    });
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setAttachedFile(null);
    setSending(false);
  }

  const isMe = (msg) => msg.sender_email === currentUser.email;

  return (
    <div className="border-t border-border pt-6 mt-6">
      <div
        className="flex items-center gap-2 mb-4 cursor-pointer"
        onClick={() => setIsOpen((p) => !p)}
      >
        <MessageCircle size={18} className="text-primary" />
        <h3 className="font-heading font-semibold text-foreground">Task Discussion</h3>
        {unread > 0 && (
          <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread}
          </span>
        )}
      </div>

      <div className="bg-muted rounded-xl p-3 h-64 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-20">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                isMe(msg)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-card-foreground"
              }`}
            >
              {!isMe(msg) && (
                <p className="text-[10px] font-semibold mb-1 opacity-70">{msg.sender_name}</p>
              )}
              {msg.file_url ? (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs underline opacity-90 mb-1"
                >
                  📎 {msg.file_name || msg.content}
                </a>
              ) : (
                <p className="text-sm leading-snug">{msg.content}</p>
              )}
              <p
                className={`text-[10px] mt-1 ${
                  isMe(msg) ? "opacity-60 text-right" : "text-muted-foreground"
                }`}
              >
                {moment(msg.created_date).format("h:mm A")}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {attachedFile && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-1.5 mb-1">
          📎 {attachedFile.name}
          <button
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => setAttachedFile(null)}
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={handleSend} className="flex gap-2">
        <label className="flex items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          <input type="file" className="hidden" onChange={handleFileAttach} disabled={uploading} />
        </label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || uploading || (!input.trim() && !attachedFile)}
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
