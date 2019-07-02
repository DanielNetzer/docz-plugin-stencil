import { applyPolyfills, defineCustomElements } from './loader'

applyPolyfills().then(() => {
  defineCustomElements(window)
})

export const Wrapper = ({ children }) => <div>{children}</div>
