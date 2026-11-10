/**
 * `@postkit/react`: headless, styleable React views for Postkit components.
 *
 * Views emit the component anatomy (`data-postkit-component`,
 * `data-postkit-part` and state attributes such as `data-tone`) and no styles.
 *
 * @module
 */
export {
  isPostkitDevelopment,
  postkitPartAttributes,
  postkitStateAttributeName,
  resolvePostkitViewState,
  validatePostkitProps,
  warnPostkitProps,
  type PostkitPartAttributes,
  type PostkitViewState,
  type ResolvePostkitViewStateOptions,
} from './lib/anatomy.js';
export {
  postkitView,
  type PostkitChildrenPropsOf,
  type PostkitPartGetter,
  type PostkitPartOptions,
  type PostkitPartProps,
  type PostkitRootProps,
  type PostkitViewComponent,
  type PostkitViewContext,
  type PostkitViewOptions,
  type PostkitViewOwnProps,
  type PostkitViewProps,
} from './lib/view.js';
export { Aside, type AsideProps } from './components/aside/aside.js';
export {
  Callout,
  postkitCalloutMarks,
  type CalloutProps,
  type CalloutSlot,
  type CalloutTone,
} from './components/callout/callout.js';
export {
  Figure,
  postkitImageDimension,
  type FigureProps,
  type FigureSlot,
} from './components/figure/figure.js';
export { chakraOnly, type ChakraOnlyComponentName } from './lib/chakra-only.js';
export {
  Diff,
  postkitDiffLines,
  type DiffProps,
  type DiffSlot,
  type PostkitDiffLine,
} from './components/diff/diff.js';
export {
  FileCard,
  postkitFileCardMark,
  type FileCardProps,
  type FileCardSlot,
} from './components/file-card/file-card.js';
export {
  FileTree,
  postkitFileTreeDepth,
  postkitFileTreeItems,
  type FileTreeItem,
  type FileTreeProps,
  type FileTreeSlot,
} from './components/file-tree/file-tree.js';
export {
  Terminal,
  type TerminalProps,
  type TerminalSlot,
} from './components/terminal/terminal.js';
