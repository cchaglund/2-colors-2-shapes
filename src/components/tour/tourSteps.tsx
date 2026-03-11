import type { ReactNode } from 'react';
import type { TourStep } from '../../hooks/ui/useTour';
import type { DailyChallenge } from '../../types';
import { TourHint } from './TourHint';
import { ChallengePreview } from '../shared/ChallengePreview';

export interface TourStepConfig {
  id: TourStep;
  targetSelector: string;
  heading: string;
  body: ReactNode;
  buttonLabel: string;
  interactionType: 'click-next' | 'click-next-interactive';
  showSkip: boolean;
}

export interface StepContext {
  challenge?: DailyChallenge | null;
  isDark?: boolean;
}

function buildWelcomeBody(ctx: StepContext): ReactNode {
  // Tooltip inverts with mode: dark bg in light mode, white bg in dark mode
  const previewVariant = ctx.isDark ? 'light' : 'dark';
  return (
    <>
      <p>Every day brings a new creative challenge — <strong>3&nbsp;colors</strong>, <strong>2&nbsp;shapes</strong>, and an inspiration word.</p>
      {ctx.challenge && (
        <div className="my-8 py-3" style={{ transform: 'scale(1.3)' }}>
          <ChallengePreview challenge={ctx.challenge} variant={previewVariant} />
        </div>
      )}
      <p className="mt-3">Make something great with today{'\''}s set, then see what others created!</p>
      <TourHint>Let{'\''}s take a quick tour of the important bits. You can always replay it later.</TourHint>
    </>
  );
}

function buildSteps(ctx: StepContext): TourStepConfig[] {
  return [
    {
      id: 'welcome',
      targetSelector: '',
      heading: 'Welcome to shapepaint!',
      body: buildWelcomeBody(ctx),
      buttonLabel: 'Show me around',
      interactionType: 'click-next',
      showSkip: true,
    },
    {
      id: 'challenge',
      targetSelector: '[data-tour="challenge"]',
      heading: 'The challenge',
      body: (
        <>
          <p>What can you create with just <strong>three colors</strong> and <strong>two shapes</strong>?</p>
          <TourHint>Use the daily word to kick off your creativity!</TourHint>
          <p className="mt-3">Check in every day for a new challenge!</p>
        </>
      ),
      buttonLabel: 'Next',
      interactionType: 'click-next',
      showSkip: true,
    },
    {
      id: 'add-shape',
      targetSelector: '[data-tour="add-shapes"]',
      heading: 'Add a shape',
      body: 'Click on a colored shape to add it to the canvas.',
      buttonLabel: 'Got it',
      interactionType: 'click-next-interactive',
      showSkip: true,
    },
    {
      id: 'manipulate',
      targetSelector: '[data-tour="shape"]',
      heading: 'Make it yours',
      body: (
        <>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Move</strong> by dragging</li>
            <li><strong>Resize</strong> and <strong>rotate</strong> from a corner</li>
            <li><strong>Delete</strong> with backspace</li>
            <li><strong>Duplicate</strong> by pressing D</li>
          </ul>
          <TourHint>More tools available in the left toolbar!</TourHint>
        </>
      ),
      buttonLabel: 'Got it',
      interactionType: 'click-next-interactive',
      showSkip: true,
    },
    {
      id: 'colors',
      targetSelector: '[data-tour="colors"]',
      heading: 'Change colors',
      body: "Swap a selected shape's color, or change the background.",
      buttonLabel: 'Next',
      interactionType: 'click-next-interactive',
      showSkip: true,
    },
    {
      id: 'submit',
      targetSelector: '[data-tour="submit"]',
      heading: 'Happy with your creation?',
      body: 'Submit it and see what others made!',
      buttonLabel: 'Finish',
      interactionType: 'click-next',
      showSkip: false,
    },
  ];
}

export function getStepConfig(step: TourStep, ctx: StepContext = {}): TourStepConfig {
  return buildSteps(ctx).find(s => s.id === step)!;
}
