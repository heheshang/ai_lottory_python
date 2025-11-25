import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores'
import { useEthicalStore } from '../stores'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue'),
    meta: {
      title: 'Lottery Prediction',
      requiresAuth: false,
      showInMenu: true
    }
  },
  {
    path: '/historical-data',
    name: 'HistoricalData',
    component: () => import('../pages/HistoricalData.vue'),
    meta: {
      title: 'Historical Data Analysis',
      requiresAuth: false,
      showInMenu: true
    }
  },
  {
    path: '/predictions',
    name: 'Predictions',
    component: () => import('../pages/Predictions.vue'),
    meta: {
      title: 'Prediction Generator',
      requiresAuth: true,
      showInMenu: true,
      disclaimers: ['responsible_gambling', 'randomness', 'no_financial_advice']
    }
  },
  {
    path: '/predictions/one-click',
    name: 'OneClickPrediction',
    component: () => import('../pages/Predictions.vue'),
    meta: {
      title: 'Quick Prediction',
      requiresAuth: true,
      showInMenu: false,
      disclaimers: ['responsible_gambling', 'randomness', 'no_financial_advice']
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../pages/Profile.vue'),
    meta: {
      title: 'User Profile',
      requiresAuth: true,
      showInMenu: true
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../pages/Analytics.vue'),
    meta: {
      title: 'Statistical Analytics',
      requiresAuth: true,
      showInMenu: true
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/About.vue'),
    meta: {
      title: 'About & Ethics',
      requiresAuth: false,
      showInMenu: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/auth/Login.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false,
      showInMenu: false,
      hideFromAuth: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/auth/Register.vue'),
    meta: {
      title: 'Register',
      requiresAuth: false,
      showInMenu: false,
      hideFromAuth: true
    }
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import('../pages/auth/Logout.vue'),
    meta: {
      title: 'Logout',
      requiresAuth: true,
      showInMenu: false,
      hideFromAuth: true
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../pages/errors/404.vue'),
    meta: {
      title: 'Page Not Found',
      requiresAuth: false,
      showInMenu: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/errors/404.vue'),
    meta: {
      title: 'Page Not Found',
      requiresAuth: false,
      showInMenu: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { selector: to.hash }
    } else if (to.meta.scrollToTop) {
      return { top: 0 }
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const ethicalStore = useEthicalStore()

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Lottery Prediction`
  }

  // Check if authentication is required and user is authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Store intended route for redirect after login
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Hide from authenticated users
  if (to.meta.hideFromAuth && authStore.isAuthenticated) {
    next('/')
    return
  }

  // Check ethical compliance for protected routes
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // Check if user is self-excluded
    if (ethicalStore.isSelfExcluded) {
      next('/profile')
      return
    }

    // Check if responsible gambling acknowledgment is needed
    if (to.meta.disclaimers && ethicalStore.needsDisclaimerAcknowledgment) {
      next({
        path: '/disclaimer',
        query: {
          required: to.meta.disclaimers.join(','),
          redirect: to.fullPath
        }
      })
      return
    }
  }

  next()
})

router.afterEach((to, from) => {
  // Hide loading indicator
  if (window.app && window.app.config.globalProperties.$appStore) {
    window.app.config.globalProperties.$appStore.setGlobalLoading(false)
  }
})

export default router