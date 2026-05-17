import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const COLORS = {
  obsidian: '#0D0D0D',
  surface: '#1a1a1a',
  gold: '#D4AF37',
  goldDeep: '#a98a2c',
  text: '#F5F5F5',
  muted: '#9a9a9a',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.obsidian,
    padding: 40,
    flexDirection: 'column',
  },
  frame: {
    flex: 1,
    border: `2px solid ${COLORS.gold}`,
    padding: 36,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
  },
  innerFrame: {
    flex: 1,
    border: `0.5px solid ${COLORS.goldDeep}`,
    padding: 32,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMonogram: {
    fontFamily: 'Times-Bold',
    fontSize: 28,
    color: COLORS.gold,
    marginRight: 10,
  },
  brandWord: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  certKicker: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 24,
  },
  certTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 32,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 6,
  },
  presentedTo: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 32,
  },
  recipient: {
    fontFamily: 'Times-Italic',
    fontSize: 38,
    color: COLORS.gold,
    marginTop: 10,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 1.6,
    marginTop: 22,
    paddingHorizontal: 30,
  },
  tagline: {
    fontFamily: 'Times-Italic',
    fontSize: 11,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sigBlock: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  sigLine: {
    width: 140,
    borderTop: `0.5px solid ${COLORS.muted}`,
    marginBottom: 4,
  },
  sigLabel: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sigName: {
    fontFamily: 'Times-Italic',
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 2,
  },
});

export interface CertificateProps {
  displayName: string;
  isFoundingMember: boolean;
  verifiedAt: Date;
  certificateNumber: string;
}

export function Certificate({
  displayName,
  isFoundingMember,
  verifiedAt,
  certificateNumber,
}: CertificateProps) {
  const tier = isFoundingMember ? 'Founding Member' : 'Verified Professional';
  const tagline = isFoundingMember
    ? '"Excellence is not an act, but a habit. We recognize yours."'
    : '"Verified, by hand."';
  const body = isFoundingMember
    ? 'In recognition of exceptional craft, professional standing, and contribution to the standard of grooming for discerning clients, this Certificate of Selection is hereby awarded as one of the inaugural ten Founding Members of the Concierge Barber Registry. Founding status is for life and signals the highest tier of credentialed mastery.'
    : 'In recognition of credentialed mastery and successful completion of the Concierge Barber Registry\'s manual three-point verification — license, professional standing, and portfolio — this Certificate confirms admission to the Registry as a Verified Professional, eligible to serve discerning clients across the network.';

  const verifiedDateLabel = verifiedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.innerFrame}>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.brandRow}>
                <Text style={styles.brandMonogram}>C</Text>
                <Text style={styles.brandWord}>Concierge Barber Registry</Text>
              </View>
              <Text style={styles.certKicker}>Certificate of Selection</Text>
              <Text style={styles.certTitle}>{tier}</Text>
            </View>

            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Text style={styles.presentedTo}>Presented to</Text>
              <Text style={styles.recipient}>{displayName}</Text>
              <Text style={styles.body}>{body}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.sigBlock}>
                <Text style={styles.sigName}>{verifiedDateLabel}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Date of Verification</Text>
              </View>
              <View style={styles.sigBlock}>
                <Text style={styles.sigName}>The CBR Verification Team</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Authorized Signatory</Text>
              </View>
              <View style={styles.sigBlock}>
                <Text style={styles.sigName}>{certificateNumber}</Text>
                <View style={styles.sigLine} />
                <Text style={styles.sigLabel}>Certificate No.</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
