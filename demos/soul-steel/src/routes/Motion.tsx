import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Badge, Box, Button, Callout, Inline, Stack, Text } from '@trembus/ui';
import {
  AnimatedNumber,
  Presence,
  Reveal,
  Stagger,
  motionTokens,
  revealVariants,
  staggerVariants,
} from '../motion';

interface LabCard {
  id: string;
  kicker: string;
  body: string;
}

const CARDS: LabCard[] = [
  { id: 'forge', kicker: 'I · THE FORGE', body: 'Hammered from a drowned cathedral bell.' },
  { id: 'salt', kicker: 'II · THE SALT', body: 'Ninety-nine voices, none of them hers.' },
  { id: 'gate', kicker: 'III · THE GATE', body: 'Bricked shut for a reason nobody wrote down.' },
  { id: 'nail', kicker: 'IV · THE NAIL', body: 'The last one driven, and the first to rust.' },
];

const FACES = [
  { id: 'ferrum', label: 'Ferrum', line: 'Iron remembers the shape it was beaten into.' },
  { id: 'anima', label: 'Anima', line: 'A soul is only the argument a body keeps having.' },
  { id: 'ignis', label: 'Ignis', line: 'Fire is the only honest witness.' },
];

/** A lab section: heading, one-line thesis, and the demo itself. */
function Section({
  title,
  thesis,
  children,
}: {
  title: string;
  thesis: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="lg" weight="semibold">
          {title}
        </Text>
        <Text size="sm" tone="dim">
          {thesis}
        </Text>
      </Stack>
      {children}
    </Stack>
  );
}

function LabCardBox({ card }: { card: LabCard }) {
  return (
    <Stack gap={2}>
      <Text as="span" size="xs" mono tone="dim">
        {card.kicker}
      </Text>
      <Text as="span" size="sm">
        {card.body}
      </Text>
    </Stack>
  );
}

