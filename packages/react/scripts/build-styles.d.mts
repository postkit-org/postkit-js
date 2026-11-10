/** The stylesheet's sources, relative to `src/`, in cascade order. */
export declare function postkitStyleSources(): Promise<string[]>;

/** The concatenated `styles.css`. */
export declare function buildPostkitStylesheet(): Promise<string>;
