import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { NDA_TEMPLATE } from '@/lib/copy/v2';

const COLORS = {
  ink: '#1A1A1A',
  muted: '#555',
  rule: '#888',
  gold: '#8c6d1c',
};

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 8,
    marginBottom: 18,
    borderBottom: `1px solid ${COLORS.rule}`,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMonogram: {
    fontFamily: 'Times-Bold',
    fontSize: 22,
    color: COLORS.gold,
    marginRight: 8,
  },
  brandWord: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  docTag: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  intro: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionBody: {
    marginBottom: 6,
  },
  signatureBlock: {
    marginTop: 28,
  },
  signatureNote: {
    fontStyle: 'italic',
    color: COLORS.muted,
    marginBottom: 18,
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  sigCol: {
    width: '45%',
  },
  sigLine: {
    borderBottom: `0.5px solid ${COLORS.ink}`,
    marginBottom: 4,
    height: 30,
  },
  sigLabel: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 56,
    right: 56,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export interface NdaProps {
  professionalName?: string | null;
}

export function NdaTemplate({ professionalName }: NdaProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMonogram}>C</Text>
            <Text style={styles.brandWord}>Concierge Barber Registry</Text>
          </View>
          <Text style={styles.docTag}>Privacy Agreement · Template</Text>
        </View>

        <Text style={styles.title}>{NDA_TEMPLATE.title}</Text>

        <Text style={styles.intro}>{NDA_TEMPLATE.intro}</Text>

        {NDA_TEMPLATE.sections.map((s) => (
          <View key={s.heading}>
            <Text style={styles.sectionHeading}>{s.heading}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureNote}>{NDA_TEMPLATE.signatureBlock}</Text>

          <View style={styles.sigRow}>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>
                Professional Signature{professionalName ? ` — ${professionalName}` : ''}
              </Text>
            </View>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.sigRow}>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Client Signature</Text>
            </View>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.sigRow}>
            <View style={styles.sigCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Print Client Name</Text>
            </View>
            <View style={styles.sigCol} />
          </View>
        </View>

        <Text style={styles.footer}>
          Concierge Barber Registry · Privacy Agreement Template ·
          conciergebarberregistry.com
        </Text>
      </Page>
    </Document>
  );
}
