import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
} from "@floating-ui/dom";

//tooltip using floating-ui
export function Tooltip(Alpine) {
  Alpine.directive("tooltip", (el) => {
    el.parentNode.setAttribute("u-tooltip-reference", "");

    const offsetValue = el.getAttribute("u-tooltip-offset") ?? 0;
    const placement = el.getAttribute("u-tooltip-placement") ?? "bottom";
    const margin = el.getAttribute("u-tooltip-margin") ?? 4;
    const arrowMargin = el.getAttribute("u-tooltip-arrow-margin") ?? 4;
    const trigger = el.getAttribute("u-tooltip-trigger") ?? "hover";

    const arrowEl = el.querySelector("u-tooltip-arrow");

    let timer;
    let cleanUp;

    Alpine.bind(el.parentNode, () => ({
      "u-data"() {
     
        return {
          source: el.parentNode,
          target: el,
          arrow: arrowEl,
          offset: arrowEl ? 6 : offsetValue,
          placement,
          margin,
          arrowMargin,
          trigger,
          show: false,
          updatePosition(source, target, arrowEl) {
            computePosition(source, target, {
              placement: this.placement,
              middleware: [
                offset(this.offset),
                flip(),
                shift({ padding: this.margin }),
                arrowEl
                  ? arrow({ element: arrowEl, padding: this.arrowMargin })
                  : "",
              ],
            }).then(({ x, y, placement, middlewareData }) => {
              Object.assign(target.style, {
                left: `${x}px`,
                top: `${y}px`,
              });

              // Accessing the data
              if (!arrowEl) return;
              const { x: arrowX, y: arrowY } = middlewareData.arrow;

              const staticSide = {
                top: "bottom",
                right: "left",
                bottom: "top",
                left: "right",
              }[placement.split("-")[0]];

              Object.assign(arrowEl.style, {
                left: arrowX != null ? `${arrowX}px` : "",
                top: arrowY != null ? `${arrowY}px` : "",
                right: "",
                bottom: "",
                [staticSide]: "-4px",
              });
            });
          },

          toggle() {
            this.show = !this.show;
            
          },
        };
      },
      'u-init'() {
        // change display based on this.show
        Alpine.effect(() => {
          clearTimeout(timer);

          if (this.show) {
            this.target.style.display = "block";
            cleanUp = autoUpdate(this.source, this.target, () => {
              this.updatePosition(this.source, this.target, this.arrow);
            });
          } else {
            timer = setTimeout(() => {
              this.target.style.display = "none";
              if(cleanUp) {
                cleanUp();
              }
            }, 150);
          }
        });
      }
    }));

    if (trigger == "click") {
      Alpine.bind(el.parentNode, () => ({
        "u-on:focus"() {
          this.show = true;
        },
        "u-on:blur"() {
          this.show = false;
          // this.hide();
        },
        "u-on:click"() {
          // this.toggle();
        },
      }));
    } else {
      Alpine.bind(el.parentNode, () => ({
        "u-on:mouseenter"() {
          this.show = true;
        },
        "u-on:mouseleave"() {
          this.show = false;
        },
      }));
    }
  });
}