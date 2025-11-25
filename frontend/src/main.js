import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useAppStore } from './stores'
import { useEthicalStore } from './stores'

const app = createApp(App)
const pinia = createPinia()

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Initialize stores
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// Initialize app store
const appStore = useAppStore()
const ethicalStore = useEthicalStore()

// Make stores available globally for easy access
app.config.globalProperties.$stores = {
  app: appStore,
  ethical: ethicalStore
}

app.mount('#app')