export const CURRENCIES = [
  // Europe
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Livre sterling", symbol: "£" },
  { code: "CHF", name: "Franc suisse", symbol: "CHF" },

  // Afrique
  { code: "XAF", name: "Franc CFA CEMAC", symbol: "FCFA" },
  { code: "XOF", name: "Franc CFA UEMOA", symbol: "CFA" },
  { code: "CDF", name: "Franc congolais", symbol: "FC" },
  { code: "NGN", name: "Naira nigérian", symbol: "₦" },
  { code: "GHS", name: "Cedi ghanéen", symbol: "GH₵" },
  { code: "ZAR", name: "Rand sud-africain", symbol: "R" },
  { code: "KES", name: "Shilling kényan", symbol: "KSh" },
  { code: "UGX", name: "Shilling ougandais", symbol: "USh" },
  { code: "TZS", name: "Shilling tanzanien", symbol: "TSh" },
  { code: "RWF", name: "Franc rwandais", symbol: "FRw" },

  // Amérique
  { code: "USD", name: "Dollar américain", symbol: "$" },
  { code: "CAD", name: "Dollar canadien", symbol: "CA$" },
  { code: "BRL", name: "Réal brésilien", symbol: "R$" },
  { code: "MXN", name: "Peso mexicain", symbol: "MX$" },

  // Caraïbes
  { code: "HTG", name: "Gourde haïtienne", symbol: "G" },

  // Océanie
  { code: "AUD", name: "Dollar australien", symbol: "A$" },
  { code: "NZD", name: "Dollar néo-zélandais", symbol: "NZ$" },
];

export const getCurrency = (code) =>
  CURRENCIES.find(
    (currency) => currency.code === code
  );

export const formatCurrency = (
  amount,
  currency = "EUR"
) => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(Number(amount || 0));
  } catch {
    const selectedCurrency =
      getCurrency(currency);

    return `${Number(
      amount || 0
    ).toLocaleString("fr-FR")} ${
      selectedCurrency?.symbol || currency
    }`;
  }
};