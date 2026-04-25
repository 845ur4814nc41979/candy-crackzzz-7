import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiGenerateAI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AiWriteButtonProps {
  prompt: string;
  context?: string;
  onResult: (text: string) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'default';
}

export default function AiWriteButton({ prompt, context, onResult, disabled, label = 'Write with AI', size = 'sm' }: AiWriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Missing Info', description: 'Add a product name first so AI knows what to write about.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await apiGenerateAI(prompt, context);
      if (result.ok && result.text) {
        onResult(result.text);
        toast({ title: 'AI Draft Ready', description: 'Review and edit the suggestion below.' });
      } else {
        toast({ title: 'AI Unavailable', description: result.message ?? 'Could not generate text.', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed.';
      toast({ title: 'AI Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleGenerate}
      disabled={disabled || loading}
      className="gap-2 font-bold uppercase tracking-wide border-primary/40 text-primary hover:bg-primary/10"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {loading ? 'Writing...' : label}
    </Button>
  );
}
