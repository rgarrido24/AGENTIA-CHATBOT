'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClientPanelBrand } from '@/lib/client-panel-config';
import type { CatalogProduct } from '@/lib/biovela-catalog';
import { MetricsRow } from '@/components/client-panel/MetricsRow';
import { ConversationList, type ConversationItem } from '@/components/client-panel/ConversationList';
import { ChatColumn, type ChatMessage } from '@/components/client-panel/ChatColumn';
import { SidebarColumn, SidebarMobileTabs } from '@/components/client-panel/SidebarColumn';
import { QrModal } from '@/components/client-panel/QrModal';
import { getPanelTokenFromUrl, panelFetch } from '@/lib/client-panel-hooks';
import { getClientPanelBrand } from '@/lib/client-panel-config';

type Metrics = {
  conversationsToday: number;
  closedSales: number;
  unanswered: number;
  avgBotResponseSec: number;
};

function TokenGate({ clientId }: { clientId: string }) {
  const [token, setToken] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FAF9F7' }}>
      <div
        className="max-w-md w-full p-6 bg-white"
        style={{ border: '1px solid #E5E0D8', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <h1 className="text-xl font-semibold mb-2">Acceso al panel</h1>
        <p className="text-[15px] opacity-75 mb-4">
          Ingresa el token de acceso que te compartió Agentia para {clientId}.
        </p>
        <input
          type="password"
          className="w-full px-3 py-2 mb-3 text-[15px]"
          style={{ border: '1px solid #E5E0D8', borderRadius: '10px' }}
          placeholder="Token de acceso"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button
          type="button"
          className="w-full py-3 font-semibold text-white text-[15px]"
          style={{ background: '#D4860A', borderRadius: '10px' }}
          onClick={() => {
            if (!token.trim()) return;
            const url = new URL(window.location.href);
            url.searchParams.set('token', token.trim());
            url.searchParams.delete('auth');
            window.location.href = url.toString();
          }}
        >
          Entrar al panel
        </button>
      </div>
    </div>
  );
}

export function ClientPanelApp({ clientId }: { clientId: string }) {
  const [ready, setReady] = useState(false);
  const [brand, setBrand] = useState<ClientPanelBrand>(() => getClientPanelBrand(clientId));
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    conversationsToday: 0,
    closedSales: 0,
    unanswered: 0,
    avgBotResponseSec: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lead, setLead] = useState({
    contactName: '',
    phone: '',
    stage: 'pregunton',
    tags: [] as string[],
    notes: '',
    humanMode: false,
    purchaseIntent: 0,
  });
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notesTimerRef = useMemo(() => ({ id: null as ReturnType<typeof setTimeout> | null }), []);

  useEffect(() => {
    const t = getPanelTokenFromUrl();
    if (t) {
      setReady(true);
      return;
    }
    const authRequired = new URLSearchParams(window.location.search).get('auth') === 'required';
    if (authRequired) {
      setReady(true);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('auth', 'required');
    window.location.replace(url.toString());
  }, []);

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams({ metrics: '1', filter });
    if (query) params.set('q', query);
    const data = await panelFetch(clientId, `/conversations?${params}`);
    setConversations(data.conversations || []);
    if (data.metrics) setMetrics(data.metrics);
  }, [clientId, filter, query]);

  const loadConfig = useCallback(async () => {
    const data = await panelFetch(clientId, '/config');
    if (data.brand) setBrand(data.brand);
  }, [clientId]);

  const loadCatalog = useCallback(async () => {
    const data = await panelFetch(clientId, '/catalog');
    setCatalog(data.products || []);
  }, [clientId]);

  const loadWaStatus = useCallback(async () => {
    const data = await panelFetch(clientId, '/whatsapp/status');
    setWaConnected(!!data.connected);
    setWaPhone(data.phone || data.number || null);
  }, [clientId]);

  const loadMessages = useCallback(
    async (convId: string) => {
      const data = await panelFetch(clientId, `/messages/${encodeURIComponent(convId)}`);
      setMessages(data.messages || []);
      const c = data.conversation;
      if (c) {
        setLead({
          contactName: c.contactName,
          phone: c.phone,
          stage: c.stage,
          tags: c.tags || [],
          notes: c.notes || '',
          humanMode: !!c.humanMode,
          purchaseIntent: 0,
        });
      }
      const leadData = await panelFetch(clientId, `/leads/${encodeURIComponent(convId)}`);
      setLead((prev) => ({ ...prev, purchaseIntent: leadData.purchaseIntent ?? 0 }));
    },
    [clientId]
  );

  useEffect(() => {
    if (!ready || !getPanelTokenFromUrl()) return;
    loadConfig().catch(() => {});
    loadCatalog().catch(() => {});
    loadWaStatus().catch(() => {});
    loadConversations().catch((e) => setError(e.message));
    const iv = setInterval(() => {
      loadConversations().catch(() => {});
      loadWaStatus().catch(() => {});
      if (selectedId) loadMessages(selectedId).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, [ready, loadConfig, loadCatalog, loadWaStatus, loadConversations, loadMessages, selectedId]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => loadConversations().catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [query, filter, ready, loadConversations]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId).catch((e) => setError(e.message));
  }, [selectedId, loadMessages]);

  const updateLead = useCallback(
    async (patch: { stage?: string; notes?: string; tags?: string[] }) => {
      if (!selectedId) return;
      const data = await panelFetch(clientId, `/leads/${encodeURIComponent(selectedId)}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      setLead((prev) => ({
        ...prev,
        stage: data.stage ?? prev.stage,
        tags: data.tags ?? prev.tags,
        notes: data.notes ?? prev.notes,
        purchaseIntent: data.purchaseIntent ?? prev.purchaseIntent,
      }));
      await loadConversations();
    },
    [clientId, selectedId, loadConversations]
  );

  if (!ready) {
    return <div className="p-8 text-center text-[15px]">Cargando panel...</div>;
  }

  if (!getPanelTokenFromUrl()) {
    return <TokenGate clientId={clientId} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MetricsRow metrics={metrics} brand={brand} />
      {error && (
        <div className="mx-4 mb-2 p-3 text-[15px] bg-red-50 text-red-800 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col md:flex-row border-t" style={{ borderColor: brand.border }}>
        <div className={selectedId ? 'hidden md:flex md:shrink-0' : 'flex shrink-0'}>
          <ConversationList
            brand={brand}
            items={conversations}
            selectedId={selectedId}
            filter={filter}
            query={query}
            onFilter={setFilter}
            onQuery={setQuery}
            onSelect={setSelectedId}
            waConnected={waConnected}
            waPhone={waPhone}
            onConnectClick={() => setQrOpen(true)}
          />
        </div>

        <div
          className={`flex min-h-0 min-w-0 flex-col ${selectedId ? 'flex flex-1' : 'hidden md:flex md:flex-1'}`}
        >
          <ChatColumn
            brand={brand}
            contactName={lead.contactName}
            humanMode={lead.humanMode}
            messages={messages}
            catalog={catalog}
            onBack={selectedId ? () => setSelectedId(null) : undefined}
            onTakeover={async () => {
              if (!selectedId) return;
              await panelFetch(clientId, '/whatsapp/takeover', {
                method: 'POST',
                body: JSON.stringify({ convId: selectedId }),
              });
              setLead((p) => ({ ...p, humanMode: true }));
              await loadMessages(selectedId);
            }}
            onRelease={async () => {
              if (!selectedId) return;
              await panelFetch(clientId, '/whatsapp/release', {
                method: 'POST',
                body: JSON.stringify({ convId: selectedId }),
              });
              setLead((p) => ({ ...p, humanMode: false }));
              await loadMessages(selectedId);
            }}
            onSend={async (text) => {
              if (!selectedId) return;
              await panelFetch(clientId, `/messages/${encodeURIComponent(selectedId)}`, {
                method: 'POST',
                body: JSON.stringify({ message: text }),
              });
              await loadMessages(selectedId);
              await loadConversations();
            }}
          />

          {selectedId && (
            <SidebarMobileTabs
              brand={brand}
              contactName={lead.contactName}
              phone={lead.phone}
              stage={lead.stage}
              tags={lead.tags}
              notes={lead.notes}
              purchaseIntent={lead.purchaseIntent}
              onStage={(stage) => updateLead({ stage })}
              onTags={(tags) => updateLead({ tags })}
              onNotes={(notes) => {
                setLead((p) => ({ ...p, notes }));
                if (notesTimerRef.id) clearTimeout(notesTimerRef.id);
                notesTimerRef.id = setTimeout(() => updateLead({ notes }), 600);
              }}
            />
          )}
        </div>

        {selectedId && (
          <SidebarColumn
            brand={brand}
            contactName={lead.contactName}
            phone={lead.phone}
            stage={lead.stage}
            tags={lead.tags}
            notes={lead.notes}
            purchaseIntent={lead.purchaseIntent}
            onStage={(stage) => updateLead({ stage })}
            onTags={(tags) => updateLead({ tags })}
            onNotes={(notes) => {
              setLead((p) => ({ ...p, notes }));
              if (notesTimerRef.id) clearTimeout(notesTimerRef.id);
              notesTimerRef.id = setTimeout(() => updateLead({ notes }), 600);
            }}
          />
        )}
      </div>

      <QrModal
        brand={brand}
        clientId={clientId}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onConnected={() => loadWaStatus()}
      />
    </div>
  );
}
