'use client';

import { useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';

type PanelReplyComposerProps = {
  replyText: string;
  onReplyTextChange: (value: string) => void;
  onSendText: () => void | Promise<void>;
  onSendFile: (file: File) => void | Promise<void>;
  disabled: boolean;
  sending: boolean;
  placeholder: string;
  accentSendClass: string;
  textareaClass: string;
  attachHint?: string;
};

export function PanelReplyComposer({
  replyText,
  onReplyTextChange,
  onSendText,
  onSendFile,
  disabled,
  sending,
  placeholder,
  accentSendClass,
  textareaClass,
  attachHint,
}: PanelReplyComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const busy = disabled || sending;

  const clearFile = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePick = (file: File | null) => {
    if (!file || busy) return;
    setPendingFile(file);
  };

  const handleSend = async () => {
    if (busy) return;
    if (pendingFile) {
      const file = pendingFile;
      clearFile();
      await onSendFile(file);
      return;
    }
    if (replyText.trim()) {
      await onSendText();
    }
  };

  const canSend = !busy && (Boolean(pendingFile) || Boolean(replyText.trim()));

  return (
    <div className="space-y-2">
      {attachHint ? <p className="text-xs opacity-70">{attachHint}</p> : null}
      {pendingFile ? (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0 opacity-70" />
          <span className="flex-1 truncate">{pendingFile.name}</span>
          <button
            type="button"
            onClick={clearFile}
            disabled={busy}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-40"
            aria-label="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            handleFilePick(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="self-end px-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-40 transition"
          title="Adjuntar archivo"
          aria-label="Adjuntar archivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          placeholder={pendingFile ? 'Pie de foto o nota (opcional)...' : placeholder}
          disabled={busy}
          rows={2}
          className={textareaClass}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canSend) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={() => void handleSend()}
          className={`self-end px-4 py-3 rounded-xl text-white disabled:opacity-40 transition ${accentSendClass}`}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
