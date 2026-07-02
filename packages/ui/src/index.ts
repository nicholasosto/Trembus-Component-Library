// Styles must load first so the @layer order is established before any
// component CSS. Consumers using the prebuilt bundle import '@trembus/ui/styles.css'.
import './styles/index.css';

// ── tokens ──
export { tokens } from './tokens/tokens';
export type { Tokens } from './tokens/tokens';
export type * from './tokens/tokens.types';

// ── types ──
export type * from './types/polymorphic';
export type { ComponentContract, JobSatisfaction, UIJob } from './types/contract';

// ── utils ──
export { cx } from './utils/cx';
export type { ClassValue } from './utils/cx';
export { Slot } from './utils/Slot';
export type { SlotProps } from './utils/Slot';
export { Portal } from './utils/Portal';
export type { PortalProps } from './utils/Portal';
export { composeRefs, useComposedRefs, setRef } from './utils/refs';

// ── hooks ──
export { useAffordanceState } from './hooks/useAffordanceState';
export type {
  AffordanceState,
  AffordanceHandlers,
  AffordanceDataAttrs,
  UseAffordanceStateOptions,
  UseAffordanceStateReturn,
} from './hooks/useAffordanceState';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useReturnFocus } from './hooks/useReturnFocus';
export { useFocusTrap } from './hooks/useFocusTrap';
export { useDismissable } from './hooks/useDismissable';
export type { UseDismissableOptions } from './hooks/useDismissable';

// ── primitives ──
export { Box, buildBoxStyle } from './primitives/Box/Box';
export type { BoxProps, BoxOwnProps } from './primitives/Box/Box';
export { Stack, Inline } from './primitives/Stack/Stack';
export type { StackProps, StackOwnProps } from './primitives/Stack/Stack';
export { Text } from './primitives/Text/Text';
export type { TextProps, TextOwnProps } from './primitives/Text/Text';
export { Pressable } from './primitives/Pressable/Pressable';
export type { PressableProps, PressableOwnProps } from './primitives/Pressable/Pressable';

// ── components ──
export { Button } from './components/Button/Button';
export type { ButtonProps } from './components/Button/Button';
export { Badge } from './components/Badge/Badge';
export type { BadgeProps } from './components/Badge/Badge';
export { Input } from './components/Input/Input';
export type { InputProps } from './components/Input/Input';
export { Dialog } from './components/Dialog/Dialog';
export type { DialogProps } from './components/Dialog/Dialog';
export { IconButton } from './components/IconButton/IconButton';
export type { IconButtonProps } from './components/IconButton/IconButton';
export { Tabs } from './components/Tabs/Tabs';
export type { TabsProps, TabsListProps, TabProps, TabsPanelProps } from './components/Tabs/Tabs';
export { Menu } from './components/Menu/Menu';
export type {
  MenuProps,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuLabelProps,
  MenuSeparatorProps,
  MenuSubProps,
  MenuSubTriggerProps,
  MenuSubContentProps,
} from './components/Menu/Menu';
export { Textarea } from './components/Textarea/Textarea';
export type { TextareaProps } from './components/Textarea/Textarea';
export { Select } from './components/Select/Select';
export type { SelectProps } from './components/Select/Select';
export { Checkbox } from './components/Checkbox/Checkbox';
export type { CheckboxProps } from './components/Checkbox/Checkbox';
export { RadioGroup } from './components/RadioGroup/RadioGroup';
export type { RadioGroupProps, RadioItemProps } from './components/RadioGroup/RadioGroup';
export { Switch } from './components/Switch/Switch';
export type { SwitchProps } from './components/Switch/Switch';
export { Tooltip } from './components/Tooltip/Tooltip';
export type { TooltipProps } from './components/Tooltip/Tooltip';
export { ToastProvider, useToast } from './components/ToastProvider/ToastProvider';
export type {
  ToastProviderProps,
  ToastOptions,
  ToastTone,
} from './components/ToastProvider/ToastProvider';
export { Avatar } from './components/Avatar/Avatar';
export type { AvatarProps } from './components/Avatar/Avatar';
export { Spinner } from './components/Spinner/Spinner';
export type { SpinnerProps } from './components/Spinner/Spinner';
export { Skeleton } from './components/Skeleton/Skeleton';
export type { SkeletonProps } from './components/Skeleton/Skeleton';
export { Card } from './components/Card/Card';
export type { CardProps, CardSectionProps } from './components/Card/Card';
export { Progress } from './components/Progress/Progress';
export type { ProgressProps } from './components/Progress/Progress';
export { Meter } from './components/Meter/Meter';
export type { MeterProps, MeterSegment, MeterThreshold } from './components/Meter/Meter';
export { Stat } from './components/Stat/Stat';
export type { StatProps, StatDelta, StatTone } from './components/Stat/Stat';
export { Table } from './components/Table/Table';
export type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TableCaptionProps,
  TableEmptyProps,
  SortDescriptor,
  SortDirection,
  TableDensity,
  SelectionMode,
  CellAlign,
} from './components/Table/Table';

