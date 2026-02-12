import { createRouter, createWebHistory } from 'vue-router'
import ServerList from '@/views/ServerList.vue'
import ServerEdit from '@/views/ServerEdit.vue'

const routes = [
  {
    path: '/',
    name: 'ServerList',
    component: ServerList
  },
  {
    path: '/edit/:id',
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
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
