export const formatCurrency = (amount: number, currencyCode: string = "USD"): string => {
  try {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);

    return formattedAmount;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "Invalid Currency Format";
  }
};

// Example usage
const amount = 12345.67;
const formattedCurrency = formatCurrency(amount, "USD");
