import type { SuspensionReason } from '@prisma/client';

export type ResolutionType = 'license_upload' | 'profile_update' | 'review_response' | 'contact_support' | 'none';

interface SuspensionReasonMeta {
  label: string;
  description: string;
  appealable: boolean;
  resolution: {
    type: ResolutionType;
    heading: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

export const SUSPENSION_REASONS: Record<SuspensionReason, SuspensionReasonMeta> = {
  expired_license: {
    label: 'Expired License',
    description: 'Professional license has expired and not been renewed',
    appealable: true,
    resolution: {
      type: 'license_upload',
      heading: 'Upload Your Renewed License',
      description: 'Upload your current, valid barber license below. Once submitted, our team will review it and reinstate your account if everything checks out.',
    },
  },
  policy_violation: {
    label: 'Policy Violation',
    description: 'Violated platform terms of service or usage policies',
    appealable: true,
    resolution: {
      type: 'profile_update',
      heading: 'Review & Update Your Profile',
      description: 'Review your profile to ensure it complies with our terms of service. Update any content that may have caused the violation, then submit your appeal.',
      actionLabel: 'Go to Profile',
      actionHref: '/dashboard/profile',
    },
  },
  client_complaints: {
    label: 'Client Complaints',
    description: 'Multiple verified client complaints requiring investigation',
    appealable: true,
    resolution: {
      type: 'review_response',
      heading: 'Review Client Feedback',
      description: 'Review the feedback from clients and address any concerns in your appeal. Explain the steps you have taken or will take to improve the client experience.',
      actionLabel: 'View Reviews',
      actionHref: '/dashboard/reviews',
    },
  },
  fraudulent_documentation: {
    label: 'Fraudulent Documentation',
    description: 'Submitted falsified or fraudulent license documents',
    appealable: false,
    resolution: {
      type: 'none',
      heading: 'This suspension cannot be appealed',
      description: 'Accounts suspended for fraudulent documentation are not eligible for appeal. If you believe this was an error, please contact our support team.',
    },
  },
  payment_fraud: {
    label: 'Payment Fraud',
    description: 'Fraudulent payment activity detected on the account',
    appealable: false,
    resolution: {
      type: 'none',
      heading: 'This suspension cannot be appealed',
      description: 'Accounts suspended for payment fraud are not eligible for appeal. If you believe this was an error, please contact our support team.',
    },
  },
  legal_regulatory: {
    label: 'Legal / Regulatory',
    description: 'Suspended due to legal or regulatory requirements',
    appealable: false,
    resolution: {
      type: 'contact_support',
      heading: 'Contact Support',
      description: 'This suspension is due to legal or regulatory requirements. Please contact our support team for more information about your specific situation.',
      actionLabel: 'Contact Support',
      actionHref: '/contact',
    },
  },
};

export function isAppealable(reason: SuspensionReason): boolean {
  return SUSPENSION_REASONS[reason].appealable;
}
