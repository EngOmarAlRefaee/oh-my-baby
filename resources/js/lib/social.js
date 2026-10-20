// Official social links. Edit here if an account changes.
export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/groups/1042887453657177/?ref=share&mibextid=CTbP7E",
  instagram: "https://www.instagram.com/ohmybaby28?igsh=MTU1dWJzN2d5ajF1cg==",
  // WhatsApp opens a chat with this number (country code, digits only).
  whatsappNumber: "963968210973",
};

export function whatsappLink(message = "") {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${SOCIAL_LINKS.whatsappNumber}${text}`;
}

export function socialUrl(network) {
  if (network === "facebook") return SOCIAL_LINKS.facebook;
  if (network === "instagram") return SOCIAL_LINKS.instagram;
  if (network === "whatsapp") return whatsappLink();
  return null;
}
