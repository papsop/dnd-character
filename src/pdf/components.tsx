import { Path, Svg, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import { iconPaths, type IconName } from '../icons/paths';
import { colors, fonts, sizes, styles } from './theme';

/**
 * PDF renderer for the shared icon set - the same path data the DOM wrapper uses.
 * Icons are decorative here: they sit beside a label and never replace it, because someone reading
 * a black-and-white printout must never have to decode a glyph.
 */
export function Icon({ name, size = 8, color = colors.ink }: { name: IconName | undefined; size?: number; color?: string }) {
  const path = name ? iconPaths[name] : undefined;
  if (!path) return null;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <Path d={path} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

export function SectionHeader({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <View style={[styles.row, styles.sectionHeader, { alignItems: 'center', gap: 3 }]}>
      {icon ? <Icon name={icon} size={9} /> : null}
      <Text>{children}</Text>
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** A boxed number the player reads constantly - AC, HP, proficiency bonus. */
export function StatBox({
  label,
  value,
  hint,
  big,
}: {
  label: string;
  value: string | number;
  hint?: string;
  big?: boolean;
}) {
  return (
    <View style={[styles.box, { alignItems: 'center', flexGrow: 1, paddingVertical: 3 }]}>
      <Label>{label}</Label>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: big ? sizes.giant : sizes.huge }}>{value}</Text>
      {hint ? <Text style={{ fontSize: sizes.label, color: colors.muted, textAlign: 'center' }}>{hint}</Text> : null}
    </View>
  );
}

/** The six ability blocks: modifier large (it is what gets rolled), score small beneath. */
export function AbilityBox({ name, mod, score }: { name: string; mod: string; score: number }) {
  return (
    <View style={[styles.box, { alignItems: 'center', paddingVertical: 2, marginBottom: 3 }]}>
      <Label>{name}</Label>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: sizes.huge }}>{mod}</Text>
      <Text style={{ fontSize: sizes.tiny, color: colors.muted }}>({score})</Text>
    </View>
  );
}

/** Proficiency marker. Filled for proficient, ringed and filled for expertise. */
export function ProficiencyDot({ proficient, expertise }: { proficient: boolean; expertise?: boolean }) {
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 3,
        borderWidth: expertise ? 1.5 : 0.75,
        borderColor: colors.ink,
        backgroundColor: proficient ? colors.ink : colors.paper,
      }}
    />
  );
}

/** Empty circles the player ticks - death saves, limited-use features, spell slots. */
export function Pips({ count, filled = false }: { count: number; filled?: boolean }) {
  return (
    <View style={[styles.row, { gap: 2, alignItems: 'center' }]}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            borderWidth: 0.75,
            borderColor: colors.ink,
            backgroundColor: filled ? colors.ink : colors.paper,
          }}
        />
      ))}
    </View>
  );
}

export type Column = { header: string; width: number; align?: 'left' | 'right' };

export function Table({ columns, rows }: { columns: Column[]; rows: (string | number)[][] }) {
  return (
    <View>
      <View style={styles.tableHeader}>
        {columns.map((column) => (
          <Text
            key={column.header}
            style={[styles.label, { width: `${column.width}%`, textAlign: column.align ?? 'left' }]}
          >
            {column.header}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow} wrap={false}>
          {row.map((cell, cellIndex) => (
            <Text
              key={cellIndex}
              style={{
                width: `${columns[cellIndex]?.width ?? 0}%`,
                textAlign: columns[cellIndex]?.align ?? 'left',
                fontSize: sizes.small,
              }}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** A labelled value on one line - the workhorse of the header and the back page. */
export function Field({ label, value, width }: { label: string; value: string; width?: string | number }) {
  return (
    <View style={width === undefined ? { flexGrow: 1 } : { width }}>
      <Label>{label}</Label>
      <Text style={{ fontSize: sizes.small, borderBottomWidth: 0.5, borderBottomColor: colors.faint, paddingBottom: 1 }}>
        {value || ' '}
      </Text>
    </View>
  );
}

/** Ruled lines for anything the player fills in by hand. */
export function RuledLines({ count, label }: { count: number; label?: string }) {
  return (
    <View>
      {label ? <Label>{label}</Label> : null}
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{ borderBottomWidth: 0.5, borderBottomColor: colors.faint, height: 10 }}
        />
      ))}
    </View>
  );
}
