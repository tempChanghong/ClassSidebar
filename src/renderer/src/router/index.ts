import { createRouter, createWebHashHistory } from 'vue-router'
import SidebarView from '../views/SidebarView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'sidebar',
      component: SidebarView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
})

export default router
