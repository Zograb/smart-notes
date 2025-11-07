import {
  type VirtualElement,
  computePosition,
  autoUpdate,
  offset,
  flip,
  shift,
} from '@floating-ui/dom'
import { type Editor, ReactRenderer, Extension } from '@tiptap/react'
import Suggestion, { type SuggestionProps } from '@tiptap/suggestion'
import {
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  SeparatorHorizontal,
} from 'lucide-react'

import {
  type SlashCommandsListItem,
  SlashCommandsList,
} from '../components/SlashCommandsList'

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() {
    return {
      char: '/',
    }
  },
  addProseMirrorPlugins() {
    const editor = this.editor

    const baseItems = (ed: Editor): SlashCommandsListItem[] => [
      {
        title: 'Heading 1',
        icon: <Heading1 className="size-5" />,
        run: () => ed.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        title: 'Heading 2',
        icon: <Heading2 className="size-5" />,
        run: () => ed.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        title: 'Bullet List',
        icon: <List className="size-5" />,
        run: () => ed.chain().focus().toggleBulletList().run(),
      },
      {
        title: 'Ordered List',
        icon: <ListOrdered className="size-5" />,
        run: () => ed.chain().focus().toggleOrderedList().run(),
      },
      {
        title: 'To-Do List',
        icon: <ListTodo className="size-5" />,
        run: () => ed.chain().focus().toggleTaskList().run(),
      },
      {
        title: 'Blockquote',
        icon: <Quote className="size-5" />,
        run: () => ed.chain().focus().toggleBlockquote().run(),
      },
      {
        title: 'Code Block',
        icon: <Code className="size-5" />,
        run: () => ed.chain().focus().toggleCodeBlock().run(),
      },
      {
        title: 'Divider',
        icon: <SeparatorHorizontal className="size-5" />,
        run: () => ed.chain().focus().setHorizontalRule().run(),
      },
    ]

    const suggestion = Suggestion<SlashCommandsListItem>({
      editor,
      char: this.options.char,
      allowSpaces: true,
      startOfLine: false,
      allow: ({ state, range }) => {
        const $from = state.doc.resolve(range.from)
        return $from.parent.type.name !== 'codeBlock'
      },
      items: ({ query }) =>
        baseItems(editor).filter((i) =>
          i.title.toLowerCase().includes(query.toLowerCase()),
        ),

      render: () => {
        let component: ReactRenderer | null = null
        let popupEl: HTMLElement | null = null
        let stopAutoUpdate: (() => void) | null = null

        const close = () => {
          stopAutoUpdate?.()
          stopAutoUpdate = null
          component?.destroy()
          component = null
          if (popupEl) {
            popupEl.remove()
            popupEl = null
          }
        }

        const getRef = (
          props: SuggestionProps<SlashCommandsListItem>,
        ): VirtualElement => ({
          getBoundingClientRect: props.clientRect as () => DOMRect,
        })

        const mount = (props: SuggestionProps<SlashCommandsListItem>) => {
          const wrappedItems: SlashCommandsListItem[] = baseItems(editor).map(
            (i) => ({
              ...i,
              run: () => {
                editor.chain().focus().deleteRange(props.range).run()
                i.run()
                close()
              },
            }),
          )

          component = new ReactRenderer(SlashCommandsList, {
            editor,
            props: {
              editor,
              query: props.query,
              items: wrappedItems,
              onClose: close,
            },
          })

          popupEl = component.element as HTMLElement
          Object.assign(popupEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: '9999',
          })
          document.body.appendChild(popupEl)

          const reference = getRef(props)

          const updatePos = async () => {
            if (!popupEl) return
            const { x, y } = await computePosition(reference, popupEl, {
              strategy: 'absolute',
              placement: 'bottom-start',
              middleware: [offset(6), flip(), shift({ padding: 8 })],
            })
            popupEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
          }

          stopAutoUpdate = autoUpdate(reference, popupEl, updatePos)
          updatePos()
        }

        return {
          onStart(props) {
            if (!props.clientRect) return
            mount(props)
          },
          onUpdate(props) {
            if (!props.clientRect || !component) return
            const wrappedItems: SlashCommandsListItem[] = baseItems(editor)
              .filter((i) =>
                i.title.toLowerCase().includes(props.query.toLowerCase()),
              )
              .map((i) => ({
                ...i,
                run: () => {
                  editor.chain().focus().deleteRange(props.range).run()
                  i.run()
                },
              }))
            component.updateProps({ query: props.query, items: wrappedItems })
          },
          onKeyDown(props) {
            if (props.event.key === 'Escape') {
              close()
              return true
            }
            return false
          },
          onExit() {
            close()
          },
        }
      },
    })

    return [suggestion]
  },
})
