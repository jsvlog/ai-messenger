// ============================================================
// Industry Config — Tailored KB fields, AI prompts, lead capture per business type
// This is the brain that makes AI Messenger industry-aware.
// ============================================================

export interface IndustryField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  required?: boolean;
}

export interface IndustryPackageField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number';
  required?: boolean;
}

export interface IndustryConfig {
  id: string;
  label: string;
  icon: string;
  tagline: string;
  // Business info fields
  bizFields: IndustryField[];
  // Package/service fields (repeatable)
  packageLabel: string; // "Package" or "Service" or "Item"
  packageFields: IndustryPackageField[];
  // Menu/items section
  itemsLabel: string; // "Menu Items" or "Service List" or "Inventory"
  itemCategories: string[];
  // Policies section
  policyFields: IndustryField[];
  // AI prompt specialization
  aiSpecialty: string;
  aiKnows: string[];
  aiConversationFlow: string[];
  aiCaptureFields: { label: string; question: string; priority: number }[];
  // Landing page example
  exampleCustomer: string;
  exampleAI: string;
}

export const INDUSTRIES: IndustryConfig[] = [
  // ============================================================
  // 1. CATERING & FOOD
  // ============================================================
  {
    id: 'catering',
    label: 'Catering & Food',
    icon: '🍽️',
    tagline: 'Caterers, food packages, buffet, bilao, meal prep',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'Maria\'s Catering', type: 'text', required: true },
      { key: 'bizLocation', label: 'Location', placeholder: 'Quezon City', type: 'text' },
      { key: 'serviceHours', label: 'Service Hours', placeholder: 'Mon-Sat 8am-8pm', type: 'text' },
      { key: 'serviceAreas', label: 'Service Areas', placeholder: 'Metro Manila, nearby provinces', type: 'text' },
    ],
    packageLabel: 'Package',
    packageFields: [
      { key: 'name', label: 'Package Name', placeholder: 'Premium Wedding Package', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price per Head (₱)', placeholder: '450', type: 'number' },
      { key: 'minPax', label: 'Minimum Pax', placeholder: '50', type: 'number' },
      { key: 'inclusions', label: 'Inclusions', placeholder: '6 viands, rice, dessert, drinks, waiters, set-up', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Perfect for weddings and debuts', type: 'text' },
    ],
    itemsLabel: 'Menu Items',
    itemCategories: ['Viand', 'Rice', 'Dessert', 'Drinks', 'Appetizer', 'Soup', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Downpayment', placeholder: '50% to secure date', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', placeholder: 'Non-refundable downpayment', type: 'text' },
      { key: 'deliveryFee', label: 'Delivery Fee', placeholder: 'Free within NCR, ₱500 outside', type: 'text' },
      { key: 'freeTaste', label: 'Free Taste Test', placeholder: 'Yes, for 100+ pax bookings', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A CATERING SPECIALIST. You know catering packages, buffet setups, plated meals, Filipino dishes (lechon, adobo, kare-kare, lumpia, pancit), catering terms (pax, viands, set-up, full service, waiters).`,
    aiKnows: [
      'Catering packages, buffet setups, plated meals, food stations',
      'Filipino dishes: lechon, adobo, kare-kare, lumpia, pancit, lechon kawali, halaya',
      'Catering terms: pax (number of guests), viands, set-up, full service, waiters, centerpiece',
      'Event types: weddings, birthdays, baptisms, corporate events, fiestas, debuts',
    ],
    aiConversationFlow: [
      'When customer asks about price → give package price per head + total estimate for their pax',
      'When customer gives a date → check availability, then ask about pax',
      'When customer gives pax → recommend the right package based on their count',
      'When customer mentions venue → note it and ask about food preferences',
      'When customer seems ready → ask for name + phone to "finalize the booking"',
    ],
    aiCaptureFields: [
      { label: 'Event date', question: 'Kelan po yung event niyo?', priority: 1 },
      { label: 'Number of pax', question: 'Ilang pax po?', priority: 2 },
      { label: 'Venue', question: 'Saan po ang venue?', priority: 3 },
      { label: 'Budget', question: 'Mga magkano po ang budget niyo?', priority: 4 },
      { label: 'Event type', question: 'Anong event po ito?', priority: 5 },
      { label: 'Food preference', question: 'May preferred dishes po kayo?', priority: 6 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 7 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 8 },
    ],
    exampleCustomer: 'Hi po! Pa-quote naman for 150 pax, December 15, sa Pasig. Wedding po.',
    exampleAI: 'Hi po! Congratulations! 🎉 Yes available kami Dec 15! For 150 pax, Premium Wedding Package is ₱450/head = ₱67,500. Includes 6 viands, rice, dessert, drinks, waiters. May I know your venue po sa Pasig?',
  },

  // ============================================================
  // 2. RENTALS & VENUES
  // ============================================================
  {
    id: 'rentals',
    label: 'Rentals & Venues',
    icon: '🏠',
    tagline: 'Venue, equipment, party rentals, sound systems, photo booths',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'JC Party Rentals', type: 'text', required: true },
      { key: 'bizLocation', label: 'Location', placeholder: 'Makati City', type: 'text' },
      { key: 'serviceHours', label: 'Business Hours', placeholder: 'Mon-Sun 7am-9pm', type: 'text' },
      { key: 'serviceAreas', label: 'Service Areas', placeholder: 'Metro Manila only', type: 'text' },
    ],
    packageLabel: 'Item / Venue',
    packageFields: [
      { key: 'name', label: 'Item/Venue Name', placeholder: 'LED Wall 9 panels (3m x 2m)', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price per Day (₱)', placeholder: '15000', type: 'number' },
      { key: 'minPax', label: 'Quantity Available', placeholder: '2', type: 'number' },
      { key: 'inclusions', label: 'Inclusions / Specs', placeholder: 'Includes setup, technician, cables', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Perfect for corporate events', type: 'text' },
    ],
    itemsLabel: 'Add-on Items',
    itemCategories: ['Equipment', 'Furniture', 'Decor', 'Lighting', 'Sound', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Downpayment', placeholder: '50% to reserve', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', placeholder: 'Non-refundable downpayment', type: 'text' },
      { key: 'deliveryFee', label: 'Delivery & Setup Fee', placeholder: 'Free within NCR, ₱1,000 outside', type: 'text' },
      { key: 'freeTaste', label: 'Damage Deposit', placeholder: '₱5,000 refundable deposit', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A RENTALS SPECIALIST. You know event rentals — venues, tents, chairs, tables, sound systems, LED walls, photo booths, lighting, decorations. You understand rental terms: per day, per item, setup/teardown, delivery, minimum rental period.`,
    aiKnows: [
      'Rental items: venues, tents, chairs, tables, sound systems, LED walls, photo booths',
      'Rental terms: per day, per item, setup/teardown, delivery, minimum hours',
      'Common packages: party bundle, corporate event bundle, wedding setup',
      'Logistics: delivery, setup time, teardown, pickup',
    ],
    aiConversationFlow: [
      'When customer asks about price → give daily rate + any bundle discount',
      'When customer gives a date → check availability, ask what items they need',
      'When customer lists items → calculate total + delivery fee',
      'When customer mentions venue → ask if setup/teardown is needed',
      'When customer seems ready → ask for name + phone + date to reserve',
    ],
    aiCaptureFields: [
      { label: 'Event date', question: 'Kelan po yung event niyo?', priority: 1 },
      { label: 'Items needed', question: 'Anong mga items po ang kailangan niyo?', priority: 2 },
      { label: 'Venue/location', question: 'Saan po ang venue?', priority: 3 },
      { label: 'Duration', question: 'Ilang oras po kailangan?', priority: 4 },
      { label: 'Budget', question: 'Mga magkano po ang budget?', priority: 5 },
      { label: 'Event type', question: 'Anong event po ito?', priority: 6 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 7 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 8 },
    ],
    exampleCustomer: 'Available ba kayo sa Dec 15? Need ko sound system + 100 chairs + tables sa Pasig.',
    exampleAI: 'Hi po! Yes available kami sa Dec 15! 😊 For sound system (₱3,500) + 100 chairs (₱15 each = ₱1,500) + 10 tables (₱250 each = ₱2,500) = ₱7,500 total. Free delivery within Pasig! May I know what event po ito?',
  },

  // ============================================================
  // 3. SALON & BEAUTY
  // ============================================================
  {
    id: 'salon',
    label: 'Salon & Beauty',
    icon: '💇',
    tagline: 'Salons, spas, nail bars, barber shops, beauty services',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'Glow Beauty Salon', type: 'text', required: true },
      { key: 'bizLocation', label: 'Location', placeholder: 'Taguig City', type: 'text' },
      { key: 'serviceHours', label: 'Business Hours', placeholder: 'Mon-Sat 9am-8pm, Sun 10am-6pm', type: 'text' },
      { key: 'serviceAreas', label: 'Notes', placeholder: 'Walk-ins welcome, by appointment preferred', type: 'text' },
    ],
    packageLabel: 'Service',
    packageFields: [
      { key: 'name', label: 'Service Name', placeholder: 'Hair Color (Full)', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price (₱)', placeholder: '1500', type: 'number' },
      { key: 'minPax', label: 'Duration (mins)', placeholder: '120', type: 'number' },
      { key: 'inclusions', label: 'Inclusions', placeholder: 'Wash, color, treatment, blow dry', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Premium brand hair dye', type: 'text' },
    ],
    itemsLabel: 'Additional Services',
    itemCategories: ['Hair', 'Nails', 'Face', 'Body', 'Makeup', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Booking Policy', placeholder: 'Deposit ₱500 for color/chemical services', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', placeholder: 'Free cancel 24hrs before', type: 'text' },
      { key: 'deliveryFee', label: 'Home Service Fee', placeholder: '₱200-500 depending on location', type: 'text' },
      { key: 'freeTaste', label: 'Promos / Packages', placeholder: 'Buy 3 get 1 free on manicure', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A SALON & BEAUTY SPECIALIST. You know salon services — haircuts, color, treatments, manicure, pedicure, facials, makeup, spa. You understand booking terms: appointment, walk-in, home service, deposit, stylist availability.`,
    aiKnows: [
      'Salon services: haircut, hair color, treatment, manicure, pedicure, facial, makeup, spa',
      'Booking terms: appointment, walk-in, home service, preferred stylist',
      'Common concerns: hair type, skin sensitivity, allergies, previous treatments',
      'Packages: bridal makeup, debuts, event styling, group bookings',
    ],
    aiConversationFlow: [
      'When customer asks about price → give price + estimated duration',
      'When customer wants to book → ask preferred date and time',
      'When customer asks about availability → check day/time, offer alternatives',
      'When customer mentions home service → confirm location + additional fee',
      'When customer seems ready → ask for name + phone to book the slot',
    ],
    aiCaptureFields: [
      { label: 'Preferred date', question: 'Kelan po gusto niyo magpa-book?', priority: 1 },
      { label: 'Preferred time', question: 'Anong time po pwede?', priority: 2 },
      { label: 'Service needed', question: 'Anong service po ang gusto niyo?', priority: 3 },
      { label: 'Home service?', question: 'Sa salon po ba or home service?', priority: 4 },
      { label: 'Number of people', question: 'Ilang tao po?', priority: 5 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 6 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 7 },
    ],
    exampleCustomer: 'Magkano ang hair color? And available ba kayo bukas ng 2pm?',
    exampleAI: 'Hi po! Hair color (full) is ₱1,500, around 2 hours. 😊 Yes available kami bukas 2pm! Walk-in po ba or i-book ko na yung slot for you? Pwede ko po malaman name niyo?',
  },

  // ============================================================
  // 4. CLINIC & DENTAL
  // ============================================================
  {
    id: 'clinic',
    label: 'Clinic & Dental',
    icon: '🏥',
    tagline: 'Dental clinics, medical clinics, therapy, wellness centers',
    bizFields: [
      { key: 'bizName', label: 'Clinic Name', placeholder: 'Smile Dental Clinic', type: 'text', required: true },
      { key: 'bizLocation', label: 'Location', placeholder: 'Ortigas Center, Pasig', type: 'text' },
      { key: 'serviceHours', label: 'Clinic Hours', placeholder: 'Mon-Fri 9am-6pm, Sat 9am-12pm', type: 'text' },
      { key: 'serviceAreas', label: 'Notes', placeholder: 'By appointment only', type: 'text' },
    ],
    packageLabel: 'Procedure / Service',
    packageFields: [
      { key: 'name', label: 'Procedure Name', placeholder: 'Teeth Cleaning', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price (₱)', placeholder: '800', type: 'number' },
      { key: 'minPax', label: 'Duration (mins)', placeholder: '45', type: 'number' },
      { key: 'inclusions', label: 'Inclusions', placeholder: 'Cleaning, polishing, fluoride', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Recommended every 6 months', type: 'text' },
    ],
    itemsLabel: 'Other Services',
    itemCategories: ['Dental', 'Medical', 'Lab Test', 'Therapy', 'Consultation', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Booking Policy', placeholder: 'No deposit needed, just confirm appointment', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', placeholder: 'Please cancel 4hrs before', type: 'text' },
      { key: 'deliveryFee', label: 'Insurance / HMO', placeholder: 'Accepts Maxicare, Intellicare', type: 'text' },
      { key: 'freeTaste', label: 'Promos', placeholder: 'Free consultation for first-time patients', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A CLINIC & DENTAL ASSISTANT. You know medical and dental procedures, scheduling, HMO/insurance, consultation booking. You understand patients may be anxious — be extra reassuring and professional.`,
    aiKnows: [
      'Dental: cleaning, extraction, braces, implants, whitening, root canal',
      'Medical: consultation, checkup, lab tests, vaccination, physical exam',
      'Booking terms: appointment, walk-in, HMO/insurance, referral',
      'Patient concerns: pain level, anxiety, insurance coverage, medication',
    ],
    aiConversationFlow: [
      'When patient asks about price → give price + note if HMO accepted',
      'When patient wants to book → ask preferred date and time',
      'When patient describes symptoms → acknowledge, recommend consultation',
      'When patient asks about insurance → confirm HMO coverage from KB',
      'When patient seems ready → ask for name + phone to confirm appointment',
    ],
    aiCaptureFields: [
      { label: 'Preferred date', question: 'Kelan po gusto niyo magpa-appointment?', priority: 1 },
      { label: 'Preferred time', question: 'Anong time po pwede?', priority: 2 },
      { label: 'Service needed', question: 'Anong service po ang kailangan?', priority: 3 },
      { label: 'HMO/Insurance', question: 'May HMO po ba kayo?', priority: 4 },
      { label: 'Patient name', question: 'Pwede ko po malaman name niyo?', priority: 5 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 6 },
    ],
    exampleCustomer: 'Magkano ang teeth cleaning? Accept ba kayo ng Maxicare?',
    exampleAI: 'Hi po! Teeth cleaning is ₱800, around 45 minutes. 😊 Yes, we accept Maxicare! May available slot po kami bukas at 10am or 2pm. Anong time po ang mas convenient for you?',
  },

  // ============================================================
  // 5. PHOTOGRAPHY & EVENTS
  // ============================================================
  {
    id: 'photography',
    label: 'Photography & Events',
    icon: '📸',
    tagline: 'Photographers, videographers, event coordinators, planners',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'JC Moments Photography', type: 'text', required: true },
      { key: 'bizLocation', label: 'Home Base', placeholder: 'Quezon City (willing to travel)', type: 'text' },
      { key: 'serviceHours', label: 'Availability', placeholder: 'Weekends preferred, weekdays by request', type: 'text' },
      { key: 'serviceAreas', label: 'Travel Policy', placeholder: 'Free within Metro Manila, ₱2,000 outside', type: 'text' },
    ],
    packageLabel: 'Package',
    packageFields: [
      { key: 'name', label: 'Package Name', placeholder: 'Wedding Premium Package', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price (₱)', placeholder: '25000', type: 'number' },
      { key: 'minPax', label: 'Hours Coverage', placeholder: '8', type: 'number' },
      { key: 'inclusions', label: 'Inclusions', placeholder: '2 photographers, edited photos, online gallery, prints', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Pre-nup + wedding day coverage', type: 'text' },
    ],
    itemsLabel: 'Add-on Services',
    itemCategories: ['Photography', 'Videography', 'Photo Booth', 'Album', 'Drone', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Downpayment', placeholder: '₱5,000 to reserve date', type: 'text' },
      { key: 'cancellation', label: 'Cancellation Policy', placeholder: 'Non-refundable downpayment', type: 'text' },
      { key: 'deliveryFee', label: 'Travel Fee', placeholder: 'Free within NCR, ₱2,000 + transpo outside', type: 'text' },
      { key: 'freeTaste', label: 'Delivery Timeline', placeholder: 'Edited photos within 7-14 days', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A PHOTOGRAPHY & EVENTS SPECIALIST. You know photography packages, videography, event coverage, photo booths, albums. You understand event terms: coverage hours, pre-nup, same-day edit, online gallery, prints.`,
    aiKnows: [
      'Photography: wedding, debut, birthday, corporate, pre-nup, maternity',
      'Videography: same-day edit, cinematic video, raw footage, highlight reel',
      'Package terms: hours of coverage, number of photographers, edited photos count',
      'Add-ons: photo booth, drone shot, album, online gallery, prints',
    ],
    aiConversationFlow: [
      'When customer asks about price → give package price + what\'s included',
      'When customer gives event date → check availability, ask about event type',
      'When customer mentions venue → note it, ask if travel fee applies',
      'When customer asks about output → explain timeline (days to deliver)',
      'When customer seems ready → ask for name + phone to reserve date',
    ],
    aiCaptureFields: [
      { label: 'Event date', question: 'Kelan po yung event?', priority: 1 },
      { label: 'Event type', question: 'Anong event po? Wedding, birthday?', priority: 2 },
      { label: 'Venue', question: 'Saan po ang venue?', priority: 3 },
      { label: 'Budget', question: 'Mga magkano po ang budget?', priority: 4 },
      { label: 'Hours needed', question: 'Ilang oras po ang coverage?', priority: 5 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 6 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 7 },
    ],
    exampleCustomer: 'Magkano wedding photography package? December 15 sa Tagaytay.',
    exampleAI: 'Hi po! Congratulations! 🎉 Our Wedding Premium Package is ₱25,000 — 8hrs coverage, 2 photographers, edited photos, online gallery. Tagaytay has a ₱2,000 travel fee. Total ₱27,000. May available pa kami sa Dec 15! Name po?',
  },

  // ============================================================
  // 6. REAL ESTATE & PROPERTIES
  // ============================================================
  {
    id: 'realestate',
    label: 'Real Estate & Properties',
    icon: '🏢',
    tagline: 'Property rentals, sales, apartments, condos, commercial spaces',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'JC Properties PH', type: 'text', required: true },
      { key: 'bizLocation', label: 'Office Location', placeholder: 'Mandaluyong City', type: 'text' },
      { key: 'serviceHours', label: 'Office Hours', placeholder: 'Mon-Fri 9am-6pm, Sat 10am-4pm', type: 'text' },
      { key: 'serviceAreas', label: 'Coverage Areas', placeholder: 'Metro Manila, Rizal, Cavite', type: 'text' },
    ],
    packageLabel: 'Property / Listing',
    packageFields: [
      { key: 'name', label: 'Property Name', placeholder: '2BR Condo in BGC', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price (₱/month or total)', placeholder: '35000', type: 'number' },
      { key: 'minPax', label: 'Size (sqm)', placeholder: '65', type: 'number' },
      { key: 'inclusions', label: 'Inclusions / Amenities', placeholder: 'Furnished, parking, pool, gym, 24/7 security', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Near BGC offices, 1 jeep to Makati', type: 'text' },
    ],
    itemsLabel: 'Other Listings',
    itemCategories: ['Condo', 'Apartment', 'House', 'Commercial', 'Lot', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Deposit / Advance', placeholder: '2 months deposit, 1 month advance', type: 'text' },
      { key: 'cancellation', label: 'Lease Terms', placeholder: 'Minimum 6 months contract', type: 'text' },
      { key: 'deliveryFee', label: 'Viewing Policy', placeholder: 'Free viewing, 1 day advance notice', type: 'text' },
      { key: 'freeTaste', label: 'Commission / Fees', placeholder: 'No tenant fee, owner pays commission', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A REAL ESTATE SPECIALIST. You know property rentals, sales, leases, condos, apartments, commercial spaces. You understand real estate terms: deposit, advance, lease term, viewing, turnover, association dues.`,
    aiKnows: [
      'Property types: condo, apartment, house, commercial, lot, townhouse',
      'Rental terms: monthly rent, deposit, advance, lease term, utilities, dues',
      'Sale terms: price, downpayment, financing, title, turnover',
      'Viewing: schedule, requirements, what to bring, move-in process',
    ],
    aiConversationFlow: [
      'When customer asks about a property → give price + key details',
      'When customer wants to view → ask preferred date and time for viewing',
      'When customer asks about budget → recommend properties in their range',
      'When customer asks about terms → explain deposit/advance/lease',
      'When customer seems ready → ask for name + phone to schedule viewing',
    ],
    aiCaptureFields: [
      { label: 'Property interest', question: 'Anong property po ang gusto niyo?', priority: 1 },
      { label: 'Move-in date', question: 'Kelan po gusto niyo mag-move in?', priority: 2 },
      { label: 'Budget', question: 'Mga magkano po ang budget niyo?', priority: 3 },
      { label: 'Location preference', question: 'Saan po ang preferred location?', priority: 4 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 5 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 6 },
    ],
    exampleCustomer: 'Available pa ba yung 2BR sa BGC? Magkano rent?',
    exampleAI: 'Hi po! Yes, available pa yung 2BR condo sa BGC! 😊 Rent is ₱35,000/month, 65sqm, fully furnished with parking. 2 months deposit + 1 month advance. Gusto niyo po ba mag-schedule ng viewing this week?',
  },

  // ============================================================
  // 7. GENERAL / OTHER BUSINESS
  // ============================================================
  {
    id: 'general',
    label: 'Other Business',
    icon: '📦',
    tagline: 'Any business — retail, services, trading, online shop, etc.',
    bizFields: [
      { key: 'bizName', label: 'Business Name', placeholder: 'Your Business Name', type: 'text', required: true },
      { key: 'bizLocation', label: 'Location', placeholder: 'City, Province', type: 'text' },
      { key: 'serviceHours', label: 'Business Hours', placeholder: 'Mon-Sat 9am-6pm', type: 'text' },
      { key: 'serviceAreas', label: 'Service / Delivery Areas', placeholder: 'Nationwide shipping, Metro Manila same-day', type: 'text' },
    ],
    packageLabel: 'Product / Service',
    packageFields: [
      { key: 'name', label: 'Product/Service Name', placeholder: 'Product or service name', type: 'text', required: true },
      { key: 'pricePerHead', label: 'Price (₱)', placeholder: '500', type: 'number' },
      { key: 'minPax', label: 'Min Order / Qty', placeholder: '1', type: 'number' },
      { key: 'inclusions', label: 'Details / Specs', placeholder: 'What\'s included, sizes, variants', type: 'text' },
      { key: 'description', label: 'Description (optional)', placeholder: 'Short description', type: 'text' },
    ],
    itemsLabel: 'Other Products / Services',
    itemCategories: ['Product', 'Service', 'Package', 'Add-on', 'Others'],
    policyFields: [
      { key: 'downpayment', label: 'Payment Terms', placeholder: 'Cash, GCash, bank transfer, COD', type: 'text' },
      { key: 'cancellation', label: 'Return / Refund Policy', placeholder: '7-day return for defective items', type: 'text' },
      { key: 'deliveryFee', label: 'Delivery / Shipping', placeholder: '₱100 Metro Manila, ₱150 provincial', type: 'text' },
      { key: 'freeTaste', label: 'Promos / Notes', placeholder: 'Bundle deals, seasonal promos', type: 'text' },
    ],
    aiSpecialty: `YOU ARE A HELPFUL BUSINESS ASSISTANT. You help customers with their inquiries about products, services, pricing, availability, and ordering. Be knowledgeable about the business and always try to close the sale or capture the lead.`,
    aiKnows: [
      'General business: products, services, pricing, availability',
      'Payment methods: cash, GCash, bank transfer, COD',
      'Shipping: local, provincial, same-day, pickup',
      'Customer service: returns, refunds, warranty, complaints',
    ],
    aiConversationFlow: [
      'When customer asks about price → give price + any available promos',
      'When customer wants to order → ask quantity and delivery details',
      'When customer asks availability → confirm, ask when they need it',
      'When customer has questions → answer from KB, offer alternatives',
      'When customer seems ready → ask for name + phone + address to process',
    ],
    aiCaptureFields: [
      { label: 'Product/Service', question: 'Anong product/service po ang gusto niyo?', priority: 1 },
      { label: 'Quantity', question: 'Ilang pieces po?', priority: 2 },
      { label: 'Delivery location', question: 'Saan po ipapadala?', priority: 3 },
      { label: 'Preferred date', question: 'Kelan po kailangan?', priority: 4 },
      { label: 'Name', question: 'Pwede ko po malaman name niyo?', priority: 5 },
      { label: 'Phone', question: 'Pwede po maka-connect ng number niyo?', priority: 6 },
    ],
    exampleCustomer: 'Hi! Available ba yung product niyo? Magkano?',
    exampleAI: 'Hi po! Yes available pa! 😊 Price is ₱500. We accept GCash, bank transfer, or COD. May free din po kami na delivery within Metro Manila for orders above ₱1,000. Ilang pieces po ang kailangan niyo?',
  },
];

export function getIndustry(id: string): IndustryConfig {
  return INDUSTRIES.find((i) => i.id === id) || INDUSTRIES[INDUSTRIES.length - 1];
}
