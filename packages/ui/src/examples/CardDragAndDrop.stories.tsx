// Example PAGE — proof of the "bring your own drag-and-drop" approach: a list of
// library <Card>s made sortable with dnd-kit, the CONSUMER's chosen engine.
//
// Lives in src/examples/ (outside src/components/) so check:contracts ignores it —
// a composition has no single 3-jobs contract. Storybook finds it via the
// src/**/*.stories.tsx glob.
//
// The point of this demo: it makes ZERO changes to @trembus/ui. Each Card is
// grabbed purely through its EXISTING pass-through API — it spreads props/style
// onto its root, and a thin wrapper <div> owns the drag ref + transform. dnd-kit
// is a DEV dependency here only; the library itself stays engine-free, so a
// consumer can reach for dnd-kit, Pragmatic, native HTML5 DnD — whatever they like.
//
// Accessibility comes from the engine for free: the drag handle is a real
// <button>, so keyboard users focus it, press Space to grab, Arrow keys to move,
// Space to drop, Esc to cancel — and dnd-kit announces each step via an aria-live
// region it injects automatically.
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Card, Inline, Stack, Text } from '../index';

type Tone = 'success' | 'info' | 'warning' | 'accent';

interface Task {
  id: string;
  title: string;
  owner: string;
  tone: Tone;
  badge: string;
}

const INITIAL: Task[] = [
  { id: 'tokens', title: 'Design-token audit', owner: 'Nicholas', tone: 'success', badge: 'Done' },
  { id: 'spike', title: 'Drag & drop spike', owner: 'Ada', tone: 'info', badge: 'In progress' },
  {
    id: 'keyboard',
    title: 'Keyboard reordering',
    owner: 'Grace',
    tone: 'info',
    badge: 'In progress',
  },
  { id: 'review', title: 'Adversarial review', owner: 'Linus', tone: 'warning', badge: 'Queued' },
  { id: 'release', title: 'Cut 0.3.0', owner: 'Nicholas', tone: 'accent', badge: 'Planned' },
];

const handleStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  color: 'var(--tcl-text-faint)',
  borderRadius: 'var(--tcl-radius-sm)',
  fontSize: 'var(--tcl-text-lg)',
  lineHeight: 1,
  cursor: 'grab',
  // Stop the browser from claiming the gesture as a scroll on touch devices.
  touchAction: 'none',
};

/** One sortable row: a thin wrapper holds the drag ref/transform; the Card is untouched. */
function SortableCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <Card interactive>
        <Card.Body>
          <Inline align="center" gap={3}>
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label={`Reorder ${task.title}`}
              style={handleStyle}
              {...attributes}
              {...listeners}
            >
              <span aria-hidden="true">⠿</span>
            </button>
            <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
              <Text weight="medium" truncate>
                {task.title}
              </Text>
              <Text size="sm" tone="dim">
                {task.owner}
              </Text>
            </Stack>
            <Badge tone={task.tone} variant="soft" dot>
              {task.badge}
            </Badge>
          </Inline>
        </Card.Body>
      </Card>
    </div>
  );
}

function SortableCardBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL);

  const sensors = useSensors(
    // A tiny distance threshold so a click on the handle isn't read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const from = items.findIndex((t) => t.id === active.id);
        const to = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, from, to);
      });
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text
            size="xs"
            tone="faint"
            mono
            style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
          >
            Bring your own drag and drop
          </Text>
          <Text as="h1" size="xl" weight="bold">
            Sortable cards
          </Text>
          <Text tone="dim">
            These are unmodified @trembus/ui Cards. dnd-kit — the consumer&apos;s engine, a dev-only
            dependency — makes them sortable. Drag the handle, or focus it and press Space, then the
            Arrow keys, then Space to drop.
          </Text>
        </Stack>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <Stack gap={3}>
              {tasks.map((task) => (
                <SortableCard key={task.id} task={task} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>

        <Text size="sm" tone="faint">
          Order: {tasks.map((t) => t.title).join('  →  ')}
        </Text>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Card Drag and Drop',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A list of unmodified library Cards made sortable by dnd-kit. Proves a consumer
 * can add drag-and-drop using only the Card's existing pass-through API — no
 * library changes, no bundled engine.
 */
export const Default: Story = {
  render: () => <SortableCardBoard />,
};
