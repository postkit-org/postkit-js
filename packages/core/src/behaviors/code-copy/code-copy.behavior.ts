import * as clipboard from '@zag-js/clipboard';

import {
  createMachineBehavior,
  type MachineBehavior,
  type MachineSchemaOf,
} from '../behavior.js';
import type { DomPropTypes } from '../dom.js';

/** Options for Postkit's code copy behaviour. */
export interface CodeCopyBehaviorOptions {
  /** A unique id; Zag derives every part's id from it. */
  readonly id: string;
  /** The source to copy. */
  readonly code: string;
  /** How long the copied state lasts, in milliseconds. Defaults to 1000. */
  readonly timeout?: number;
  /** The root node to query, for shadow DOM hosts. */
  readonly getRootNode?: clipboard.Props['getRootNode'];
  /** Called when the copied state starts. */
  readonly onStatusChange?: clipboard.Props['onStatusChange'];
}

/**
 * How Postkit configures code copy, matching `@postkit/chakra`'s `CodeBlock`:
 * the copied state lasts one second (Chakra's `copyTimeout` default) and the
 * labels default to "Copy code" and "Copied".
 */
export const postkitCodeCopyConfig = Object.freeze({
  timeout: 1000,
  label: 'Copy code',
  copiedLabel: 'Copied',
} as const);

/** Zag clipboard props for Postkit's configuration. */
export function codeCopyProps(
  options: CodeCopyBehaviorOptions,
): clipboard.Props {
  return {
    id: options.id,
    value: options.code,
    timeout: options.timeout ?? postkitCodeCopyConfig.timeout,
    ...(options.getRootNode ? { getRootNode: options.getRootNode } : {}),
    ...(options.onStatusChange
      ? { onStatusChange: options.onStatusChange }
      : {}),
  };
}

/** Zag's clipboard machine, for framework adapters such as `useMachine`. */
export const codeCopyMachine: clipboard.Machine = clipboard.machine;

/** Zag's clipboard `connect`, for framework adapters. */
export const connectCodeCopy = clipboard.connect;

/** The code copy API for framework-free hosts. */
export type CodeCopyBehaviorApi = clipboard.Api<DomPropTypes>;

/** A running code copy behaviour. */
export type CodeCopyBehavior = MachineBehavior<
  MachineSchemaOf<clipboard.Machine>,
  CodeCopyBehaviorApi
>;

/** Creates Postkit's code copy behaviour without a UI framework. */
export function createCodeCopy(
  options: CodeCopyBehaviorOptions,
): CodeCopyBehavior {
  return createMachineBehavior(
    clipboard.machine,
    clipboard.connect,
    codeCopyProps(options),
  );
}
