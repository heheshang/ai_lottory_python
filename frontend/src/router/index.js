import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../pages/Home.vue')
    },
    {
      path: '/historical-data',
      name: 'HistoricalData',
      component: () => import('../pages/HistoricalData.vue')
    },
    {
      path: '/predictions',
      name: 'Predictions',
      component: () => import('../pages/Predictions.vue')
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../pages/Profile.vue')
    }
  ]
})

export default router