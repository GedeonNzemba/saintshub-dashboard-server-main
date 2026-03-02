# 📞 Contact Management API - SaintsHub

**Complete guide for managing church contact information**

**Version:** 2.1.0  
**Last Updated:** November 1, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Contact Data Structure](#contact-data-structure)
3. [API Endpoints](#api-endpoints)
4. [Validation Rules](#validation-rules)
5. [Frontend Integration](#frontend-integration)
6. [Migration Guide](#migration-guide)

---

## 🌟 Overview

The Contact Management system provides comprehensive contact information storage for churches, including:

- ✅ **Primary Contact:** Phone, email, website
- ✅ **Social Media:** Facebook, Twitter, Instagram, YouTube
- ✅ **Messaging Apps:** WhatsApp, Telegram
- ✅ **Structured Address:** Street, city, state, zip code, country
- ✅ **Church Details:** Denomination, description
- ✅ **Backward Compatibility:** Legacy fields automatically synced

---

## 📊 Contact Data Structure

### New Structured Format

```typescript
interface ContactInfo {
  phoneNumber?: string;      // Primary phone number
  email?: string;            // Primary email address
  website?: string;          // Church website URL
  facebook?: string;         // Facebook page URL
  twitter?: string;          // Twitter/X profile URL
  instagram?: string;        // Instagram profile URL
  youtube?: string;          // YouTube channel URL
  whatsapp?: string;         // WhatsApp number
  telegram?: string;         // Telegram handle/link
}

interface Address {
  street?: string;           // Street address
  city?: string;             // City name
  state?: string;            // State/Province
  zipCode?: string;          // ZIP/Postal code
  country?: string;          // Country name
}

interface Church {
  _id: string;
  name: string;
  // ... other church fields ...
  
  // Enhanced contact (NEW)
  contact?: ContactInfo;
  
  // Structured address (NEW)
  address?: Address;
  
  // Church details
  denomination?: string;
  description?: string;      // About the church
  
  // Legacy fields (maintained for backward compatibility)
  phoneNumber?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
}
```

---

## 🚀 API Endpoints

### 1. Update Church Contact Information

**PATCH** `/api/dashboard/churches/:id/contact`

**Authentication:** Required (Owner only)

**Purpose:** Update contact information, address, and church details

**Request Body:** (All fields optional)

```json
{
  "contact": {
    "phoneNumber": "+1 (555) 123-4567",
    "email": "info@gracechurch.com",
    "website": "https://www.gracechurch.com",
    "facebook": "https://facebook.com/gracechurch",
    "twitter": "https://twitter.com/gracechurch",
    "instagram": "https://instagram.com/gracechurch",
    "youtube": "https://youtube.com/@gracechurch",
    "whatsapp": "+15551234567",
    "telegram": "@gracechurch"
  },
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  "denomination": "Baptist",
  "description": "Grace Community Church is a welcoming congregation serving the New York community since 1950. We believe in the power of faith, community, and service."
}
```

**Response (200 OK):**

```json
{
  "message": "Church contact information updated successfully",
  "church": {
    "_id": "507f191e810c19729de860ea",
    "name": "Grace Community Church",
    "contact": {
      "phoneNumber": "+1 (555) 123-4567",
      "email": "info@gracechurch.com",
      "website": "https://www.gracechurch.com",
      "facebook": "https://facebook.com/gracechurch",
      "twitter": "https://twitter.com/gracechurch",
      "instagram": "https://instagram.com/gracechurch",
      "youtube": "https://youtube.com/@gracechurch",
      "whatsapp": "+15551234567",
      "telegram": "@gracechurch"
    },
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "United States"
    },
    "denomination": "Baptist",
    "description": "Grace Community Church is a welcoming congregation...",
    // Legacy fields auto-synced
    "phoneNumber": "+1 (555) 123-4567",
    "email": "info@gracechurch.com",
    "website": "https://www.gracechurch.com",
    "city": "New York",
    "state": "NY"
  }
}
```

**Errors:**
- `400` - Validation error (invalid URL, phone format, etc.)
- `401` - Not authenticated
- `403` - Not church owner
- `404` - Church not found
- `500` - Server error

---

### 2. Get Church Contact Information

**GET** `/api/dashboard/churches/:id/contact`

**Authentication:** Required

**Purpose:** Retrieve only contact-related information

**Response (200 OK):**

```json
{
  "churchName": "Grace Community Church",
  "contact": {
    "phoneNumber": "+1 (555) 123-4567",
    "email": "info@gracechurch.com",
    "website": "https://www.gracechurch.com",
    "facebook": "https://facebook.com/gracechurch",
    "twitter": "https://twitter.com/gracechurch",
    "instagram": "https://instagram.com/gracechurch",
    "youtube": "https://youtube.com/@gracechurch",
    "whatsapp": "+15551234567",
    "telegram": "@gracechurch"
  },
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  "denomination": "Baptist",
  "description": "Grace Community Church is a welcoming congregation..."
}
```

**Use Cases:**
- Display contact page in mobile app
- Pre-fill contact forms
- Show contact card
- Generate vCard/contact export

---

### 3. Create Church with Contact Info

**POST** `/api/dashboard/create-church`

**Authentication:** Required (Admin only)

**Request Body:** (Contact fields optional)

```json
{
  "name": "Grace Community Church",
  "location": "123 Main St, New York, NY 10001",
  "principal": { ... },
  "logo": "https://...",
  "image": "https://...",
  
  // NEW: Contact information
  "contact": {
    "phoneNumber": "+1 (555) 123-4567",
    "email": "info@gracechurch.com",
    "website": "https://www.gracechurch.com",
    "facebook": "https://facebook.com/gracechurch",
    "instagram": "https://instagram.com/gracechurch",
    "youtube": "https://youtube.com/@gracechurch"
  },
  
  // NEW: Structured address
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States"
  },
  
  "denomination": "Baptist",
  "description": "About our church..."
}
```

---

## ✅ Validation Rules

### Phone Number Validation

**Format:** Numbers, spaces, hyphens, plus signs, parentheses  
**Max Length:** 20 characters  
**Examples:**
- ✅ `+1 (555) 123-4567`
- ✅ `555-123-4567`
- ✅ `+44 20 1234 5678`
- ❌ `abc-123-4567` (contains letters)

### Email Validation

**Format:** Valid email address (RFC 5322)  
**Examples:**
- ✅ `info@church.com`
- ✅ `contact+info@church.org`
- ❌ `invalid.email` (no @)
- ❌ `@church.com` (no local part)

### URL Validation (Website, Social Media)

**Format:** Must include protocol (`http://` or `https://`)  
**Examples:**
- ✅ `https://www.church.com`
- ✅ `https://facebook.com/churchpage`
- ❌ `www.church.com` (no protocol)
- ❌ `church.com` (no protocol)

### Description Validation

**Max Length:** 2000 characters  
**Format:** Plain text or HTML (sanitized on frontend)

---

## 📱 Frontend Integration

### React Native Example - Update Contact

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { URI_domain } from "@/utilities/tools";

const updateChurchContact = async (churchId: string, contactData: any) => {
  try {
    const token = await AsyncStorage.getItem("token");
    
    const response = await fetch(
      `${URI_domain}/api/dashboard/churches/${churchId}/contact`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update contact");
    }

    const data = await response.json();
    return data.church;
  } catch (error) {
    console.error("Error updating church contact:", error);
    throw error;
  }
};

// Usage
const contactData = {
  contact: {
    phoneNumber: "+1 (555) 123-4567",
    email: "info@church.com",
    website: "https://church.com",
    facebook: "https://facebook.com/church",
    instagram: "https://instagram.com/church"
  },
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  denomination: "Baptist",
  description: "About our church..."
};

const updatedChurch = await updateChurchContact(churchId, contactData);
```

### Fetch Contact Information

```typescript
const getChurchContact = async (churchId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    
    const response = await fetch(
      `${URI_domain}/api/dashboard/churches/${churchId}/contact`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch contact information");
    }

    const contactInfo = await response.json();
    return contactInfo;
  } catch (error) {
    console.error("Error fetching church contact:", error);
    throw error;
  }
};
```

### ContactSection Component Integration

```typescript
// In your ContactSection component
import React, { useState, useEffect } from "react";

interface ContactSectionProps {
  church: Church;
  setChurch: (church: Church) => void;
  isReadOnly: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  church,
  setChurch,
  isReadOnly,
}) => {
  const handleContactChange = (field: string, value: string) => {
    setChurch({
      ...church,
      contact: {
        ...church.contact,
        [field]: value,
      },
    });
  };

  const handleAddressChange = (field: string, value: string) => {
    setChurch({
      ...church,
      address: {
        ...church.address,
        [field]: value,
      },
    });
  };

  return (
    <View>
      {/* Primary Contact */}
      <TextInput
        label="Phone Number"
        value={church.contact?.phoneNumber || ""}
        onChangeText={(value) => handleContactChange("phoneNumber", value)}
        editable={!isReadOnly}
        placeholder="+1 (555) 123-4567"
      />
      
      <TextInput
        label="Email Address"
        value={church.contact?.email || ""}
        onChangeText={(value) => handleContactChange("email", value)}
        editable={!isReadOnly}
        keyboardType="email-address"
        placeholder="info@church.com"
      />
      
      <TextInput
        label="Website"
        value={church.contact?.website || ""}
        onChangeText={(value) => handleContactChange("website", value)}
        editable={!isReadOnly}
        placeholder="https://www.church.com"
      />

      {/* Social Media */}
      <Text style={styles.sectionTitle}>Social Media</Text>
      
      <TextInput
        label="Facebook"
        value={church.contact?.facebook || ""}
        onChangeText={(value) => handleContactChange("facebook", value)}
        editable={!isReadOnly}
        placeholder="https://facebook.com/church"
      />
      
      <TextInput
        label="Instagram"
        value={church.contact?.instagram || ""}
        onChangeText={(value) => handleContactChange("instagram", value)}
        editable={!isReadOnly}
        placeholder="https://instagram.com/church"
      />
      
      <TextInput
        label="YouTube"
        value={church.contact?.youtube || ""}
        onChangeText={(value) => handleContactChange("youtube", value)}
        editable={!isReadOnly}
        placeholder="https://youtube.com/@church"
      />

      {/* Address */}
      <Text style={styles.sectionTitle}>Address</Text>
      
      <TextInput
        label="Street Address"
        value={church.address?.street || ""}
        onChangeText={(value) => handleAddressChange("street", value)}
        editable={!isReadOnly}
        placeholder="123 Main Street"
      />
      
      <TextInput
        label="City"
        value={church.address?.city || ""}
        onChangeText={(value) => handleAddressChange("city", value)}
        editable={!isReadOnly}
        placeholder="New York"
      />
      
      <TextInput
        label="State"
        value={church.address?.state || ""}
        onChangeText={(value) => handleAddressChange("state", value)}
        editable={!isReadOnly}
        placeholder="NY"
      />
      
      <TextInput
        label="ZIP Code"
        value={church.address?.zipCode || ""}
        onChangeText={(value) => handleAddressChange("zipCode", value)}
        editable={!isReadOnly}
        placeholder="10001"
      />
    </View>
  );
};
```

---

## 🔄 Migration Guide

### For Existing Churches

Churches created before this update will automatically work with the new system:

1. **Legacy fields preserved:** `phoneNumber`, `email`, `website`, `city`, `state`
2. **Auto-sync on save:** When updating via new `contact` object, legacy fields update automatically
3. **Backward compatible:** Old API calls still work with legacy fields

### Migrating to New Format

```typescript
// Option 1: Use dedicated contact endpoint (recommended)
const migrateContact = async (churchId: string, church: any) => {
  const contactData = {
    contact: {
      phoneNumber: church.phoneNumber,
      email: church.email,
      website: church.website,
    },
    address: {
      city: church.city,
      state: church.state,
    },
  };
  
  await updateChurchContact(churchId, contactData);
};

// Option 2: Update via main church update endpoint
const migrateViaMainEndpoint = async (churchId: string, church: any) => {
  const updatedData = {
    ...church,
    contact: {
      phoneNumber: church.phoneNumber,
      email: church.email,
      website: church.website,
    },
    address: {
      city: church.city,
      state: church.state,
    },
  };
  
  await fetch(`${URI_domain}/api/dashboard/churches/${churchId}`, {
    method: "PATCH",
    headers: { /* ... */ },
    body: JSON.stringify(updatedData),
  });
};
```

---

## 📝 Best Practices

### 1. Always Validate URLs

```typescript
const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
};

// Before saving
if (websiteURL && !validateURL(websiteURL)) {
  Alert.alert("Invalid URL", "Please enter a valid URL starting with http:// or https://");
  return;
}
```

### 2. Format Phone Numbers Consistently

```typescript
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Format for US numbers: +1 (555) 123-4567
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  
  return cleaned;
};
```

### 3. Cache Contact Information

```typescript
// Cache contact info for offline access
const cacheContactInfo = async (churchId: string, contactInfo: any) => {
  await AsyncStorage.setItem(
    `church_contact_${churchId}`,
    JSON.stringify(contactInfo)
  );
};

// Retrieve from cache
const getCachedContact = async (churchId: string) => {
  const cached = await AsyncStorage.getItem(`church_contact_${churchId}`);
  return cached ? JSON.parse(cached) : null;
};
```

### 4. Provide Social Media Icons

```typescript
import { FontAwesome5 } from "@expo/vector-icons";

const SocialMediaLinks = ({ contact }: { contact: ContactInfo }) => (
  <View style={styles.socialMedia}>
    {contact.facebook && (
      <TouchableOpacity onPress={() => Linking.openURL(contact.facebook)}>
        <FontAwesome5 name="facebook" size={24} color="#1877F2" />
      </TouchableOpacity>
    )}
    {contact.instagram && (
      <TouchableOpacity onPress={() => Linking.openURL(contact.instagram)}>
        <FontAwesome5 name="instagram" size={24} color="#E4405F" />
      </TouchableOpacity>
    )}
    {contact.youtube && (
      <TouchableOpacity onPress={() => Linking.openURL(contact.youtube)}>
        <FontAwesome5 name="youtube" size={24} color="#FF0000" />
      </TouchableOpacity>
    )}
  </View>
);
```

---

## 🎯 Summary

The Contact Management API provides:

✅ **Comprehensive contact storage** with social media integration  
✅ **Structured address data** for better location management  
✅ **Automatic validation** of URLs, emails, phone numbers  
✅ **Backward compatibility** with legacy fields  
✅ **Dedicated endpoints** for contact operations  
✅ **Cache invalidation** for real-time updates  

For questions or issues, refer to the main API documentation: `API_REFERENCE_2025.md`

---

**End of Contact Management API Documentation** 🎉
