import type { MerchItem, Product, Settings } from '@/types';

export type HelperReply = { reply: string; recommendations: Array<{ kind: 'product' | 'merch'; id: string; name: string; note?: string }> };

const keywordMap = [
  { key: 'blue raspberry', tokens: ['blue raspberry'], labels: ['blue raspberry'] },
  { key: 'strawberry', tokens: ['strawberry'], labels: ['strawberry'] },
  { key: 'mango', tokens: ['mango'], labels: ['mango', 'tropical'] },
  { key: 'habanero', tokens: ['habanero', 'spicy'], labels: ['spicy'] },
  { key: 'pineapple', tokens: ['pineapple', 'tropical'], labels: ['pineapple', 'tropical'] },
  { key: 'grapes', tokens: ['grapes', 'candy grapes'], labels: ['grapes'] },
  { key: 'shirt', tokens: ['shirt', 'tee', 't-shirt'], labels: ['shirt', 'tee'] },
  { key: 'hoodie', tokens: ['hoodie'], labels: ['hoodie'] },
  { key: 'hat', tokens: ['hat', 'cap'], labels: ['hat', 'cap'] },
  { key: 'tumbler', tokens: ['tumbler', 'cup', 'drinkware'], labels: ['tumbler'] },
  { key: 'sticker', tokens: ['sticker'], labels: ['sticker'] },
  { key: 'apron', tokens: ['apron'], labels: ['apron'] },
  { key: 'tote', tokens: ['tote', 'bag'], labels: ['tote'] },
];

export function buildHelperResponse(input: string, products: Product[], merch: MerchItem[], settings: Settings): HelperReply {
  const text = input.toLowerCase();
  const recommendations: HelperReply['recommendations'] = [];
  const productMatches = products.filter((p) => p.isVisible && p.isAvailable && !p.isSoldOut);
  const merchMatches = merch.filter((m) => m.isActive && m.status !== 'out-of-stock');
  const wantsMerch = /merch|shirt|hoodie|hat|tumbler|sticker|apron|tote/.test(text);
  const wantsCustom = /custom|tray|party|birthday|gift|holiday/.test(text);
  const wantsRewards = /points|rewards|referral/.test(text);
  const wantsDelivery = /delivery|pickup/.test(text);

  const reasons: string[] = [];
  if (/sweet|fruity|strawberry|cherry/.test(text)) reasons.push('sweet fruit flavors');
  if (/sour/.test(text)) reasons.push('sour candy flavors');
  if (/spicy|habanero/.test(text)) reasons.push('sweet-heat combos');
  if (/tropical|pineapple|mango/.test(text)) reasons.push('tropical flavors');
  if (/blue raspberry/.test(text)) reasons.push('blue raspberry');

  const topProducts = productMatches.filter((p) => reasons.some((r) => `${p.name} ${p.description} ${p.flavorNotes}`.toLowerCase().includes(r))).slice(0, settings.helperMaxRecommendations);
  const topMerch = merchMatches.filter((m) => keywordMap.some((k) => k.tokens.some((t) => text.includes(t)) && `${m.name} ${m.description} ${m.category}`.toLowerCase().includes(k.key))).slice(0, settings.helperMaxRecommendations);

  topProducts.forEach((p) => recommendations.push({ kind: 'product', id: p.id, name: p.name }));
  if (settings.helperAllowMerchSuggestions && wantsMerch) topMerch.forEach((m) => recommendations.push({ kind: 'merch', id: m.id, name: m.name }));

  let reply = settings.helperGreeting;
  if (wantsCustom && settings.helperAllowCustomOrderIdeas) reply = 'For a custom order, try a party tray with mixed grapes, pineapple, or a seasonal mix. Tell me your flavor vibe and I’ll narrow it down.';
  if (wantsRewards && settings.helperAllowRewardsSuggestions) reply = 'Rewards can help you save on future orders. Referral and points options may be available in your account.';
  if (wantsDelivery) reply += ' If you choose delivery, you can confirm the address before submitting.';
  if (!recommendations.length) reply = settings.helperFallbackMessage;
  return { reply, recommendations: recommendations.slice(0, settings.helperMaxRecommendations) };
}