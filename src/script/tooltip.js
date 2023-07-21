// import { createPopper } from "@popperjs/core";
// import tippy from "tippy.js";
// import 'tippy.js/dist/tippy.css'
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
} from '@floating-ui/dom';
 
// import {
//   computePosition,
//   autoUpdate,
//   flip,
//   shift,
//   offset,
//   arrow,
// } from '@floating-ui/dom';
 




// export function Tooltip(Alpine) {
//   Alpine.directive("tooltip", (el, {}, { Alpine , evaluate }) => {
//     console.log("tooltip registerd");
//     let source = el.parentElement;
//     let target = el;
//     let Popper = null;
//     let arrow = el.querySelector('[u-tooltip-arrow]');
//     let PopperInitializer = async function () {
//       if (Popper) Popper.destroy();
//       Popper = createPopper(source, target, {
//         placement: "right",
//         strategy: "fixed",
//         modifiers: [
//           arrow
//             ? 
//             {
//                 name: "arrow",
//                 options: {
//                   element: arrow,
//                 },
//               }
//             : "",
//             {
//               name: 'computeStyles',
//               options: {
//                 gpuAcceleration: true, // true by default
//               },
//             },
//             {
//               name: 'computeStyles',
//               options: {
//                 adaptive: true, // true by default
//               },
//             },
//             {
//               name: 'computeStyles',
//               options: {
//                 roundOffsets: ({ x, y }) => ({
//                   x: Math.round(x + 2),
//                   y: Math.round(y + 2),
//                 }),
//               },
//             },
//         ],
//       });

//       const state = await Popper.setOptions({modifiers: [
//           {
//             name: 'offset',
//             options: {
//               offset: [0, 8],
//             },
//             }
//       ],});
//     };


//     function show() {
//       // Enable the event listeners
//       console.log('source', source)
//       console.log('tartet', target)
//       console.log('arrow', arrow)
      
//       PopperInitializer()
//       Popper.setOptions((options) => ({
//         ...options,
//         modifiers: [
//           ...options.modifiers,
//           { name: "eventListeners", enabled: true },
//         ],
//       }));

//       // Update its position
//       Popper.update();
//       Popper.forceUpdate();
//       target.style.display = "block";
//     }
//     function hide() {
//       // Disable the event listeners
//       Popper.setOptions((options) => ({
//         ...options,
//         modifiers: [
//           ...options.modifiers,
//           { name: "eventListeners", enabled: false },
//         ],
//       }));

//       target.style.display = "none";
//     }

//     Alpine.bind(el.parentElement, () => ({
//       "u-data"() {
//         return {
//           arrow,
//         };
//       },
//       "u-on:mouseenter"() {
//         show();
//       },
//       "u-on:focus"() {
//         show();
//       },
//       "u-on:mouseleave"() {
//         hide();
//       },
//       "u-on:blur"() {
//         hide();
//       },
//     }));

//     Alpine.bind(el, () => ({
//       "u-data"(){
//         return{
//           arrow: arrow,
//           PopperInitializer: PopperInitializer,
//           name: 'next jawad'
//         }
//       },
//       async "u-init"() {
//         PopperInitializer()
       
//       },
//     }));
//   });
//   Alpine.directive("tooltip-arrow", (el, {}, { Alpine }) => {
    
//         Alpine.bind(el, () => ({
//           "u-init"() {
//             console.log('arrow init', el)
//             this.arrow = el
//             this.PopperInitializer()
//           },
//         }));
//       });
// }















// export function Tooltip(Alpine) {
//   Alpine.directive("tooltip", (el, {}, { Alpine , evaluate }) => {
//     console.log("tooltip registerd");
    
//     Alpine.bind(el.parentElement, () => ({
//       "u-data"() {
//         return {
//           source: el.parentElement,
//           target: el,
//           Popper: null,
//           arrow: null,
//           async PopperInitializer() {
//             if (this.Popper) this.Popper.destroy();
//             this.Popper = createPopper(this.source, this.target, {
//               placement: "left",
            
