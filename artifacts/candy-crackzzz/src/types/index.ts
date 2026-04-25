export type ProductCategory = 'candy-grapes' | 'candy-pineapple' | 'party-trays' | 'seasonal' | 'custom';
export type OrderStatus = 'new' | 'pending' | 'confirmed' | 'ready' | 'picked-up' | 'completed' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  shortDescription: string;
  price: number | null;
  imageUrl: string;
  flavorNotes: string;
  colorThemeNotes: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
  isCustomEligible: boolean;
  isSoldOut: boolean;
  isVisible: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number | null;
  quantity: number;
  imageUrl: string;
  specialInstructions?: string;
  eventType?: string;
  colorThemeNotes?: string;
  itemType?: 'candy' | 'merch';
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number | null;
  itemType?: 'candy' | 'merch';
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderRequest {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  requestedDate: string;
  requestedTime: string;
  pickupOrDelivery: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes: string;
  specialInstructions: string;
  eventType: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod?: string;
  rewardsOptIn?: boolean;
  smsMarketingOptIn?: boolean;
  referralCodeUsed?: string;
  rewardsPointsAwarded?: number;
  rewardsAwardedAt?: string;
  referralReferrerPointsAwarded?: number;
  referralReferredCustomerPointsAwarded?: number;
  referralAwardedAt?: string;
  total: number;
  createdAt: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'hidden';
  isFeatured: boolean;
}

export interface AdminAccount {
  username: string;
  passwordHash: string;
}

export type AdminRole = 'owner' | 'employee';
export type AdminUserStatus = 'active' | 'disabled';
export type AdminActivityStatus = 'active' | 'logged_out' | 'forced_logout';

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: AdminRole;
  status: AdminUserStatus;
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface AdminSession {
  userId: string;
  activityId?: string;
  startedAt?: string;
}

export interface AdminActivityEntry {
  id: string;
  userId: string;
  username: string;
  role: AdminRole;
  loginAt: string;
  logoutAt?: string;
  durationMs?: number;
  status: AdminActivityStatus;
}

export type RewardsEntryType = 'earned' | 'redeemed' | 'adjusted' | 'bonus';

export interface RewardsHistoryEntry {
  id: string;
  type: RewardsEntryType;
  points: number;
  orderId?: string;
  note?: string;
  createdAt: string;
}

export interface RewardProfile {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  birthdayMonth?: string;
  birthdayDay?: string;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  tags?: string[];
  currentPoints: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  totalOrders: number;
  lifetimeSpend?: number;
  lastOrderDate?: string;
  smsMarketingOptIn: boolean;
  referralCode?: string;
  referredByCode?: string;
  successfulReferralCount?: number;
  lifetimeReferralPointsEarned?: number;
  rewardsHistory: RewardsHistoryEntry[];
}

// ----------- Merch -----------

export type MerchStatus = 'available' | 'coming-soon' | 'out-of-stock' | 'limited';
export type MerchCategory = 'apparel' | 'accessories' | 'drinkware' | 'stickers' | 'home' | 'vendor' | 'other';

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  category: MerchCategory;
  price: number | null;
  salePrice: number | null;
  imageUrl: string;
  status: MerchStatus;
  inventory: number;
  showInventory: boolean;
  isFeatured: boolean;
  isActive: boolean;
  allowPoints: boolean;
  allowFullPointsPurchase: boolean;
  pointsRequired: number;
  maxPointsAllowed: number;
  minPointsToRedeem: number;
  sizes: string[];
  colors: string[];
  pickupShippingNote: string;
  sortOrder: number;
  createdAt: string;
}

// ----------- Rewards Campaigns -----------

export type CampaignType = 'birthday' | 'holiday' | 'manual' | 'milestone' | 'winback' | 'multiplier';
export type RewardType = 'dollar-off' | 'percent-off' | 'free-item' | 'bonus-points' | 'points-multiplier' | 'free-merch';
export type CampaignSendMethod = 'in-app' | 'email' | 'sms' | 'qr-code';

