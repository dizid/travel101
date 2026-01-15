import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

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

const app = createApp(App)

// Pinia store
const pinia = createPinia()
app.use(pinia)

// Router
app.use(router)

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

// Global properties
app.config.globalProperties.$message = message
app.config.globalProperties.$notification = notification

app.mount('#app')
