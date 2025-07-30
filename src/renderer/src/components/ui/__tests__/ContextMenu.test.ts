import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ContextMenu from '../ContextMenu.vue'
import type { ContextMenuItem } from '@renderer/src/types'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Edit: { template: '<div data-testid="edit-icon" />' },
  Trash2: { template: '<div data-testid="trash-icon" />' },
  Download: { template: '<div data-testid="download-icon" />' },
  Copy: { template: '<div data-testid="copy-icon" />' },
  ChevronRight: { template: '<div data-testid="chevron-right-icon" />' },
  MoreHorizontal: { template: '<div data-testid="more-icon" />' }
}))

const mockMenuItems: ContextMenuItem[] = [
  {
    id: 'rename',
    label: 'Rename',
    icon: 'edit',
    action: vi.fn(),
    shortcut: 'F2'
  },
  {
    id: 'copy',
    label: 'Copy',
    icon: 'copy',
    action: vi.fn(),
    shortcut: 'cmd+c'
  },
  {
    id: 'separator1',
    label: '',
    separator: true
  },
  {
    id: 'download',
    label: 'Download',
    icon: 'download',
    action: vi.fn()
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    action: vi.fn(),
    shortcut: 'delete'
  }
]

describe('ContextMenu', () => {
  const defaultProps = {
    x: 100,
    y: 200,
    items: mockMenuItems,
    visible: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  })

  describe('Rendering', () => {
    it('renders menu when visible', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.find('.context-menu').exists()).toBe(true)
      expect(wrapper.findAll('.context-menu-item')).toHaveLength(4) // Excluding separator
    })

    it('does not render when not visible', () => {
      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          visible: false
        }
      })

      expect(wrapper.find('.context-menu').exists()).toBe(false)
    })

    it('renders menu items correctly', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.text()).toContain('Rename')
      expect(wrapper.text()).toContain('Copy')
      expect(wrapper.text()).toContain('Download')
      expect(wrapper.text()).toContain('Delete')
    })

    it('renders icons for menu items', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="edit-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="copy-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="download-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="trash-icon"]').exists()).toBe(true)
    })

    it('renders separators', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.findAll('.my-1.h-px.bg-border')).toHaveLength(1)
    })

    it('renders keyboard shortcuts', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.text()).toContain('F2')
      expect(wrapper.text()).toContain('⌘C')
      expect(wrapper.text()).toContain('DELETE')
    })

    it('applies destructive styling to delete items', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const deleteItem = wrapper.find('[data-item-id="delete"]')
      expect(deleteItem.classes()).toContain('text-destructive')
    })
  })

  describe('Positioning', () => {
    it('positions menu at specified coordinates', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const menu = wrapper.find('.context-menu')
      expect(menu.element.style.left).toBe('100px')
      expect(menu.element.style.top).toBe('200px')
    })

    it('adjusts position when menu would overflow viewport horizontally', async () => {
      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          x: 900 // Close to right edge
        }
      })

      await nextTick()

      // Mock getBoundingClientRect to simulate menu size
      const menu = wrapper.find('.context-menu')
      vi.spyOn(menu.element, 'getBoundingClientRect').mockReturnValue({
        width: 200,
        height: 150,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })

      // Trigger position adjustment
      wrapper.vm.positionMenu()
      await nextTick()

      // Should be adjusted to fit within viewport
      expect(parseInt(menu.element.style.left)).toBeLessThan(900)
    })

    it('adjusts position when menu would overflow viewport vertically', async () => {
      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          y: 700 // Close to bottom edge
        }
      })

      await nextTick()

      const menu = wrapper.find('.context-menu')
      vi.spyOn(menu.element, 'getBoundingClientRect').mockReturnValue({
        width: 200,
        height: 150,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })

      wrapper.vm.positionMenu()
      await nextTick()

      expect(parseInt(menu.element.style.top)).toBeLessThan(700)
    })

    it('ensures minimum distance from viewport edges', async () => {
      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          x: 0,
          y: 0
        }
      })

      await nextTick()

      const menu = wrapper.find('.context-menu')
      wrapper.vm.positionMenu()
      await nextTick()

      expect(parseInt(menu.element.style.left)).toBeGreaterThanOrEqual(8)
      expect(parseInt(menu.element.style.top)).toBeGreaterThanOrEqual(8)
    })
  })

  describe('Interactions', () => {
    it('calls action when menu item is clicked', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const renameItem = wrapper.find('[data-item-id="rename"]')
      await renameItem.trigger('click')

      expect(wrapper.emitted('action')).toHaveLength(1)
      expect(mockMenuItems[0].action).toHaveBeenCalled()
    })

    it('does not call action for disabled items', async () => {
      const disabledItems: ContextMenuItem[] = [{
        id: 'disabled',
        label: 'Disabled Item',
        icon: 'edit',
        action: vi.fn(),
        disabled: true
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: disabledItems
        }
      })

      const disabledItem = wrapper.find('.context-menu-item')
      await disabledItem.trigger('click')

      expect(wrapper.emitted('action')).toBeUndefined()
      expect(disabledItems[0].action).not.toHaveBeenCalled()
    })

    it('does not call action for items without action function', async () => {
      const itemsWithoutAction: ContextMenuItem[] = [{
        id: 'no-action',
        label: 'No Action Item',
        icon: 'edit'
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithoutAction
        }
      })

      const item = wrapper.find('.context-menu-item')
      await item.trigger('click')

      expect(wrapper.emitted('action')).toBeUndefined()
    })

    it('closes menu when overlay is clicked', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const overlay = wrapper.find('.context-menu-overlay')
      await overlay.trigger('click')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('closes menu on right click outside', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const overlay = wrapper.find('.context-menu-overlay')
      await overlay.trigger('contextmenu')

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not close menu when clicking on menu itself', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const menu = wrapper.find('.context-menu')
      await menu.trigger('click')

      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it('stops event propagation when clicking menu items', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const item = wrapper.find('.context-menu-item')
      const event = { stopPropagation: vi.fn() }
      
      await item.trigger('click', event)

      // Event propagation should be stopped by @click.stop
      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('Keyboard Navigation', () => {
    it('closes menu on Escape key', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await nextTick()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not close on other keys', async () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      document.dispatchEvent(event)

      await nextTick()
      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('Shortcut Formatting', () => {
    it('formats Mac shortcuts correctly', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const formattedShortcut = wrapper.vm.formatShortcut('cmd+c')
      expect(formattedShortcut).toBe('⌘C')
    })

    it('formats Windows shortcuts correctly', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const formattedShortcut = wrapper.vm.formatShortcut('ctrl+c')
      expect(formattedShortcut).toBe('Ctrl+C')
    })

    it('formats complex shortcuts correctly', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const formattedShortcut = wrapper.vm.formatShortcut('cmd+shift+z')
      expect(formattedShortcut).toBe('⌘SHIFT+Z')
    })
  })

  describe('Icon Handling', () => {
    it('renders correct icon components', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="edit-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="trash-icon"]').exists()).toBe(true)
    })

    it('falls back to default icon for unknown icon names', () => {
      const itemsWithUnknownIcon: ContextMenuItem[] = [{
        id: 'unknown',
        label: 'Unknown Icon',
        icon: 'unknown-icon' as any,
        action: vi.fn()
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithUnknownIcon
        }
      })

      expect(wrapper.find('[data-testid="more-icon"]').exists()).toBe(true)
    })

    it('handles items without icons', () => {
      const itemsWithoutIcon: ContextMenuItem[] = [{
        id: 'no-icon',
        label: 'No Icon Item',
        action: vi.fn()
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithoutIcon
        }
      })

      expect(wrapper.find('.context-menu-item').exists()).toBe(true)
      expect(wrapper.text()).toContain('No Icon Item')
    })
  })

  describe('Submenu Support', () => {
    it('shows submenu indicator for items with submenu', () => {
      const itemsWithSubmenu: ContextMenuItem[] = [{
        id: 'with-submenu',
        label: 'With Submenu',
        icon: 'edit',
        action: vi.fn(),
        submenu: [{
          id: 'sub1',
          label: 'Submenu Item',
          action: vi.fn()
        }]
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithSubmenu
        }
      })

      expect(wrapper.find('[data-testid="chevron-right-icon"]').exists()).toBe(true)
    })

    it('does not show submenu indicator for items without submenu', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const itemsWithoutSubmenu = wrapper.findAll('.context-menu-item')
      const chevronIcons = wrapper.findAll('[data-testid="chevron-right-icon"]')
      
      expect(chevronIcons).toHaveLength(0)
    })
  })

  describe('Styling and Animation', () => {
    it('applies appear animation', () => {
      const wrapper = mount(ContextMenu, {
        props: defaultProps
      })

      const menu = wrapper.find('.context-menu')
      expect(menu.classes()).toContain('context-menu')
      
      // Animation should be applied via CSS
      const styles = getComputedStyle(menu.element)
      expect(styles.animation).toContain('contextMenuAppear')
    })

    it('applies disabled styling to disabled items', () => {
      const disabledItems: ContextMenuItem[] = [{
        id: 'disabled',
        label: 'Disabled Item',
        icon: 'edit',
        action: vi.fn(),
        disabled: true
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: disabledItems
        }
      })

      const disabledItem = wrapper.find('.context-menu-item')
      expect(disabledItem.classes()).toContain('text-muted-foreground')
      expect(disabledItem.classes()).toContain('cursor-not-allowed')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: []
        }
      })

      expect(wrapper.find('.context-menu').exists()).toBe(true)
      expect(wrapper.findAll('.context-menu-item')).toHaveLength(0)
    })

    it('handles items with empty labels', () => {
      const itemsWithEmptyLabel: ContextMenuItem[] = [{
        id: 'empty-label',
        label: '',
        icon: 'edit',
        action: vi.fn()
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithEmptyLabel
        }
      })

      expect(wrapper.find('.context-menu-item').exists()).toBe(true)
    })

    it('handles very long menu items', () => {
      const itemsWithLongLabel: ContextMenuItem[] = [{
        id: 'long-label',
        label: 'This is a very long menu item label that should be handled gracefully',
        icon: 'edit',
        action: vi.fn()
      }]

      const wrapper = mount(ContextMenu, {
        props: {
          ...defaultProps,
          items: itemsWithLongLabel
        }
      })

      const menu = wrapper.find('.context-menu')
      expect(menu.classes()).toContain('min-w-[160px]')
    })
  })
})