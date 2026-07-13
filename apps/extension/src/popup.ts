import { toNewLatin } from './convert'

const input = document.getElementById('in') as HTMLTextAreaElement
const output = document.getElementById('out') as HTMLTextAreaElement
const copyBtn = document.getElementById('copy') as HTMLButtonElement

function render(): void {
  output.value = toNewLatin(input.value)
}

input.addEventListener('input', render)

copyBtn.addEventListener('click', () => {
  void navigator.clipboard.writeText(output.value).then(() => {
    copyBtn.textContent = 'Copied'
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1200)
  })
})