//               modifiers: [
               
//                 this.arrow
//                   ? {
//                       name: "arrow",
//                       options: {
//                         element: this.arrow,
//                       },
//                     }
//                   : "",
//                 {
//                   name: "computeStyles",
//                   options: {
//                     gpuAcceleration: true, // true by default
//                   },
//                 },
//                 {
//                   name: "computeStyles",
//                   options: {
//                     adaptive: true, // true by default
//                   },
//                 },
//                 {
//                   name: 'offset',
//                   options: {
//                     offset: [0, 8],
//                   },
//                 },
                
//               ],
//             });

//           },

//           show() {
//             // Enable the event listeners
//             this.PopperInitializer()
//             console.log("source", this.source);
//             console.log("tartet", this.target);
//             console.log("arrow", this.arrow);
            
//             this.Popper.setOptions((options) => ({
//               ...options,
//               modifiers: [
//                 ...options.modifiers,
//                 { name: "eventListeners", enabled: true },
//               ],
//             }));

//             // Update its position
//             this.Popper.update();
//             this.Popper.forceUpdate();
//             this.target.style.display = "block";
//           },
//           hide() {
//             // Disable the event listeners
//             this.Popper.setOptions((options) => ({
//               ...options,
//               modifiers: [
//                 ...options.modifiers,
//                 { name: "eventListeners", enabled: false },
//               ],
//             }));

//             this.target.style.display = "none";
//           },
//         };
//       },
//       "u-on:mouseenter"() {
//         this.show();
//       },
//       "u-on:focus"() {
//         this.show();
//       },
//       "u-on:mouseleave"() {
//         this.hide();
//       },
//       "u-on:blur"() {
//         this.hide();
//       },
//       "u-init"(){
//         console.log("parent init")
//       }
//     }));

//     Alpine.bind(el, () => ({
//       "u-data"(){
//         return{
//         }
//       },
//       async "u-init"() {
//         console.log('target init')
//         this.target = el
//         this.PopperInitializer()
//       },
//     }));
//   });

//   Alpine.directive("tooltip-arrow", (el, {}, { Alpine }) => {
    
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         console.log('arrow init')
//         this.arrow = el
//         this.PopperInitializer()
//       },
//     }));
//   });
// }












// export function Tooltip(Alpine) {
//   Alpine.directive("tooltip", (el, {}, { Alpine }) => {
//     console.log("tooltip registerd");
//     Alpine.bind(el, () => ({
//       "u-data"() {
//         return {
//           source: null,
//           target: null,
//           Popper: null,
//           arrow: null,
//           PopperInitializer: null,
//           show() {

//             // Enable the event listeners
//             this.Popper.setOptions((options) => ({
//               ...options,
//               modifiers: [
//                 ...options.modifiers,
//                 { name: "eventListeners", enabled: true },
//               ],
//             }));

//             // Update its position
//             this.Popper.update();
//             this.Popper.forceUpdate();
//             this.target.style.display = "block";
//           },
//           hide() {
//             // Disable the event listeners
//             this.Popper.setOptions((options) => ({
//               ...options,
//               modifiers: [
//                 ...options.modifiers,
//                 { name: "eventListeners", enabled: false },
//               ],
//             }));

//             this.target.style.display = "none";
//           },
//         };
//       },
//       async "u-init"() {
//         this.PopperInitializer =async function () {
//           if (this.Popper) this.Popper.destroy();
//           this.Popper = createPopper(this.source, this.target, {
//             placement: "top",
//             strategy: "fixed",
//             modifiers: [
//               this.arrow
//                 ? 
//                 {
//                     name: "arrow",
//                     options: {
//                       element: this.arrow,
//                     },
//                   }
//                 : "",
//                 {
//                   name: 'computeStyles',
//                   options: {
//                     gpuAcceleration: true, // true by default
//                   },
//                 },
//                 {
//                   name: 'computeStyles',
//                   options: {
//                     adaptive: true, // true by default
//                   },
//                 },
//                 {
//                   name: 'computeStyles',
//                   options: {
//                     roundOffsets: ({ x, y }) => ({
//                       x: Math.round(x + 2),
//                       y: Math.round(y + 2),
//                     }),
//                   },
//                 },
//             ],
//           });