export function Motion() {
  const reduced = useReducedMotion() ?? false;
  const tokens = motionTokens();

  const [replay, setReplay] = useState(0);
  const [face, setFace] = useState(0);
  const [souls, setSouls] = useState(1274);

  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Text as="h1" size="xl" weight="bold" className="page-title">
          Motion
        </Text>
        <Text tone="dim">
          The motion-primitives spike. Everything here runs on{' '}
          <Text as="span" mono>
            motion@12
          </Text>{' '}
          — a dependency that exists in this demo only, never in{' '}
          <Text as="span" mono>
            packages/*
          </Text>
          . The question this page exists to answer: does it earn a{' '}
          <Text as="span" mono>
            @trembus/motion
          </Text>{' '}
          package, or does CSS already cover it?
        </Text>
      </Stack>

      <Callout
        tone={reduced ? 'warning' : 'info'}
        title={reduced ? 'Reduced motion: ON' : 'Reduced motion: off'}
      >
        {reduced
          ? 'Every primitive on this page has collapsed to an instant state change. Nothing below moves.'
          : 'Animations are live. Turn on “Reduce motion” in your OS display settings and this page re-renders motionless — no reload.'}{' '}
        A JS animation runtime does not see the CSS media query, so this is read through{' '}
        <Text as="span" size="sm" mono>
          useReducedMotion()
        </Text>{' '}
        and threaded into every variant by hand. That is the single biggest a11y cost of the
        dependency.
      </Callout>

      <Section
        title="The token bridge"
        thesis="Parsed live from :root — proof that JS motion can stay driven by the CSS tokens instead of forking them."
      >
        <Box surface="sunken" border="soft" radius="lg" p={5}>
          <Stack gap={2}>
            <Inline gap={3} wrap align="center">
              <Badge tone="neutral" variant="outline">
                --tcl-dur-fast
              </Badge>
              <Text size="sm" mono>
                {tokens.fast}s
              </Text>
              <Badge tone="neutral" variant="outline">
                --tcl-dur-base
              </Badge>
              <Text size="sm" mono>
                {tokens.base}s
              </Text>
              <Badge tone="neutral" variant="outline">
                --tcl-dur-slow
              </Badge>
              <Text size="sm" mono>
                {tokens.slow}s
              </Text>
            </Inline>
            <Inline gap={3} wrap align="center">
              <Badge tone="accent" variant="outline">
                --tcl-ease-calm
              </Badge>
              <Text size="sm" mono>
                [{tokens.calm.join(', ')}]
              </Text>
            </Inline>
            <Inline gap={3} wrap align="center">
              <Badge tone="accent" variant="outline">
                --tcl-ease-exit
              </Badge>
              <Text size="sm" mono>
                [{tokens.exit.join(', ')}]
              </Text>
            </Inline>
            <Text size="sm" tone="dim">
              CSS says <Text as="span" size="sm" mono>120ms</Text> and{' '}
              <Text as="span" size="sm" mono>cubic-bezier(…)</Text>; Motion wants seconds and a
              4-tuple. The bridge reads the computed values off{' '}
              <Text as="span" size="sm" mono>:root</Text> once and converts — so editing a token
              still moves every JS animation.
            </Text>
          </Stack>
        </Box>
      </Section>

      <Section
        title="Head to head — CSS baseline vs Motion"
        thesis="The same staggered reveal, twice. Left is one @keyframes rule and a --i custom property. Right is the dependency."
      >
        <Stack gap={4}>
          <Inline gap={3} align="center">
            <Button variant="solid" tone="accent" size="sm" onPress={() => setReplay((n) => n + 1)}>
              Replay both
            </Button>
            <Text size="sm" tone="dim">
              Remounts each column so the enter animations run again.
            </Text>
          </Inline>

          <div className="lab-split">
            <Stack gap={3}>
              <Inline gap={2} align="center">
                <Badge tone="success" variant="soft">
                  CSS
                </Badge>
                <Text size="sm" tone="dim">
                  0 kB · animation-delay: calc(var(--i) * --tcl-dur-fast)
                </Text>
              </Inline>
              <div key={`css-${replay}`} className="lab-col">
                {CARDS.map((card, index) => (
                  <Box
                    key={card.id}
                    className="css-reveal"
                    style={{ '--i': index } as CSSProperties}
                    surface="raised"
                    border
                    radius="lg"
                    p={5}
                  >
                    <LabCardBox card={card} />
                  </Box>
                ))}
              </div>
            </Stack>

            <Stack gap={3}>
              <Inline gap={2} align="center">
                <Badge tone="accent" variant="soft">
                  Motion
                </Badge>
                <Text size="sm" tone="dim">
                  ~34 kB gz · &lt;Stagger&gt; + &lt;Reveal&gt;
                </Text>
              </Inline>
              <Stagger key={`motion-${replay}`} className="lab-col">
                {CARDS.map((card) => (
                  <Reveal key={card.id}>
                    <Box surface="raised" border radius="lg" p={5}>
                      <LabCardBox card={card} />
                    </Box>
                  </Reveal>
                ))}
              </Stagger>
            </Stack>
          </div>

          <Callout tone="neutral" title="Verdict on this one">
            Visually indistinguishable. The CSS version needs an index on each item; the Motion
            version needs a 34 kB runtime. For a plain on-mount cascade, CSS wins outright.
          </Callout>
        </Stack>
      </Section>

      <Section
        title="Exit — the effect CSS cannot do"
        thesis="Swapping content requires the outgoing copy to outlive its own unmount. No stylesheet can defer a React unmount."
      >
        <Stack gap={4}>
          <Inline gap={2} wrap>
            {FACES.map((item, index) => (
              <Button
                key={item.id}
                size="sm"
                variant={index === face ? 'solid' : 'outline'}
                tone={index === face ? 'accent' : 'neutral'}
                onPress={() => setFace(index)}
              >
                {item.label}
              </Button>
            ))}
          </Inline>
          <Box surface="sunken" border="soft" radius="lg" p={6} style={{ minHeight: 96 }}>
            <Presence contentKey={face}>
              <Stack gap={2}>
                <Text size="xs" mono tone="faint">
                  ASPECT {String(face + 1).padStart(2, '0')}
                </Text>
                <Text size="lg" weight="semibold">
                  {FACES[face].label}
                </Text>
                <Text tone="dim">{FACES[face].line}</Text>
              </Stack>
            </Presence>
          </Box>
          <Callout tone="success" title="This is the real argument for the dependency">
            The outgoing aspect fades out on <Text as="span" size="sm" mono>--tcl-ease-exit</Text>{' '}
            before the incoming one rises on <Text as="span" size="sm" mono>--tcl-ease-calm</Text>.
            That is why the token set carries two curves — and the only effect on this page with no
            CSS equivalent.
          </Callout>
        </Stack>
      </Section>

      <Section
        title="Two ways to write the same thing"
        thesis="Wrapper components vs variant recipes on the primitives you already have."
      >
        <div className="lab-split">
          <Stack gap={3}>
            <Badge tone="neutral" variant="soft">
              Wrapper form
            </Badge>
            <Box surface="sunken" border="soft" radius="lg" p={5}>
              <Stagger className="lab-col" gap={0.08}>
                {CARDS.slice(0, 2).map((card) => (
                  <Reveal key={card.id} from="left">
                    <Box surface="raised" border radius="md" p={4}>
                      <LabCardBox card={card} />
                    </Box>
                  </Reveal>
                ))}
              </Stagger>
            </Box>
            <Text size="sm" tone="dim">
              Adds two <Text as="span" size="sm" mono>&lt;div&gt;</Text> layers per item, and the
              wrapper — not the Box — becomes the layout child.
            </Text>
          </Stack>

          <Stack gap={3}>
            <Badge tone="accent" variant="soft">
              Recipe form
            </Badge>
            <Box surface="sunken" border="soft" radius="lg" p={5}>
              <Stack
                as={motion.div}
                gap={4}
                variants={staggerVariants({ gap: 0.08, reduced })}
                initial="hidden"
                animate="visible"
              >
                {CARDS.slice(0, 2).map((card) => (
                  <Box
                    key={card.id}
                    as={motion.div}
                    variants={revealVariants({ from: 'left', reduced })}
                    surface="raised"
                    border
                    radius="md"
                    p={4}
                  >
                    <LabCardBox card={card} />
                  </Box>
                ))}
              </Stack>
            </Box>
            <Text size="sm" tone="dim">
              Zero extra nodes. The variants ride on{' '}
              <Text as="span" size="sm" mono>Stack</Text> and{' '}
              <Text as="span" size="sm" mono>Box</Text> through their polymorphic{' '}
              <Text as="span" size="sm" mono>as</Text> — every surface/padding prop intact.
            </Text>
          </Stack>
        </div>
      </Section>

      <Section
        title="Tweened numbers"
        thesis="A readout that counts instead of jumping — with the digits hidden from screen readers and the true value beside them."
      >
        <Inline gap={5} align="center" wrap>
          <Box surface="raised" border radius="lg" p={6}>
            <Stack gap={1}>
              <Text size="xs" mono tone="faint">
                SOULS BOUND
              </Text>
              <Text as="div" size="xl" weight="bold">
                <AnimatedNumber value={souls} />
              </Text>
            </Stack>
          </Box>
          <Button
            variant="outline"
            tone="neutral"
            onPress={() => setSouls((n) => n + Math.round(Math.random() * 900) + 100)}
          >
            Bind more souls
          </Button>
        </Inline>
      </Section>

      <Section
        title="Reveal on scroll"
        thesis="The one enter-trigger CSS has only just caught up with (animation-timeline: view())."
      >
        <Stack gap={4}>
          <Box surface="sunken" border="soft" radius="lg" p={6}>
            <Text tone="dim">Scroll down — the plate below reveals every time it re-enters.</Text>
          </Box>
          <div style={{ height: '40vh' }} aria-hidden="true" />
          <Reveal when="in-view" once={false} from="scale" duration="slow">
            <Box surface="raised" border radius="lg" p={7}>
              <Stack gap={2}>
                <Text size="xs" mono tone="faint">
                  IN VIEW
                </Text>
                <Text size="lg" weight="semibold">
                  It rises each time you scroll it back.
                </Text>
                <Text size="sm" tone="dim">
                  <Text as="span" size="sm" mono>
                    &lt;Reveal when="in-view" once={'{false}'} from="scale"&gt;
                  </Text>{' '}
                  — an IntersectionObserver under the hood.
                </Text>
              </Stack>
            </Box>
          </Reveal>
        </Stack>
      </Section>
    </Stack>
  );
}
