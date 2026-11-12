import type { PollOption } from './poll.behavior.js';
import {
  accessibleName,
  check,
  checkEqual,
  click,
  visibleText,
  type BehaviorDriver,
  type BehaviorSpec,
} from '../testing/harness.js';
import { installBehaviorEnvironment } from '../testing/environment.js';

/** What a poll renderer draws for the shared spec. */
export interface PollBehaviorFixture {
  readonly question: string;
  readonly options: readonly PollOption[];
  /** A number, or a string from a Markdown directive. */
  readonly totalVotes?: number | string;
  readonly selectedId?: string;
  /** The spec records votes through this; pass it to the poll's handler. */
  readonly onVote: (option: PollOption) => void;
}

const options: readonly PollOption[] = [
  { id: 'md', label: 'Markdown', votes: 3 },
  { id: 'mdx', label: 'MDX', votes: 1 },
  { id: 'html', label: 'HTML', votes: 2 },
];

const fixture: Omit<PollBehaviorFixture, 'onVote'> = {
  question: 'Which format do you write in?',
  options,
};

/** 3, 1 and 2 of 6 votes. */
const PERCENTAGES = [50, 17, 33];

function parts(root: Element) {
  const group = Array.from(root.querySelectorAll('[role="group"]')).find(
    (candidate) => accessibleName(candidate) === fixture.question,
  );
  check(group, 'The options are a group named by the question');
  const buttons = Array.from(group.querySelectorAll('button'));
  const status = Array.from(root.querySelectorAll('[aria-live="polite"]'));
  return { group, buttons, status };
}

function statusText(root: Element): string {
  return parts(root)
    .status.map((region) => visibleText(region))
    .join(' ')
    .trim();
}

function expectPressed(root: Element, index: number | undefined): void {
  const { buttons } = parts(root);
  buttons.forEach((button, buttonIndex) => {
    checkEqual(
      button.getAttribute('aria-pressed'),
      buttonIndex === index ? 'true' : 'false',
      `Option ${buttonIndex} aria-pressed`,
    );
  });
}

/**
 * The shared poll spec: a group of option buttons named by the question,
 * results as percentages and meters, one vote per poll instance (a new choice
 * moves it; repeating it sends nothing), and a polite status line.
 */
export function pollBehaviorSpec(
  driver: BehaviorDriver<PollBehaviorFixture>,
): BehaviorSpec {
  const run =
    (
      body: (root: Element, votes: readonly string[]) => Promise<void>,
      overrides: Partial<Omit<PollBehaviorFixture, 'onVote'>> = {},
    ) =>
    async () => {
      const restore = installBehaviorEnvironment();
      const votes: string[] = [];
      try {
        const root = await driver.render({
          ...fixture,
          ...overrides,
          onVote: (option) => {
            votes.push(option.id);
          },
        });
        await body(root, votes);
      } finally {
        await driver.cleanup();
        restore();
      }
    };

  const vote = async (root: Element, index: number) => {
    const button = parts(root).buttons[index];
    check(button, `Option ${index} exists`);
    await driver.interact(() => click(button));
  };

  return {
    behavior: 'Poll',
    cases: [
      {
        name: 'is a group of option buttons named by the question, none pressed',
        run: run(async (root, votes) => {
          const { buttons } = parts(root);
          checkEqual(buttons.length, options.length, 'One button per option');
          buttons.forEach((button, index) => {
            checkEqual(button.getAttribute('type'), 'button', 'Button type');
            check(
              visibleText(button).includes(options[index]?.label ?? ''),
              `Option ${index} shows its label`,
            );
          });
          expectPressed(root, undefined);
          checkEqual(statusText(root), '6 votes', 'The status shows the total');
          checkEqual(votes.length, 0, 'Nothing is voted on render');
        }),
      },
      {
        name: "shows each option's share of the votes",
        run: run(async (root) => {
          const { buttons } = parts(root);
          buttons.forEach((button, index) => {
            const percentage = PERCENTAGES[index];
            check(
              visibleText(button).includes(`${percentage}%`),
              `Option ${index} shows ${percentage}%`,
            );
            const meter = button.querySelector('[role="progressbar"]');
            check(meter, `Option ${index} has a progressbar`);
            checkEqual(
              meter.getAttribute('aria-valuenow'),
              String(percentage),
              `Option ${index} meter value`,
            );
          });
        }),
      },
      {
        name: 'uses totalVotes, given as a directive string, for the results',
        run: run(
          async (root) => {
            checkEqual(statusText(root), '12 votes', 'The status total');
            check(
              visibleText(parts(root).buttons[0] as Element).includes('25%'),
              '3 of 12 votes is 25%',
            );
          },
          { totalVotes: '12' },
        ),
      },
      {
        name: 'records a vote, presses the chosen option and announces it',
        run: run(async (root, votes) => {
          await vote(root, 1);
          await driver.waitFor(() => {
            expectPressed(root, 1);
            checkEqual(statusText(root), 'Vote selected', 'The status');
          });
          checkEqual(votes.join(','), 'mdx', 'The recorded vote');
        }),
      },
      {
        name: 'holds one vote: a new choice moves it and a repeat sends nothing',
        run: run(async (root, votes) => {
          await vote(root, 0);
          await driver.waitFor(() => expectPressed(root, 0));
          await vote(root, 0);
          await driver.waitFor(() => expectPressed(root, 0));
          checkEqual(votes.join(','), 'md', 'A repeated vote is not sent');
          await vote(root, 2);
          await driver.waitFor(() => expectPressed(root, 2));
          checkEqual(votes.join(','), 'md,html', 'The vote moved');
        }),
      },
      {
        name: 'starts with selectedId pressed',
        run: run(
          async (root, votes) => {
            expectPressed(root, 2);
            checkEqual(statusText(root), 'Vote selected', 'The status');
            await vote(root, 2);
            checkEqual(votes.length, 0, 'The preselected option is not sent');
          },
          { selectedId: 'html' },
        ),
      },
      {
        name: 'asks for a vote and shows no results without counts',
        run: run(
          async (root) => {
            checkEqual(statusText(root), 'Select an option', 'The status');
            check(
              !visibleText(parts(root).group).includes('%'),
              'No percentages without counts',
            );
            checkEqual(
              root.querySelectorAll('[role="progressbar"]').length,
              0,
              'No meters without counts',
            );
          },
          {
            options: options.map(({ id, label }) => ({ id, label })),
          },
        ),
      },
    ],
  };
}
