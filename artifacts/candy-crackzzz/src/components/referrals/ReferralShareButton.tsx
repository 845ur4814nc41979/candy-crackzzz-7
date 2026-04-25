import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Copy, Mail, MessageSquare, Share2 } from 'lucide-react';
import {
  buildEmailShareUrl,
  buildReferralShareMessage,
  buildSmsShareUrl,
  copyReferralCode,
  copyReferralMessage,
  isNativeShareSupported,
  shareReferralCode,
} from '@/lib/referralShare';
import type { Settings } from '@/types';

type ButtonSize = React.ComponentProps<typeof Button>['size'];
type ButtonVariant = React.ComponentProps<typeof Button>['variant'];

interface ReferralShareButtonProps {
  code: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
  label?: string;
  iconOnly?: boolean;
  align?: 'start' | 'center' | 'end';
}

export default function ReferralShareButton({
  code,
  size = 'default',
  variant = 'default',
  className,
  label = 'Share Referral',
  iconOnly = false,
  align = 'end',
}: ReferralShareButtonProps) {
  const { settings } = useAppContext();
  const { toast } = useToast();
  const [nativeSupported, setNativeSupported] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setNativeSupported(isNativeShareSupported());
  }, []);

  const shareSettings = useMemo<Pick<
    Settings,
    'enableReferrals' | 'businessName' | 'referralReferrerBonusPoints' | 'referralReferredCustomerBonusPoints'
  >>(() => ({
    enableReferrals: settings.enableReferrals,
    businessName: settings.businessName,
    referralReferrerBonusPoints: settings.referralReferrerBonusPoints,
    referralReferredCustomerBonusPoints: settings.referralReferredCustomerBonusPoints,
  }), [settings]);

  if (!settings.enableReferrals || !code) return null;

  const ctx = { code, settings: shareSettings };
  const sharePreview = buildReferralShareMessage(ctx);

  const handleNativeShare = async () => {
    const result = await shareReferralCode(ctx);
    if (result === 'shared') {
      toast({ title: 'Shared', description: 'Your referral code is on its way.' });
    } else if (result === 'unsupported') {
      setOpen(true);
    } else if (result === 'error') {
      toast({ title: 'Share menu unavailable', description: 'Pick another option below.', variant: 'destructive' });
      setOpen(true);
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyReferralCode(code);
    if (ok) {
      toast({ title: 'Code copied', description: code });
    } else {
      toast({ title: 'Copy failed', description: 'Try copying it manually.', variant: 'destructive' });
    }
  };

  const handleCopyMessage = async () => {
    const ok = await copyReferralMessage(ctx);
    if (ok) {
      toast({ title: 'Message copied', description: 'Paste it anywhere to share.' });
    } else {
      toast({ title: 'Copy failed', description: 'Try copying it manually.', variant: 'destructive' });
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (nativeSupported) {
      e.preventDefault();
      void handleNativeShare();
    }
  };

  const labelNode = iconOnly ? null : <span className="ml-2">{label}</span>;

  const triggerButton = (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      aria-label={label}
      title={label}
      onClick={handleTriggerClick}
    >
      <Share2 className="w-4 h-4" />
      {labelNode}
    </Button>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel>Share referral code {code}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleCopyCode();
            setOpen(false);
          }}
        >
          <Copy className="w-4 h-4 mr-2" /> Copy code
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleCopyMessage();
            setOpen(false);
          }}
        >
          <Copy className="w-4 h-4 mr-2" /> Copy message
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildSmsShareUrl(ctx)} onClick={() => setOpen(false)}>
            <MessageSquare className="w-4 h-4 mr-2" /> Text message
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildEmailShareUrl(ctx)} onClick={() => setOpen(false)}>
            <Mail className="w-4 h-4 mr-2" /> Email
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 pb-2 text-[11px] text-muted-foreground leading-snug break-words">
          {sharePreview}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
