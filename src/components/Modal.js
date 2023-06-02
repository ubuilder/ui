/**
 *
 * @type {import('./types').Modal}
 */
export function Modal($props, slots) {
  const {
    component = "modal",
    open = false,
    persistent,
    ...restProps
  } = $props;

  const props = {
    ...restProps,
    component,
    cssProps: { open },
    jsProps: { open, persistent },
    onMount($el, $props) {
      const props = JSON.parse($props);

      if (props.open) {
        $el.classList.add("u-modal-open");
      }

      // close modal
      $el.querySelector(".u-modal-backdrop").addEventListener("click", () => {
        console.log(props);
        if (props.persistent) return;
        $el.classList.remove("u-modal-open");
      });
    },
  };

  return View(props, [
    View({ component: component + "-backdrop" }),
    View({ component: component + "-content" }, slots),
  ]);
}

/**
 * @type {import('./types').ModalBody}
 */
export function ModalBody($props, slots) {
  const { component = "modal-body", ...restProps } = $props;

  const props = {
    ...restProps,
    component,
  };
  return View(props, slots);
}
