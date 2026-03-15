import { createRouter, createWebHistory } from 'vue-router'
import ServerList from '@/views/ServerList.vue'
import ServerEdit from '@/views/ServerEdit.vue'
import OidcAdmin from '@/views/OidcAdmin.vue'
import UserAdmin from '@/views/UserAdmin.vue'

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
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