//           const state = await this.Popper.setOptions({modifiers: [
//               {
//                 name: 'offset',
//                 options: {
//                   offset: [0, 8],
//                 },
//                 }
//           ],});
//         };
//       },
//     }));
//   });
//   Alpine.directive("tooltip-source", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.source = el;
//         this.PopperInitializer()
//       },
//       "u-on:mouseenter"() {
//         this.show();
//       },
//       "u-on:focus"() {
//         this.show();
//       },
//       "u-on:mouseleave"() {
//         this.hide();
//       },
//       "u-on:blur"() {
//         this.hide();
//       },
//     }));
//   });

//   Alpine.directive("tooltip-content", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.target = el
//         this.PopperInitializer()
//       },
//     }));
//   });

//   Alpine.directive("tooltip-arrow", (el, {}, { Alpine }) => {
    
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.arrow = el
//         this.PopperInitializer()
//       },
//     }));
//   });
  
// }


//tooltip using floatinf-ui
export function Tooltip(Alpine) {
  Alpine.directive("tooltip", (el, {}, { Alpine }) => {
    el.parentNode.setAttribute("u-tooltip-reference", "")
    Alpine.bind(el.parentNode, () => ({
      "u-data"() {
        return {
          source: null,
          target: null,
          arrow: null,
          cleanUp: null,
          offset: 0,
          placement: 'bottom',
          margin: 4,
          arrowMargin: 4,
          trigger: 'hover',
          updatePosition(source, target, arrowEl){
            computePosition(source, target, {
              placement: this.placement,
              middleware: [
                offset(this.offset),
                flip(),
                shift({padding: this.margin}),
                arrowEl? arrow({element: arrowEl, padding: this.arrowMargin}): '',
              ],
            }).then(({x, y, placement, middlewareData}) => {
              Object.assign(target.style, {
                left: `${x}px`,
                top: `${y}px`,
              });

              // Accessing the data
              if(!arrowEl)return
              const {x: arrowX, y: arrowY} = middlewareData.arrow;
             
              const staticSide = {
                top: 'bottom',
                right: 'left',
                bottom: 'top',
                left: 'right',
              }[placement.split('-')[0]];
             
              Object.assign(arrowEl.style, {
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                right: '',
                bottom: '',
                [staticSide]: '-4px',
              });
            })
          },
          show() {
            this.target.style.display = 'block'
            this.cleanUp = autoUpdate(this.source, this.target, ()=>{
              this.updatePosition(this.source, this.target, this.arrow)
            })
          },
          hide() {
            this.target.style.display = 'none'
            this.cleanUp()
          },
          toggle() {
            if (this.target.style.display == '' ||this.target.style.display == 'none'){
              this.show()
            }else{
              this.hide()
              
            }
          },
        };
      },
      "u-init"(){
        this.source = el.parentNode
      },
      
      
    }));
    Alpine.bind(el, () => ({
      "u-init"() {
        this.target = el;
        
      },
    }));
    
  });
  
  Alpine.directive("tooltip-arrow", (el, {}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.arrow = el;
        this.offset = 6
      },
    }));
  });
  Alpine.directive("tooltip-offset", (el, {expression}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.offset = expression
      },
    }));
  });
  Alpine.directive("tooltip-placement", (el, {expression}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.placement = expression
      },
    }));
  });
  Alpine.directive("tooltip-margin", (el, {expression}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.margin = expression
      },
    }));
  });
  Alpine.directive("tooltip-arrow-margin", (el, {expression}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.arrowMargin = expression
      },
    }));
  });
  Alpine.directive("tooltip-trigger", (el, {expression}, { Alpine }) => {
    Alpine.bind(el, () => ({
      "u-init"() {
        this.trigger = expression
        if(this.trigger == 'click'){
          Alpine.bind(this.source, () => ({
            "u-on:focus"() {
              this.show();
            },
            "u-on:blur"() {
              this.hide();
            },
            "u-on:click"(){
              // this.toggle();
            }
            
          }));
        }else{
          Alpine.bind(this.source, () => ({
            "u-on:mouseenter"() {
              this.show();
            },
            "u-on:mouseleave"() {
              this.hide();
            },
          }));
        }
      },
    }));
  });
}















