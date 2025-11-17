import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { WeeklyVolumeData } from '../../types/api.types';

interface SimpleBarChartProps {
  data: WeeklyVolumeData[];
  currentWeekVolume?: number;
}

export function SimpleBarChart({ data, currentWeekVolume }: SimpleBarChartProps) {
  // Handle empty data
  if (data.length === 0 || data.every((item) => item.volume === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Volume Settimanale</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nessun dato disponibile</Text>
          <Text style={styles.emptySubtext}>
            Completa delle sessioni per vedere i tuoi progressi
          </Text>
        </View>
      </View>
    );
  }

  const chartWidth = 320;
  const chartHeight = 230;
  const barWidth = 60;
  const spacing = 20;
  const maxVolume = Math.max(...data.map((d) => d.volume), 100);
  const yScale = (chartHeight - 40) / maxVolume;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volume Settimanale</Text>

      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - 20 - (chartHeight - 40) * ratio;
            return (
              <Line
                key={i}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke={theme.colors.borderLight}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const x = index * (barWidth + spacing) + spacing;
            const barHeight = item.volume * yScale;
            const y = chartHeight - 20 - barHeight;

            return (
              <React.Fragment key={item.week}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={theme.colors.primary}
                  rx={4}
                />

                {/* Value on top */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="12"
                  fill={theme.colors.text}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {item.volume}kg
                </SvgText>

                {/* X-axis label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 5}
                  fontSize="12"
                  fill={theme.colors.textSecondary}
                  textAnchor="middle"
                >
                  S{item.week}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {currentWeekVolume !== undefined && (
        <Text style={styles.subtitle}>
          Questa settimana: <Text style={styles.highlightText}>{currentWeekVolume}kg</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: 18,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  highlightText: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});
