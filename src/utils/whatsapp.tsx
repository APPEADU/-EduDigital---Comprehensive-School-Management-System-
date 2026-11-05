import React from 'react';
import { SchoolProfile } from '../types';

export const PLATFORM_OWNER_WHATSAPP_RAW = '+233 207615941';
export const PLATFORM_OWNER_WHATSAPP_DISPLAY = '+233 207615941';
export const PLATFORM_OWNER_LABEL = 'Platform Owner';

/**
 * Normalizes local (Ghana 0XX...) and international (+233..., 00233...) phone numbers
 * into clean E.164 digits suitable for https://wa.me/<digits>.
 */
export function normalizeWhatsAppDigits(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Strip leading 00 international prefix (e.g. 00233207615941 -> 233207615941)
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Handle "+233 (0) 20 761 5941" -> "2330207615941" -> "233207615941"
  if (digits.startsWith('2330') && digits.length === 13) {
    digits = '233' + digits.slice(4);
  }

  // Handle local 10-digit Ghana numbers starting with 0 (e.g. 0207615941 -> 233207615941)
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '233' + digits.slice(1);
  }

  return digits;
}

/**
 * Builds an iframe-safe https://wa.me URL with an optional pre-filled message.
 */
export function buildWhatsAppUrl(phoneNumber: string, prefilledMessage?: string): string {
  const digits = normalizeWhatsAppDigits(phoneNumber);
  if (!digits) return '';
  const cleanMessage = prefilledMessage?.trim();
  if (!cleanMessage) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(cleanMessage)}`;
}

/**
 * Resolves the active WhatsApp contact configuration for any school or institute on the platform.
 */
export function getSchoolWhatsAppContact(school: SchoolProfile): {
  enabled: boolean;
  rawNumber: string;
  digits: string;
} {
  const isEnabledFlag = school.whatsappEnabled !== false;
  const candidateNumber =
    (school.whatsappNumber && school.whatsappNumber.trim()) ||
    (school.phone && school.phone.trim()) ||
    '';
  const digits = normalizeWhatsAppDigits(candidateNumber);
  return {
    enabled: isEnabledFlag && digits.length >= 9,
    rawNumber: candidateNumber,
    digits,
  };
}

interface WhatsAppLogoIconProps {
  className?: string;
}

/**
 * Official WhatsApp speech-bubble + handset vector mark.
 */
export const WhatsAppLogoIcon: React.FC<WhatsAppLogoIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.968 0 1.758.459 3.474 1.331 4.988L2 22l5.189-1.361a9.93 9.93 0 0 0 4.84 1.236h.004c5.515 0 9.967-4.453 9.967-9.969A9.908 9.908 0 0 0 19.08 4.92 9.906 9.906 0 0 0 12.031 2Zm0 18.203h-.003a8.26 8.26 0 0 1-4.211-1.153l-.302-.179-3.133.822.836-3.053-.197-.313a8.232 8.232 0 0 1-1.269-4.39c0-4.55 3.703-8.252 8.256-8.252 2.205 0 4.277.859 5.835 2.419a8.198 8.198 0 0 1 2.416 5.836c0 4.551-3.703 8.263-8.228 8.263Zm4.528-6.185c-.248-.124-1.468-.725-1.696-.807-.227-.083-.393-.124-.558.124-.165.248-.64.807-.785.973-.145.165-.289.186-.537.062-.248-.124-1.047-.386-1.994-1.23-.737-.658-1.235-1.47-1.38-1.718-.144-.248-.015-.382.109-.506.112-.111.248-.29.372-.434.124-.145.165-.248.248-.414.083-.165.041-.31-.021-.434-.062-.124-.558-1.345-.764-1.842-.201-.483-.405-.418-.558-.426l-.475-.008c-.165 0-.434.062-.661.31-.227.248-.868.848-.868 2.069s.889 2.4 1.013 2.566c.124.165 1.749 2.67 4.237 3.744.592.256 1.054.408 1.414.523.594.189 1.135.162 1.563.098.477-.071 1.468-.6 1.674-1.18.207-.579.207-1.076.145-1.18-.062-.103-.227-.165-.475-.289Z" />
  </svg>
);
