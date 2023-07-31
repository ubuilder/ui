export function Dropdown(Alpine){
  Alpine.directive('dropdown', (el, {}, {Alpine})=>{
    Alpine.bind(el, ()=>({
      "u-data"(){
        return{
          open: false, 
          timeout: undefined, 
          toggle(){
            if(this.open){ 
                return this.close()
            } else{ 
                return this.show()
            }
          },
          show(){
            this.open = true; 
          },
          close(){
            this.open = false; 
          },
        }  
      },
      "u-id": "['dropdown']",
    }))
  })
  Alpine.directive('dropdown-click', (el, {}, {Alpine})=>{
    Alpine.bind(el, ()=>({
      "u-on:click"(){
        this.toggle()
      },
      "u-on:click.outside"(){
        this.close()
      }
    }))
  })
  Alpine.directive('dropdown-hover', (el, {}, {Alpine})=>{
    Alpine.bind(el, ()=>({
      "u-on:mouseenter"(){
        clearTimeout(this.timeout);
        this.show()
      },
      "u-on:mouseleave"() {
        this.timeout = setTimeout(()=>{
          this.close()
        },200)
      },
    }))
  })

  
  // Alpine.directive('dropdown-item', (el, {}, {evaluate})=>{
  //   Alpine.bind(el, () => ({
      
  //   }));
  // })

  Alpine.directive('dropdown-panel', (el, {}, {evaluate})=>{
    Alpine.bind(el, () => ({
      "u-show": "open",
      // "u-on:click.outside"(){
      //   this.close()
      // } ,
      // "u-on:mouseenter"() {
      //   clearTimeout(this.timeout)
      // },
      // "u-on:mouseleave"(){
      //   this.timeout = setTimeout(()=>{close()}, 200)
      // },
    }));
  })
}

