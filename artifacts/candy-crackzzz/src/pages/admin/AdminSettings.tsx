import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Mail, Info, MapPin, MessageCircle } from 'lucide-react';
import { Settings } from '@/types';

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

function SectionCard({ title, children, icon }: SectionCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-5">
      <h2 className="text-base font-black uppercase tracking-wider mb-5 border-b border-border pb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { settings, setSettings } = useAppContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Settings>(settings);

  const set = (field: Partial<Settings>) => setFormData(p => ({ ...p, ...field }));

  const handleSave = () => {
    setSettings(formData);
    toast({ title: "Settings Saved", description: "Your store configuration has been updated." });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-1">Settings</h1>
          <p className="text-muted-foreground font-bold">Configure your storefront operations.</p>
        </div>
        <Button size="lg" onClick={handleSave} className="font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,255,0.4)]">
          <Save className="w-5 h-5 mr-2" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-card border border-border h-auto p-1 mb-6 flex flex-wrap gap-1 max-w-3xl">
          <TabsTrigger value="general" className="font-bold uppercase tracking-wider px-4 py-2.5">General</TabsTrigger>
          <TabsTrigger value="messages" className="font-bold uppercase tracking-wider px-4 py-2.5">Messages</TabsTrigger>
          <TabsTrigger value="features" className="font-bold uppercase tracking-wider px-4 py-2.5">Features</TabsTrigger>
          <TabsTrigger value="logistics" className="font-bold uppercase tracking-wider px-4 py-2.5">Logistics</TabsTrigger>
          <TabsTrigger value="helper" className="font-bold uppercase tracking-wider px-4 py-2.5">Helper</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="max-w-3xl">
          <SectionCard title="Business Information" icon={<Info className="w-4 h-4" />}>
            <div className="space-y-2">
              <Label className="font-bold">Business Name</Label>
              <Input value={formData.businessName} onChange={e => set({ businessName: e.target.value })} className="bg-background font-bold h-12" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Contact Phone</Label>
                <Input value={formData.businessPhone} onChange={e => set({ businessPhone: e.target.value })} placeholder="(555) 000-0000" className="bg-background font-bold h-12" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Contact Email</Label>
                <Input type="email" value={formData.businessEmail} onChange={e => set({ businessEmail: e.target.value })} placeholder="hello@yourbusiness.com" className="bg-background font-bold h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Service Area (shown publicly)</Label>
              <Input value={formData.serviceArea} onChange={e => set({ serviceArea: e.target.value })} placeholder="e.g. Spring Hill, FL and surrounding areas" className="bg-background font-bold h-12" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> Business / Pickup Address</Label>
              <Input
                value={formData.businessAddress}
                onChange={e => set({ businessAddress: e.target.value })}
                placeholder="e.g. 123 Main St, Spring Hill, FL 34608"
                className="bg-background font-bold h-12"
              />
              <p className="text-xs text-muted-foreground">Used as the starting point for delivery directions in the admin order view. Not shown publicly.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">About Us / Footer Text</Label>
              <Textarea value={formData.aboutText} onChange={e => set({ aboutText: e.target.value })} className="bg-background font-medium min-h-[90px] resize-none" />
            </div>
          </SectionCard>

          <SectionCard title="Social Links">
            <div className="space-y-4">
              {[
                { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
                { key: 'tiktok' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@yourpage' },
                { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
              ].map(social => (
                <div key={social.key} className="flex items-center gap-4">
                  <Label className="font-bold w-24 shrink-0">{social.label}</Label>
                  <Input
                    placeholder={social.placeholder}
                    value={formData.socialLinks[social.key]}
                    onChange={e => set({ socialLinks: { ...formData.socialLinks, [social.key]: e.target.value } })}
                    className="bg-background"
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="messages" className="max-w-3xl">
          <SectionCard title="Message Destinations" icon={<Mail className="w-4 h-4" />}>
            <p className="text-sm text-muted-foreground font-medium -mt-2 pb-2">
              Configure where order notifications should go. For live customer orders from any device, set the backend Replit secrets too.
            </p>
            <div className="space-y-2">
              <Label className="font-bold">Order Inquiry Destination Email</Label>
              <Input
                type="email"
                value={formData.orderDestinationEmail}
                onChange={e => set({ orderDestinationEmail: e.target.value })}
                placeholder="orders@yourbusiness.com"
                className="bg-background font-bold h-12"
              />
              <p className="text-xs text-muted-foreground">Used as a browser fallback for order email notifications.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Order Notification Phone</Label>
              <Input
                type="tel"
                value={formData.orderNotificationPhone}
                onChange={e => set({ orderNotificationPhone: e.target.value })}
                placeholder="(813) 555-1212"
                className="bg-background font-bold h-12"
              />
              <p className="text-xs text-muted-foreground">Used as a browser fallback for SMS order notifications when Twilio is configured.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Contact Form Destination Email</Label>
              <Input
                type="email"
                value={formData.contactDestinationEmail}
                onChange={e => set({ contactDestinationEmail: e.target.value })}
                placeholder="hello@yourbusiness.com"
                className="bg-background font-bold h-12"
              />
              <p className="text-xs text-muted-foreground">Shown on the Contact page so customers know where to reach you.</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-2">
              <p className="text-sm font-bold text-muted-foreground">Live order notifications use backend secrets when they are present.</p>
              <p className="text-xs text-muted-foreground">Set ORDER_NOTIFICATION_EMAIL for email delivery, ORDER_NOTIFICATION_PHONE for SMS delivery, RESEND_API_KEY for email sending, and TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE for SMS sending.</p>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="features" className="max-w-3xl">
          <SectionCard title="Core Features">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
              <div>
                <Label className="font-black text-lg text-primary uppercase tracking-wider">Enable Online Ordering</Label>
                <p className="text-sm text-muted-foreground font-bold">Turn off to stop accepting orders globally.</p>
              </div>
              <Switch checked={formData.enableOrdering} onCheckedChange={v => set({ enableOrdering: v })} className="scale-125 mr-2 shrink-0" />
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <Label className="font-bold">Show Prices Publicly</Label>
                <p className="text-sm text-muted-foreground">Display prices on menu items</p>
              </div>
              <Switch checked={formData.showPricesPublicly} onCheckedChange={v => set({ showPricesPublicly: v })} />
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <Label className="font-bold">Show Sold Out Items</Label>
                <p className="text-sm text-muted-foreground">Keep items visible when out of stock</p>
              </div>
              <Switch checked={formData.showSoldOutItems} onCheckedChange={v => set({ showSoldOutItems: v })} />
            </div>
          </SectionCard>

          <SectionCard title="Page Toggles">
            <div className="space-y-1">
              {[
                { key: 'enableCustomOrders', label: 'Custom Orders Page' },
                { key: 'enableSeasonalSection', label: 'Seasonal Specials Page' },
                { key: 'enableGallery', label: 'Photo Gallery Page' },
                { key: 'enableFeaturedSection', label: 'Homepage Featured Section' },
                { key: 'enableMerch', label: 'Merch Shop Page' },
              ].map(toggle => (
                <div key={toggle.key} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <Label className="font-bold">{toggle.label}</Label>
                  <Switch
                    checked={formData[toggle.key as keyof Settings] as boolean}
                    onCheckedChange={v => set({ [toggle.key]: v })}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="logistics" className="max-w-3xl">
          <SectionCard title="Fulfillment Methods">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div>
                <Label className="font-bold">Enable Pickup</Label>
                <p className="text-sm text-muted-foreground">Allow customers to pick up orders</p>
              </div>
              <Switch checked={formData.enablePickup} onCheckedChange={v => set({ enablePickup: v })} />
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <Label className="font-bold">Enable Delivery</Label>
                <p className="text-sm text-muted-foreground">Allow customers to request delivery</p>
              </div>
              <Switch checked={formData.enableDelivery} onCheckedChange={v => set({ enableDelivery: v })} />
            </div>
            {formData.enableDelivery && (
              <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Charge Delivery Fee</Label>
                  <Switch checked={formData.deliveryFeeEnabled} onCheckedChange={v => set({ deliveryFeeEnabled: v })} />
                </div>
                {formData.deliveryFeeEnabled && (
                  <div>
                    <Label className="font-bold mb-2 block">Flat Delivery Fee ($)</Label>
                    <Input type="number" value={formData.deliveryFeeAmount} onChange={e => set({ deliveryFeeAmount: parseFloat(e.target.value) || 0 })} className="bg-background max-w-[160px]" />
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Delivery Directions" icon={<MapPin className="w-4 h-4" />}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div>
                <Label className="font-bold">Show "Open Directions" button on delivery orders</Label>
                <p className="text-sm text-muted-foreground">Adds a Google Maps directions link in the admin order view from your business address to the customer's delivery address.</p>
              </div>
              <Switch
                checked={formData.deliveryDirectionsButtonEnabled}
                onCheckedChange={v => set({ deliveryDirectionsButtonEnabled: v })}
              />
            </div>
            <div className="bg-muted/20 rounded-xl p-4 border border-border space-y-2">
              <p className="text-sm font-bold">Current business address:</p>
              <p className="text-sm text-muted-foreground">
                {formData.businessAddress || <span className="text-amber-400">Not set — add it in the General tab to enable directions.</span>}
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="helper" className="max-w-3xl">
          <SectionCard title="On-Site Candy Helper" icon={<MessageCircle className="w-4 h-4" />}>
            <p className="text-sm text-muted-foreground -mt-2 pb-2">
              A small floating helper button appears on customer-facing pages. It only talks about your candy flavors, fruit flavors, party trays, merch, rewards, pickup, delivery, and custom order ideas. It uses your real menu and merch data — no external AI service is called.
            </p>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div>
                <Label className="font-bold">Enable Helper</Label>
                <p className="text-sm text-muted-foreground">Master switch — turns the floating helper button off everywhere.</p>
              </div>
              <Switch checked={formData.helperEnabled} onCheckedChange={v => set({ helperEnabled: v })} />
            </div>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div>
                <Label className="font-bold">Show Floating Button on Customer Pages</Label>
                <p className="text-sm text-muted-foreground">When off, the helper stays disabled even if enabled above.</p>
              </div>
              <Switch checked={formData.helperShowFloating} onCheckedChange={v => set({ helperShowFloating: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'helperShowOnHome' as const, label: 'Home page' },
                { key: 'helperShowOnMenu' as const, label: 'Menu page' },
                { key: 'helperShowOnMerch' as const, label: 'Merch page' },
                { key: 'helperShowOnCart' as const, label: 'Cart page' },
              ].map(t => (
                <div key={t.key} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <Label className="font-bold text-sm">{t.label}</Label>
                  <Switch checked={formData[t.key]} onCheckedChange={v => set({ [t.key]: v })} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { key: 'helperAllowMerchSuggestions' as const, label: 'Suggest merch' },
                { key: 'helperAllowRewardsSuggestions' as const, label: 'Talk about rewards basics' },
                { key: 'helperAllowReferralSuggestions' as const, label: 'Talk about referrals basics' },
                { key: 'helperAllowCustomOrderIdeas' as const, label: 'Suggest custom order ideas' },
              ].map(t => (
                <div key={t.key} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <Label className="font-bold text-sm">{t.label}</Label>
                  <Switch checked={formData[t.key]} onCheckedChange={v => set({ [t.key]: v })} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Greeting Message</Label>
              <Input value={formData.helperGreeting} onChange={e => set({ helperGreeting: e.target.value })} className="bg-background font-medium h-11" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Fallback Message (when nothing matches)</Label>
              <Textarea value={formData.helperFallbackMessage} onChange={e => set({ helperFallbackMessage: e.target.value })} className="bg-background font-medium min-h-[70px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Allergy Disclaimer (shown under each reply)</Label>
              <Input value={formData.helperAllergyDisclaimer} onChange={e => set({ helperAllergyDisclaimer: e.target.value })} className="bg-background font-medium h-11" />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label className="font-bold">Max Recommendations Per Reply</Label>
              <Input type="number" min={1} max={6} value={formData.helperMaxRecommendations} onChange={e => set({ helperMaxRecommendations: Math.max(1, parseInt(e.target.value) || 3) })} className="bg-background font-bold h-11" />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
