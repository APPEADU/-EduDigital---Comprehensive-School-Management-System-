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
  const ownerWhatsAppUrl = buildWhatsAppUrl(ownerWhatsAppNumber);

  return (
    <a
      href={ownerWhatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white shadow-lg shadow-black/40 ring-2 ring-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
    >
      <WhatsAppLogoIcon className="w-6 h-6 sm:w-7 sm:h-7" />
    </a>
  );
};
