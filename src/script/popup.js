// tooltip
// popup
// dropdown
// sidebar/navbar items
// import tippy from "tippy.js/dist/tippy.esm"


import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  
  //popup using floating-ui
  export function Popup(Alpine) {
    Alpine.directive("popup", (el) => {
      const edge = el.querySelector('[u-popup-edge]');
      
      const target =
        document.querySelector(el.getAttribute("u-popup-target")) ?? el.parentNode;
      const floatingEl = el;
      
      target.setAttribute('u-popup-reference', '')
      
      const offsetValue = el.getAttribute("u-popup-offset") ?? 0;
      const placement = el.getAttribute("u-popup-placement") ?? "bottom";
      const shiftMargin = el.getAttribute("u-popup-margin") ?? 4;
      const arrowEl = el.querySelector("[u-popup-arrow]");
      const trigger = el.getAttribute("u-popup-trigger") ?? "click";
      const arrowMargin = el.getAttribute("u-popup-arrow-margin") ?? 4;
      const flipAble = el.hasAttribute('u-popup-flip') ?? true;
      const shiftAble = el.hasAttribute('u-popup-shift') ?? true;
  
      let cleanUp;
  
      function updatePosition() {
        computePosition(target, floatingEl, {
          placement,
          middleware: [
            offset(offsetValue? offsetValue : arrowEl? 6: 0),
            flipAble? flip(): "",
            shiftAble? shift({ padding: shiftMargin }): "",
            arrowEl ? arrow({ element: arrowEl, padding: arrowMargin }) : "",
          ],
        }).then(({ x, y, placement, middlewareData }) => {
          Object.assign(floatingEl.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
  
          // setting the arrow position if arrow exists
          if (arrowEl) {
            const { x: arrowX, y: arrowY } = middlewareData.arrow;
            const staticSide = {
              top: "bottom",
              right: "left",
              bottom: "top",
              left: "right",
            }[placement.split("-")[0]];
            const rotateDeg = {
              bottom: 0,
              left: 90,
              top: 180,
              right: 270,
            }[placement.split("-")[0]];
            
            Object.assign(arrowEl.style, {
              left: arrowX != null ? `${arrowX}px` : "",
              top: arrowY != null ? `${arrowY}px` : "",
              right: "",
              bottom: "",
              [staticSide]: "-8px",
              transform: `rotate(${rotateDeg}deg)`
              
            });
          }

          // for persisting floatingEl when hover over it
          if(edge) {
            const edgeSide = {
              bottom: "borderBottomWidth",
              left: "borderLeftWidth",
              top: "borderTopWidth",
              right: "borderRightWidth",
            }[placement.split("-")[0]];
  
            Object.assign(edge.style, {
              borderWidth: '0px',
              [edgeSide]: `${15 + offsetValue}px`,
            });
          }
        });
      }

      Alpine.bind(target, () => ({
        "u-data"() {
          return {
            show() {
              Object.assign(el.style, {
                display: "block",
              });
              cleanUp = autoUpdate(target, floatingEl, () => {
                updatePosition();
              });
            },
            hide() {
              Object.assign(el.style, {
                display: "none",
              });
              if (cleanUp) {
                cleanUp();
              }
            },
            toggle() {
              if (el.style.display === "block") {
                hide();
              } else {
                show();
              }
            },
          };
        },
      }));

      if (trigger == "click") {
        Alpine.bind(target, () => ({
          "u-on:focus"() {
            this.show();
          },
          "u-on:blur"() {
            this.hide();
          },
        }));
      } else {
        Alpine.bind(target, () => ({
          "u-on:mouseenter"() {
            this.show();
          },
          "u-on:mouseleave"() {
            this.hide();
          },
        }));
      }
      Alpine.bind(floatingEl, () => ({
        "u-on:mouseenter"() {
          floatingEl.focus();
        },
        "u-on:focus"() {
          floatingEl.focus()
        },
      }));

      //if the persistant is false
      if(!edge){
        Alpine.bind(floatingEl, () => ({
          "u-on:mouseenter"() {
            this.hide();
          },
          "u-on:focus"() {
            this.hide();
          },
        }));
      }
      
    });
  }
  























// export function Popup(Alpine) {

//     // use @floating-ui/dom similar to yesvelte
//     Alpine.directive('popup', (el, {}, {evaluate, cleanup}) => {
//         const trigger = el.getAttribute('trigger')
//         const placement = el.getAttribute('placement')
//         const target = el.getAttribute('target')

//         // let targetEl;

//         // if(target) {
//         //     targetEl = evaluate(target) ?? el.previousElementSibling
//         // } else {
//         //     targetEl = el.previousElementSibling;
//         // }

//         // let instance = tippy(targetEl, {
//         //     // hideOnClick: true,
//         //     arrow: true,
//         //     // placement: placement,
//         //     // trigger: trigger,
//         //     content: (reference) => reference.innerHTML
//         // })[0]

//         // cleanup(() => {
//         //     instance.destroy()
//         // })        
//     })
// }