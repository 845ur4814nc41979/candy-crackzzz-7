import { useEffect, useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, LogOut, Search, Trophy, Users, Copy } from 'lucide-react';
import { ensureRewardProfileReferralCode, normalizePhone } from '@/lib/rewards';

const STORAGE_KEY = 'cc_rewards_lookup_phone';

export default function RewardsPage() {
  const { rewardProfiles, orders, settings } = useAppContext();
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [error, setError] = useState('');
  const [copiedState, setCopiedState] = useState<'code' | 'share' | ''>('');

  useEffect(() => {
    const savedPhone = localStorage.getItem(STORAGE_KEY) || '';
    if (savedPhone) {
      setPhone(savedPhone);
      setSubmittedPhone(savedPhone);
    }
  }, []);

  const normalizedSubmittedPhone = normalizePhone(submittedPhone);

  const matchedProfile = useMemo(() => {
    if (!normalizedSubmittedPhone) return null;
    return rewardProfiles.find(profile => normalizePhone(profile.phone) === normalizedSubmittedPhone) ?? null;
  }, [rewardProfiles, normalizedSubmittedPhone]);

  const customerOrders = useMemo(() => {
    if (!normalizedSubmittedPhone) return [];
    return orders
      .filter(order => normalizePhone(order.phone) === normalizedSubmittedPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, normalizedSubmittedPhone]);

  const rewardTiers = useMemo(
    () => [
      { points: settings.rewardsTier1Points, discount: settings.rewardsTier1Discount },
      { points: settings.rewardsTier2Points, discount: settings.rewardsTier2Discount },
      { points: settings.rewardsTier3Points, discount: settings.rewardsTier3Discount },
    ].filter(tier => tier.points > 0 && tier.discount > 0).sort((a, b) => a.points - b.points),
    [settings],
  );

  const nextTier = useMemo(
    () => rewardTiers.find(tier => (matchedProfile?.currentPoints ?? 0) < tier.points),
    [rewardTiers, matchedProfile],
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError('Enter the phone number you use for rewards.');
      return;
    }

    setSubmittedPhone(phone);
    localStorage.setItem(STORAGE_KEY, phone);

    const profileExists = rewardProfiles.some(profile => normalizePhone(profile.phone) === normalizedPhone);
    if (!profileExists) {
      setError('No rewards profile was found for that phone number yet. Place an order with rewards turned on first.');
    }
  };

  const handleSignOut = () => {
    setSubmittedPhone('');
    setPhone('');
    setError('');
    setCopiedState('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const currentReferralCode = matchedProfile ? ensureRewardProfileReferralCode(matchedProfile) : '';
  const shareText = currentReferralCode ? `Use my Candy Crackzzz referral code: ${currentReferralCode}` : '';

  const copyText = async (value: string, type: 'code' | 'share') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedState(type);
      window.setTimeout(() => setCopiedState(''), 1800);
    } catch {
      setCopiedState('');
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Gift className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Rewards Login</h1>
            </div>
            <p className="text-muted-foreground font-bold max-w-2xl mx-auto">Track your points, see your referral code, and check your recent rewards activity using the phone number tied to your orders.</p>
          </div>

          <div className="max-w-xl mx-auto bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <Label className="font-bold">Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Enter your rewards phone number" className="bg-background mt-2 h-12 font-bold" />
              </div>
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-bold px-4 py-3 rounded-lg">{error}</div>}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="font-black uppercase tracking-wider"><Search className="w-4 h-4 mr-2" /> Look Up Rewards</Button>
                {submittedPhone && <Button type="button" variant="outline" onClick={handleSignOut} className="font-black uppercase tracking-wider"><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>}
              </div>
            </form>
          </div>

          {matchedProfile && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Current Points</div>
                  <div className="text-3xl font-black text-primary">{matchedProfile.currentPoints}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Lifetime Earned</div>
                  <div className="text-3xl font-black">{matchedProfile.lifetimePointsEarned}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Successful Referrals</div>
                  <div className="text-3xl font-black text-secondary">{matchedProfile.successfulReferralCount ?? 0}</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Referral Points Earned</div>
                  <div className="text-3xl font-black">{matchedProfile.lifetimeReferralPointsEarned ?? 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /><h2 className="text-2xl font-black uppercase tracking-wider">Rewards Snapshot</h2></div>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-black">Name:</span> {matchedProfile.customerName}</div>
                    <div><span className="font-black">Phone:</span> {matchedProfile.phone}</div>
                    {matchedProfile.email && <div><span className="font-black">Email:</span> {matchedProfile.email}</div>}
                    <div><span className="font-black">Referral Code:</span> <span className="text-primary font-black tracking-wider">{currentReferralCode}</span></div>
                    {matchedProfile.referredByCode && <div><span className="font-black">Referred By:</span> {matchedProfile.referredByCode}</div>}
                    <div><span className="font-black">Total Completed Orders:</span> {matchedProfile.totalOrders}</div>
                    {matchedProfile.lastOrderDate && <div><span className="font-black">Last Order:</span> {new Date(matchedProfile.lastOrderDate).toLocaleString()}</div>}
                  </div>
                  {nextTier ? (
                    <div className="bg-background border border-border rounded-2xl p-4 text-sm">
                      <p className="font-bold">{Math.max(0, nextTier.points - matchedProfile.currentPoints)} more points until your next reward.</p>
                      <p className="text-muted-foreground mt-1">Next reward: {nextTier.points} points = ${nextTier.discount} off.</p>
                    </div>
                  ) : (
                    <div className="bg-background border border-border rounded-2xl p-4 text-sm font-bold">You have reached the top listed reward tier.</div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2"><Users className="w-5 h-5 text-secondary" /><h2 className="text-2xl font-black uppercase tracking-wider">Referral Program</h2></div>
                  <p className="text-sm text-muted-foreground">Share your referral code with friends. When eligible referral orders are completed, bonus points can be awarded to both sides.</p>
                  <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Share This Code</div>
                      <div className="text-2xl font-black tracking-[0.15em] text-primary">{currentReferralCode}</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => void copyText(currentReferralCode, 'code')} className="font-black uppercase tracking-wider">
                        <Copy className="w-4 h-4 mr-2" /> {copiedState === 'code' ? 'Copied' : 'Copy Code'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void copyText(shareText, 'share')} className="font-black uppercase tracking-wider">
                        <Copy className="w-4 h-4 mr-2" /> {copiedState === 'share' ? 'Copied' : 'Copy Share Text'}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground border border-border rounded-xl p-3 bg-card/50">{shareText}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-background border border-border rounded-2xl p-4">
                      <div className="font-black">Friend bonus</div>
                      <div className="text-muted-foreground mt-1">{settings.referralReferredCustomerBonusPoints} bonus points on the first eligible completed order.</div>
                    </div>
                    <div className="bg-background border border-border rounded-2xl p-4">
                      <div className="font-black">Your bonus</div>
                      <div className="text-muted-foreground mt-1">{settings.referralReferrerBonusPoints} bonus points when their first eligible order completes.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <h2 className="text-2xl font-black uppercase tracking-wider">Recent Rewards History</h2>
                  {matchedProfile.rewardsHistory.length === 0 ? (
                    <div className="text-sm font-bold text-muted-foreground">No rewards activity yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {matchedProfile.rewardsHistory.slice(0, 10).map(entry => (
                        <div key={entry.id} className="bg-background border border-border rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-black uppercase text-sm">{entry.type}</div>
                              <div className="text-xs text-muted-foreground mt-1">{new Date(entry.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="text-xl font-black text-primary">{entry.points} pts</div>
                          </div>
                          {entry.note && <div className="text-sm text-muted-foreground mt-2">{entry.note}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <h2 className="text-2xl font-black uppercase tracking-wider">Recent Orders</h2>
                  {customerOrders.length === 0 ? (
                    <div className="text-sm font-bold text-muted-foreground">No orders found for this rewards account yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.slice(0, 8).map(order => (
                        <div key={order.id} className="bg-background border border-border rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="font-black">{new Date(order.createdAt).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground mt-1 uppercase">{order.status}</div>
                            </div>
                            <div className="text-lg font-black text-primary">${order.total.toFixed(2)}</div>
                          </div>
                          {order.referralCodeUsed && <div className="text-sm text-secondary font-bold mt-2">Referral code used: {order.referralCodeUsed}</div>}
                          {typeof order.rewardsPointsAwarded === 'number' && order.rewardsAwardedAt && <div className="text-sm text-muted-foreground mt-1">Rewards awarded: {order.rewardsPointsAwarded} pts</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
