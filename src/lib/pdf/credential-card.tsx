/* eslint-disable jsx-a11y/alt-text */
// React-PDF's <Image /> doesn't accept the alt prop — disabled the lint here.
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const COLORS = {
  obsidian: '#0D0D0D',
  surface: '#121212',
  gold: '#D4AF37',
  platinum: '#E5E4E2',
  text: '#F5F5F5',
  muted: '#9a9a9a',
};

// Print spec: business-card 3.5" × 2" at 300 DPI = 1050 × 600 px.
// React-PDF works in points (72 pt = 1 inch), so card = 252pt × 144pt.
const CARD_WIDTH = 252;
const CARD_HEIGHT = 144;

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.obsidian,
    padding: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    border: `1px solid ${COLORS.gold}`,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMonogram: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    color: COLORS.gold,
    marginRight: 6,
  },
  brandWord: {
    fontFamily: 'Helvetica',
    fontSize: 6,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  shopLine: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: COLORS.muted,
  },
  badge: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: COLORS.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    borderTop: `0.5px solid ${COLORS.gold}`,
    paddingTop: 4,
  },
  cardRight: {
    width: 80,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qr: {
    width: 70,
    height: 70,
  },
  qrLabel: {
    fontFamily: 'Helvetica',
    fontSize: 5,
    color: COLORS.muted,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  back: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.obsidian,
    borderRadius: 8,
    padding: 14,
    border: `1px solid ${COLORS.gold}`,
    marginTop: 24,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  backTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 8,
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  backBody: {
    fontFamily: 'Helvetica',
    fontSize: 6.5,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  backUrl: {
    fontFamily: 'Helvetica',
    fontSize: 6,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});

export interface CredentialCardProps {
  displayName: string;
  shopName: string | null;
  city: string;
  state: string;
  isFoundingMember: boolean;
  publicUrl: string;
  qrPngDataUrl: string;
}

export function CredentialCard({
  displayName,
  shopName,
  city,
  state,
  isFoundingMember,
  publicUrl,
  qrPngDataUrl,
}: CredentialCardProps) {
  const badge = isFoundingMember ? 'Founding Member · Verified' : 'Verified Professional';

  return (
    <Document>
      <Page size={[CARD_WIDTH + 40, CARD_HEIGHT * 2 + 80]} style={styles.page}>
        {/* FRONT */}
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <View>
              <View style={styles.brandRow}>
                <Text style={styles.brandMonogram}>C</Text>
                <Text style={styles.brandWord}>Concierge Barber Registry</Text>
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.shopLine}>
                {shopName ? `${shopName} · ` : ''}
                {city}, {state}
              </Text>
            </View>
            <Text style={styles.badge}>{badge}</Text>
          </View>
          <View style={styles.cardRight}>
            {qrPngDataUrl ? <Image src={qrPngDataUrl} style={styles.qr} /> : null}
            <Text style={styles.qrLabel}>Scan to view profile</Text>
          </View>
        </View>

        {/* BACK */}
        <View style={styles.back}>
          <Text style={styles.backTitle}>Verified, by hand.</Text>
          <Text style={styles.backBody}>
            Every barber on this registry has been manually license-verified by the CBR team.
            This card is non-transferable and revoked upon license expiration or removal.
          </Text>
          <Text style={styles.backUrl}>{publicUrl}</Text>
        </View>
      </Page>
    </Document>
  );
}
