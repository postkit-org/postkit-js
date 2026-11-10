import {
  createEmbedConsent,
  createTabs,
  spreadProps,
} from '@postkit/core/behaviors';

/**
 * Postkit's tabs behaviour with no UI framework: build the parts once, apply
 * the behaviour's props, and re-apply them after every change. A custom
 * element wraps the same loop.
 */
export function mountTabs(
  host: HTMLElement,
  items: readonly {
    readonly id: string;
    readonly label: string;
    readonly content: string;
  }[],
): () => void {
  const tabs = createTabs({
    id: host.id || 'install-tabs',
    values: items.map((item) => item.id),
    initialIndex: host.dataset.initialIndex,
  });
  const list = document.createElement('div');
  const triggers = items.map((item) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    return button;
  });
  const panels = items.map((item) => {
    const panel = document.createElement('div');
    panel.textContent = item.content;
    return panel;
  });
  list.append(...triggers);
  host.replaceChildren(list, ...panels);

  const render = () => {
    const { api } = tabs;
    spreadProps(host, api.getRootProps());
    spreadProps(list, { ...api.getListProps(), 'aria-label': 'Install' });
    items.forEach((item, index) => {
      spreadProps(triggers[index]!, api.getTriggerProps({ value: item.id }));
      spreadProps(panels[index]!, api.getContentProps({ value: item.id }));
    });
  };
  render();
  const unsubscribe = tabs.subscribe(render);
  tabs.start();
  return () => {
    unsubscribe();
    tabs.stop();
  };
}

/**
 * An embed behind a consent prompt. With the default `click` activation the
 * frame, and any request to its origin, waits for the reader.
 */
export function mountEmbed(
  host: HTMLElement,
  src: string,
  title: string,
): () => void {
  const consent = createEmbedConsent();
  const render = () => {
    const { api } = consent;
    spreadProps(host, api.getRootProps());
    if (api.shouldRenderFrame) {
      if (host.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      spreadProps(frame, { ...api.getFrameProps(), src, title });
      host.replaceChildren(frame);
      return;
    }
    const button = document.createElement('button');
    button.textContent = 'Load embed';
    spreadProps(button, api.getRequestTriggerProps());
    host.replaceChildren(button);
  };
  render();
  const unsubscribe = consent.subscribe(render);
  consent.start();
  return () => {
    unsubscribe();
    consent.stop();
  };
}
