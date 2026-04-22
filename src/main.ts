import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import './styles/auth-theme.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'v-calendar/style.css'
import './styles/vcalendar-theme.css'
import VCalendar from 'v-calendar'

const app = createApp(App)

app.use(router)
app.use(MotionPlugin)
app.use(VCalendar, {})

app.mount('#app')