export interface RewardsCampaign {
  id: string;
  name: string;
  type: CampaignType;
  rewardType: RewardType;
  rewardValue: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  expirationDays: number;
  usageLimit: number;
  onePerCustomer: boolean;
  minimumOrderAmount: number;
  appliesTo: 'all' | 'candy' | 'merch';
  targetGroups: string[];
  messageTemplate: string;
  holidayName?: string;
  birthdayWindowDaysBefore?: number;
  birthdayWindowDaysAfter?: number;
  milestoneOrders?: number;
  milestoneSpend?: number;
  winbackDays?: number;
  multiplierValue?: number;
  sendMethods: CampaignSendMethod[];
  showOnHomepage: boolean;
  showAtCheckout: boolean;
  showInWallet: boolean;
  createdAt: string;
}

// ----------- Settings -----------

export interface Settings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  orderDestinationEmail: string;
  orderNotificationPhone: string;
  contactDestinationEmail: string;
  serviceArea: string;
  aboutText: string;
  socialLinks: SocialLinks;
  enableOrdering: boolean;
  enableCustomOrders: boolean;
  enableSeasonalSection: boolean;
  enableGallery: boolean;
  enableFeaturedSection: boolean;
  enableMerch: boolean;
  enablePickup: boolean;
  enableDelivery: boolean;
  deliveryFeeEnabled: boolean;
  deliveryFeeAmount: number;
  minimumOrder: number;
  showPricesPublicly: boolean;
  showSoldOutItems: boolean;
  allowRequestWithoutPrice: boolean;
  enableRewards: boolean;
  rewardsPointsPerDollar: number;
  rewardsAwardOnCompletedOrder: boolean;
  rewardsAllowPromoStacking: boolean;
  rewardsTier1Points: number;
  rewardsTier1Discount: number;
  rewardsTier2Points: number;
  rewardsTier2Discount: number;
  rewardsTier3Points: number;
  rewardsTier3Discount: number;
  rewardsDoublePointsEnabled: boolean;
  rewardsFirstOrderBonusEnabled: boolean;
  rewardsFirstOrderBonusPoints: number;
  rewardsBirthdayBonusEnabled: boolean;
  rewardsBirthdayBonusPoints: number;
  rewardsSpendThresholdEnabled: boolean;
  rewardsSpendThresholdAmount: number;
  rewardsSpendThresholdBonusPoints: number;
  enableReferrals: boolean;
  referralReferrerBonusPoints: number;
  referralReferredCustomerBonusPoints: number;
  referralBonusOnFirstCompletedOrder: boolean;
  referralProgramDescription: string;
  enablePromoTexts: boolean;
  promoTextsDescription: string;
  enablePayments: boolean;
  enableSquare: boolean;
  squarePaymentLink: string;
  squareInstructions: string;
  enableStripe: boolean;
  stripePaymentLink: string;
  stripeInstructions: string;
  enablePayPal: boolean;
  paypalContact: string;
  paypalInstructions: string;
  enableCashApp: boolean;
  cashAppTag: string;
  cashAppInstructions: string;
  enableVenmo: boolean;
  venmoUsername: string;
  venmoInstructions: string;
  enableZelle: boolean;
  zelleContact: string;
  zelleInstructions: string;
  enableQRCode: boolean;
  qrCodeImageBase64: string;
  qrCodeInstructions: string;
  enableManualInvoice: boolean;
  manualInvoiceInstructions: string;
  enableCashAtPickup: boolean;
  cashAtPickupInstructions: string;
  allowDepositOnly: boolean;
  allowFullPayment: boolean;
  allowCashAtPickup: boolean;
  allowManualInvoice: boolean;
  paymentInstructions: string;
  logoBase64: string;
  showLogo: boolean;
}
