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
