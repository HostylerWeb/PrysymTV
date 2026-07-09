export type BuyerDetails = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

export const EMPTY_BUYER_DETAILS: BuyerDetails = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  countryCode: 'US',
};

export function isBuyerDetailsComplete(d: BuyerDetails): boolean {
  return Boolean(
    d.fullName.trim() &&
      d.phone.trim() &&
      d.line1.trim() &&
      d.city.trim() &&
      d.postalCode.trim() &&
      d.countryCode.trim().length === 2,
  );
}

export type BuyerDetailsSource = {
  buyerFullName?: string | null;
  buyerPhone?: string | null;
  buyerAddressLine1?: string | null;
  buyerAddressLine2?: string | null;
  buyerCity?: string | null;
  buyerState?: string | null;
  buyerPostalCode?: string | null;
  buyerCountryCode?: string | null;
};

export function buyerDetailsFromUser(user: BuyerDetailsSource | null | undefined): BuyerDetails {
  if (!user) return { ...EMPTY_BUYER_DETAILS };
  return {
    fullName: user.buyerFullName ?? '',
    phone: user.buyerPhone ?? '',
    line1: user.buyerAddressLine1 ?? '',
    line2: user.buyerAddressLine2 ?? '',
    city: user.buyerCity ?? '',
    state: user.buyerState ?? '',
    postalCode: user.buyerPostalCode ?? '',
    countryCode: user.buyerCountryCode ?? 'US',
  };
}

export function buyerDetailsToUpdateMeBody(details: BuyerDetails) {
  return {
    buyerFullName: details.fullName.trim(),
    buyerPhone: details.phone.trim(),
    buyerAddressLine1: details.line1.trim(),
    buyerAddressLine2: details.line2.trim() || undefined,
    buyerCity: details.city.trim(),
    buyerState: details.state.trim() || undefined,
    buyerPostalCode: details.postalCode.trim(),
    buyerCountryCode: details.countryCode.trim().toUpperCase(),
  };
}

export function shippingAddressFromBuyer(details: BuyerDetails) {
  return {
    fullName: details.fullName.trim(),
    phone: details.phone.trim(),
    line1: details.line1.trim(),
    line2: details.line2.trim() || undefined,
    city: details.city.trim(),
    state: details.state.trim() || undefined,
    postalCode: details.postalCode.trim(),
    countryCode: details.countryCode.trim().toUpperCase(),
  };
}
