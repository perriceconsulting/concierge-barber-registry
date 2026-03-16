import type { SuspensionReason } from '@prisma/client';

interface SuspensionReasonMeta {
  label: string;
  description: string;
  appealable: boolean;
}

export const SUSPENSION_REASONS: Record<SuspensionReason, SuspensionReasonMeta> = {
  fraudulent_documentation: {
    label: 'Fraudulent Documentation',
    description: 'Submitted falsified or fraudulent license documents',
    appealable: false,
  },
  expired_license: {
    label: 'Expired License',
    description: 'Professional license has expired and not been renewed',
    appealable: true,
  },
  policy_violation: {
    label: 'Policy Violation',
    description: 'Violated platform terms of service or usage policies',
    appealable: true,
  },
  client_complaints: {
    label: 'Client Complaints',
    description: 'Multiple verified client complaints requiring investigation',
    appealable: true,
  },
  payment_fraud: {
    label: 'Payment Fraud',
    description: 'Fraudulent payment activity detected on the account',
    appealable: false,
  },
  legal_regulatory: {
    label: 'Legal / Regulatory',
    description: 'Suspended due to legal or regulatory requirements',
    appealable: false,
  },
};

export function isAppealable(reason: SuspensionReason): boolean {
  return SUSPENSION_REASONS[reason].appealable;
}
