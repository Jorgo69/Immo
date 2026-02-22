import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'
import MainLayout from '../layouts/MainLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: 'Immo Bénin' } },
        { path: 'auth', name: 'auth', component: () => import('../views/AuthView.vue'), meta: { title: 'Connexion' } },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: 'Tableau de bord', requiresAuth: true },
        },
        {
          path: 'onboarding',
          name: 'onboarding',
          component: () => import('../views/OnboardingView.vue'),
          meta: { title: 'Compléter mon profil', requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { title: 'Mon profil', requiresAuth: true },
        },
        {
          path: 'profile/edit',
          name: 'profile-edit',
          component: () => import('../views/ProfileEditView.vue'),
          meta: { title: 'Éditer le profil', requiresAuth: true },
        },
        {
          path: 'property',
          name: 'property-list',
          component: () => import('../views/PropertyListView.vue'),
          meta: { title: 'Biens disponibles' },
        },
        {
          path: 'reels',
          name: 'reels',
          component: () => import('../views/ReelsView.vue'),
          meta: { title: 'Découvrir' },
        },
        {
          path: 'property/:id',
          name: 'property-detail',
          component: () => import('../views/PropertyDetailView.vue'),
          meta: { title: 'Détail du bien' },
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresRole: ['admin', 'agent', 'landlord'] },
      children: [
        {
          path: '',
          name: 'admin',
          component: () => import('../views/AdminDashboardView.vue'),
          meta: { title: 'Espace pro' },
        },
        {
          path: 'properties',
          name: 'admin-properties',
          component: () => import('../views/admin/AdminPropertiesView.vue'),
          meta: { title: 'Liste des biens' },
        },
        {
          path: 'landlord/properties',
          name: 'landlord-properties',
          component: () => import('../views/landlord/Properties.vue'),
          meta: { title: 'Mes biens', requiresRole: ['landlord', 'agent', 'admin'] },
        },
        {
          path: 'properties/:id',
          name: 'admin-property-detail',
          component: () => import('../views/admin/AdminPropertyDetailView.vue'),
          meta: { title: 'Détail du bien' },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue'),
          meta: { title: 'Utilisateurs' },
        },
        {
          path: 'users/:id',
          name: 'admin-user-detail',
          component: () => import('../views/admin/AdminUserDetailView.vue'),
          meta: { title: 'Détail utilisateur' },
        },
        {
          path: 'rooms',
          name: 'admin-rooms',
          component: () => import('../views/admin/AdminSectionPlaceholder.vue'),
          meta: { title: 'Chambres' },
        },
        {
          path: 'wallets',
          name: 'admin-wallets',
          component: () => import('../views/admin/AdminSectionPlaceholder.vue'),
          meta: { title: 'Portefeuilles' },
        },
        {
          path: 'transactions',
          name: 'admin-transactions',
          component: () => import('../views/admin/AdminSectionPlaceholder.vue'),
          meta: { title: 'Transactions' },
        },
        {
          path: 'profiles',
          name: 'admin-profiles',
          component: () => import('../views/admin/AdminSectionPlaceholder.vue'),
          meta: { title: 'Profils' },
        },
        {
          path: 'location',
          name: 'admin-location',
          component: () => import('../views/admin/AdminLocationView.vue'),
          meta: { title: 'Pays et villes', requiresRole: ['admin'] },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  document.title = (to.meta.title as string) ?? 'Immo Bénin'
  const appStore = useAppStore()
  if (to.meta.requiresAuth && !appStore.token) {
    return { name: 'auth', query: { redirect: to.fullPath } }
  }
  // Profil incomplet : forcer vers onboarding sauf si déjà sur onboarding ou auth
  if (
    appStore.token &&
    appStore.isProfileComplete === false &&
    to.name !== 'onboarding' &&
    to.name !== 'auth'
  ) {
    return { name: 'onboarding', query: to.name !== 'home' ? { redirect: to.fullPath } : {} }
  }
  const requiredRoles = to.meta.requiresRole as string[] | undefined
  if (requiredRoles && appStore.userRole && !requiredRoles.includes(appStore.userRole)) {
    return { name: 'home' }
  }
  return true
})
