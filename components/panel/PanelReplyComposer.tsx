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
  /** Si no se pasa, sigue el estado de `disabled` (tomar control). */
  attachEnabled?: boolean;
  attachButtonClass?: string;
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
  attachEnabled: attachEnabledProp,
  attachButtonClass = '',
}: PanelReplyComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [attachNotice, setAttachNotice] = useState('');

  const attachEnabled = attachEnabledProp ?? !disabled;
  const busy = disabled || sending;
  const canAttach = attachEnabled && !sending;

  const clearFile = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePick = (file: File | null) => {
    if (!file || !canAttach) return;
    setAttachNotice('');
    setPendingFile(file);
  };

  const handleAttachClick = () => {
    if (!attachEnabled) {
      setAttachNotice('Toma control del chat para adjuntar archivos.');
      return;
    }
    if (sending) return;
    setAttachNotice('');
    fileInputRef.current?.click();
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
      {attachNotice ? <p className="text-xs text-amber-300/90">{attachNotice}</p> : null}
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
          disabled={!canAttach}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            handleFilePick(file);
          }}
        />
        <button
          type="button"
          disabled={sending}
          onClick={handleAttachClick}
          className={`self-end shrink-0 min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl border transition ${
            attachEnabled
              ? attachButtonClass ||
                'border-white/25 bg-white/10 text-white hover:bg-white/15 active:scale-[0.97]'
              : 'border-white/20 bg-white/[0.06] text-white/55 hover:bg-white/10'
          } disabled:opacity-40`}
          title={attachEnabled ? 'Adjuntar imagen o documento' : 'Toma control para adjuntar'}
          aria-label={attachEnabled ? 'Adjuntar archivo' : 'Adjuntar archivo (requiere tomar control)'}
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
          className={`self-end shrink-0 min-w-[48px] min-h-[48px] inline-flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition ${accentSendClass}`}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
