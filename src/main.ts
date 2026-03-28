import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import routes from './router/routes'

// Styles
import './styles/main.css'

// Ant Design Vue - import only what we need for better bundle size
import {
  Button,
  Card,
  Steps,
  Form,
  Input,
  Select,
  Checkbox,
  Radio,
  Slider,
  Progress,
  Tag,
  Badge,
  Alert,
  Modal,
  Drawer,
  Dropdown,
  Menu,
  Tooltip,
  Spin,
  Skeleton,
  message,
  notification,
} from 'ant-design-vue'

export const createApp = ViteSSG(
  App,
  // Vue Router options
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }
      if (to.hash) {
        return { el: to.hash, behavior: 'smooth' }
      }
      return { top: 0, behavior: 'smooth' }
    },
  },
  // Custom setup function
  ({ app, isClient }) => {
    // Pinia store
    app.use(createPinia())

    // Ant Design components
    app.use(Button)
    app.use(Card)
    app.use(Steps)
    app.use(Form)
    app.use(Input)
    app.use(Select)
    app.use(Checkbox)
    app.use(Radio)
    app.use(Slider)
    app.use(Progress)
    app.use(Tag)
    app.use(Badge)
    app.use(Alert)
    app.use(Modal)
    app.use(Drawer)
    app.use(Dropdown)
    app.use(Menu)
    app.use(Tooltip)
    app.use(Spin)
    app.use(Skeleton)

    // Client-only: message/notification use DOM
    if (isClient) {
      app.config.globalProperties.$message = message
      app.config.globalProperties.$notification = notification
    }
  },
)
