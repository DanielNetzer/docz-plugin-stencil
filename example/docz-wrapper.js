import { defineCustomElements, applyPolyfills } from './loader'

export default ({ children }) => {
  // Bind the custom elements to the window object
  applyPolyfills().then(() => {
    defineCustomElements()
  })

  {
    children
  }
}
