import React from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  buildWhatsAppUrl,
} from '../utils/whatsapp';

/**
 * Floating round WhatsApp contact button fixed at the bottom-right corner across desktop, tablet, and mobile.
 * Displays ONLY the official WhatsApp logo/symbol (no words, no phone number) and opens a direct
 * WhatsApp conversation with the platform owner when clicked.
 */
export const WhatsAppConnectWidget: React.FC = () => {
  const { platformOwnerProfile } = useSchool();

  const ownerWhatsAppNumber =
    platformOwnerProfile?.whatsappNumber?.trim() || PLATFORM_OWNER_WHATSAPP_RAW;
  const ownerWhatsAppUrl = buildWhatsAppUrl(
    ownerWhatsAppNumber,
    'Hello Platform Owner, I am visiting the InfoDigital portal and would like to enquire about institutional onboarding, subscription packages, or a demonstration.'
  );

  return (
    <a
      href={ownerWhatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp (+233 207 615 941)"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 print:hidden w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-xl shadow-[#25D366]/30 ring-2 ring-white/25 flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
    >
      <WhatsAppLogoIcon className="w-6 h-6 sm:w-7 sm:h-7" />
    </a>
  );
};
