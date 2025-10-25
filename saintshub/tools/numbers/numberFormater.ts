export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-numeric characters from the phone number
  const numericPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Check if the phone number is empty or not a valid number
  if (!numericPhoneNumber) {
    return "Invalid Phone Number";
  }

  // Format the phone number as desired, for example: (XXX) XXX-XXXX
  const formattedPhoneNumber = `(${numericPhoneNumber.slice(0, 3)}) ${numericPhoneNumber.slice(3, 6)}-${numericPhoneNumber.slice(6)}`;

  return formattedPhoneNumber;
};

// Example usage
const phoneNumber = "1234567890";
const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
