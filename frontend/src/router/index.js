import { createRouter, createWebHistory } from 'vue-router'
import ServerList from '@/views/ServerList.vue'
import ServerEdit from '@/views/ServerEdit.vue'
import OidcAdmin from '@/views/OidcAdmin.vue'
import UserAdmin from '@/views/UserAdmin.vue'
import RequestList from '@/views/RequestList.vue'
import RequestForm from '@/views/RequestForm.vue'
import RequestAdmin from '@/views/RequestAdmin.vue'
import Setup from '@/views/Setup.vue'

const routes = [
  {
    path: '/',
    name: 'ServerList',
    component: ServerList
  },
  {
    path: '/edit/:uuid',
    name: 'ServerEdit',
    component: ServerEdit,
    props: true
  },
  {
    path: '/create',
    name: 'ServerCreate',
    component: ServerEdit,
    props: { mode: 'create' }
  },
  {
    path: '/oidc',
    name: 'OidcAdmin',
    component: OidcAdmin
  },
  {
    path: '/users',
    name: 'UserAdmin',
    component: UserAdmin
  },
  {
    path: '/requests',
    name: 'RequestList',
    component: RequestList,
    meta: { requiresAuth: true }
  },
  {
    path: '/requests/new',
    name: 'RequestNew',
    component: RequestForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/requests/edit/:id',
    name: 'RequestEdit',
    component: RequestForm,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/requests',
    name: 'RequestAdmin',
    component: RequestAdmin,
    meta: { requiresAuth: true }
  },
  {
    path: '/setup',
    name: 'Setup',
    component: Setup
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