// ── visualizations (data-driven; consume Visual Grammar contracts) ──
export { Hub } from './components/Hub/Hub';
export type {
  HubProps,
  HubContract,
  HubDomain,
  HubStat,
  HubSource,
  HubDomainKind,
  HubSlot,
} from './components/Hub/Hub';
export { Brief, parseBrief, fromMarkdown } from './components/Brief/Brief';
export type {
  BriefProps,
  BriefContract,
  BriefSection,
  BriefItem,
  BriefMeta,
  BriefKind,
  SectionKind,
  Severity,
  BriefIssue,
  BriefParseResult,
} from './components/Brief/Brief';
export { BarChart } from './components/BarChart/BarChart';
export type {
  BarChartProps,
  BarChartContract,
  BarDatum,
  BarSeries,
  BarChartMarker,
  BarTone,
} from './components/BarChart/BarChart';
export { Sparkline } from './components/Sparkline/Sparkline';
export type { SparklineProps, SparklineTone } from './components/Sparkline/Sparkline';
export { LineChart } from './components/LineChart/LineChart';
export type {
  LineChartProps,
  LineChartContract,
  LineSeries,
  LinePoint,
  LineBand,
  LineTarget,
  LineTone,
} from './components/LineChart/LineChart';
export { Gauge } from './components/Gauge/Gauge';
export type { GaugeProps, GaugeZone, GaugeTone } from './components/Gauge/Gauge';
export { DonutChart } from './components/DonutChart/DonutChart';
export type {
  DonutChartProps,
  DonutContract,
  DonutSegment,
  DonutTone,
} from './components/DonutChart/DonutChart';
export { Heatmap } from './components/Heatmap/Heatmap';
export type {
  HeatmapProps,
  HeatmapContract,
  HeatmapRow,
  HeatmapStop,
  HeatTone,
} from './components/Heatmap/Heatmap';
export { Funnel } from './components/Funnel/Funnel';
export type {
  FunnelProps,
  FunnelContract,
  FunnelStage,
  FunnelTone,
} from './components/Funnel/Funnel';
export { Treemap } from './components/Treemap/Treemap';
export type {
  TreemapProps,
  TreemapContract,
  TreemapNode,
  TreemapTone,
} from './components/Treemap/Treemap';
export { Swimlane } from './components/Swimlane/Swimlane';
export type {
  SwimlaneProps,
  SwimlaneContract,
  SwimlaneLane,
  SwimlaneStep,
  SwimlaneStatus,
  SwimlaneLaneKind,
} from './components/Swimlane/Swimlane';
export { RunHistory } from './components/RunHistory/RunHistory';
export type {
  RunHistoryProps,
  RunHistoryContract,
  RunRecord,
  RunOutput,
  RunStepOutcome,
  RunStatus,
  RunOutputKind,
} from './components/RunHistory/RunHistory';
export { Callout } from './components/Callout/Callout';
export type { CalloutProps, CalloutTone } from './components/Callout/Callout';
export { EmptyState } from './components/EmptyState/EmptyState';
export type { EmptyStateProps } from './components/EmptyState/EmptyState';
export { DataStatusBar } from './components/DataStatusBar/DataStatusBar';
export type {
  DataStatusBarProps,
  DataStatus,
  DataChipTone,
  DataFilter,
  DataMetric,
} from './components/DataStatusBar/DataStatusBar';
export { Timeline } from './components/Timeline/Timeline';
export type {
  TimelineProps,
  TimelineContract,
  TimelineEvent,
  TimelineCategory,
  TimelineTone,
} from './components/Timeline/Timeline';
export { FolderTree } from './components/FolderTree/FolderTree';
export type { FolderTreeProps, FolderNode } from './components/FolderTree/FolderTree';
export { Breadcrumb } from './components/Breadcrumb/Breadcrumb';
export type {
  BreadcrumbProps,
  BreadcrumbItemProps,
  BreadcrumbItemData,
} from './components/Breadcrumb/Breadcrumb';
export { NavBar } from './components/NavBar/NavBar';
export type { NavBarProps, NavBarLinkProps } from './components/NavBar/NavBar';
export { SkipLink } from './components/SkipLink/SkipLink';
export type { SkipLinkProps } from './components/SkipLink/SkipLink';
export { AudioWaveform } from './components/AudioWaveform/AudioWaveform';
export type { AudioWaveformProps } from './components/AudioWaveform/AudioWaveform';
export { VirtualAssetGrid } from './components/VirtualAssetGrid/VirtualAssetGrid';
export type { VirtualAssetGridProps } from './components/VirtualAssetGrid/VirtualAssetGrid';
export { Toolbar } from './components/Toolbar/Toolbar';
export type {
  ToolbarProps,
  ToolbarButtonProps,
  ToolbarSeparatorProps,
  ToolbarGroupProps,
} from './components/Toolbar/Toolbar';
