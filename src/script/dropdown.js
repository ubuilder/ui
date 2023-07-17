export function Dropdown(Alpine){
  Alpine.directive('dropdown', (el, {}, {Alpine})=>{
    console.log('dropdown registerd')
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
            console.log('open', this.open)
          },
          close(){
            this.open = false; 
            console.log('close', this.open)
          },
        }  
      },
      "u-id": "['dropdown']",
    }))
  })
  Alpine.directive('dropdown-click', (el, {}, {Alpine})=>{
    console.log('dropdown registerd')
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
    console.log('dropdown hover registered')
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
      "@click.outside"(){
        this.close()
      } ,
      "@hover"() {
        clearTimeout(this.timeout)
      },
      "@hover.outside"(){
        this.timeout = setTimeout(()=>{close()}, 200)
      },
    }));
  })
}