// //tooltip using floatinf-ui
// export function Tooltip(Alpine) {
//   Alpine.directive("tooltip", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-data"() {
//         return {
//           source: null,
//           target: null,
//           arrow: null,
//           cleanUp: null,
//           string: 'hellow world',
//           updatePosition(source, target, arrowEl){
//             computePosition(source, target, {
//               placement: 'top',
//               middleware: [
//                 offset(6),
//                 flip(),
//                 shift({padding: 5}),
//                 arrowEl? arrow({element: arrowEl}): '',
//               ],
//             }).then(({x, y, placement, middlewareData}) => {
//               Object.assign(target.style, {
//                 left: `${x}px`,
//                 top: `${y}px`,
//               });

//               // Accessing the data
//               const {x: arrowX, y: arrowY} = middlewareData.arrow;
             
//               const staticSide = {
//                 top: 'bottom',
//                 right: 'left',
//                 bottom: 'top',
//                 left: 'right',
//               }[placement.split('-')[0]];
             
//               Object.assign(arrowEl.style, {
//                 left: arrowX != null ? `${arrowX}px` : '',
//                 top: arrowY != null ? `${arrowY}px` : '',
//                 right: '',
//                 bottom: '',
//                 [staticSide]: '-4px',
//               });
//             })
//           },
//           show() {
//             this.target.style.display = 'block'
//             this.cleanUp = autoUpdate(this.source, this.target, ()=>{
//               console.log('this', this.string)
//               this.updatePosition(this.source, this.target, this.arrow)
//             })
//           },
//           hide() {
//             this.target.style.display = 'none'
//             this.cleanUp()
//           },
//         };
//       },
//       "u-init"(){

//       }
//     }));
//   });
//   Alpine.directive("tooltip-source", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//         "u-init"(){
//           this.source = el
//         },
//         "u-on:mouseenter"(){
//             this.show()
//         },
//         "u-on:focus"(){
//             this.show()
//         },
//         "u-on:mouseleave"(){
//             this.hide()
//         },
//         "u-on:blur"(){
//             this.hide()
//         },
//     }))
//   });
//   Alpine.directive("tooltip-content", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.target = el;
//       },
//     }));
//   });
//   Alpine.directive("tooltip-arrow", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.arrow = el;
//       },
//     }));
//   });
// }





//tooltip using tippy
// export function Tooltip(Alpine) {
//   Alpine.directive("tooltip", (el, {}, { Alpine }) => {
//     console.log("tooltip registerd");
//     Alpine.bind(el, () => ({
//       "u-data"() {
//         return {
//           source: null,
//           target: null,
//         };
//       },
//       "u-init"(){
//       }
//     }));
//   });
//   Alpine.directive("tooltip-source", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//         "u-init"(){
//           this.source = el
//         },
//     }))
//   });
//   Alpine.directive("tooltip-content", (el, {}, { Alpine }) => {
//     Alpine.bind(el, () => ({
//       "u-init"() {
//         this.target = el;
//           tippy(this.source,{
//             content: this.target.innerHTML,
//             placement: "top",
//             delay: 50, // ms
//             allowHTML:true,
//             trigger: 'click',
//             interactive: true,
//             theme: 'tomato'
//           })
//       },
//     }));
//   });
  
  
// }
