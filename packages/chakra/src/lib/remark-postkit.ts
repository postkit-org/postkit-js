/*
 * The Remark transform is renderer-neutral, so it lives in
 * `@postkit/react/remark`, where `createPostkit` validates directives against
 * a site's enabled set. Re-exported for 0.x imports.
 */
export {
  isPostkitComponentName,
  remarkPostkit,
  type PostkitDirectiveNode,
  type PostkitUnavailableComponent,
  type PostkitVFileLike,
  type RemarkPostkitOptions,
} from '@postkit/react/remark';
