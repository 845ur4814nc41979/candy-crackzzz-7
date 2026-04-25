import { useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { buildHelperResponse } from '@/lib/localHelper';

export default function LocalCandyHelper() {
  const { products, merch, settings } = useAppContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot' as const, text: settings.helperGreeting }]);

  const enabled = settings.helperEnabled;
  const shouldShow = useMemo(() => enabled && settings.helperShowFloating, [enabled, settings.helperShowFloating]);
  if (!shouldShow) return null;

  const send = () => {
    const result = buildHelperResponse(input, products, merch, settings);
    setMessages((prev) => [...prev, { role: 'user', text: input }, { role: 'bot', text: result.reply }]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {open ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm uppercase tracking-wider">Candy Helper</strong>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-auto text-sm">
            {messages.map((m, i) => <div key={i} className={m.role === 'bot' ? 'text-muted-foreground' : 'text-right font-medium'}>{m.text}</div>)}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try: sweet, tropical, merch, birthday tray" />
            <Button onClick={send}>Ask</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="rounded-full"><MessageCircle className="mr-2 h-4 w-4" /> Helper</Button>
      )}
    </div>
  );
}