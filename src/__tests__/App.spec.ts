import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/rack', name: 'rack', component: { template: '<div>Rack</div>' } },
    { path: '/consumption', name: 'consumption', component: { template: '<div>Consumption</div>' } },
    { path: '/stats', name: 'stats', component: { template: '<div>Stats</div>' } },
    { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } },
  ],
})

describe('App', () => {
  it('mounts and renders layout components', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.app').exists()).toBe(true)
    expect(wrapper.find('.app-header').exists()).toBe(true)
    expect(wrapper.find('.main-content').exists()).toBe(true)
    expect(wrapper.find('.app-nav').exists()).toBe(true)
  })

  it('displays correct title based on route', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.app-header').text()).toContain('Buche-Log')
  })
})
