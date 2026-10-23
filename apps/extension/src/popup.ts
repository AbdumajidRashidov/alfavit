import { toNewLatin } from './convert'
import { preferredMessages } from './i18n'

const input = document.getElementById('in') as HTMLTextAreaElement
const output = document.getElementById('out') as HTMLTextAreaElement
const copyBtn = document.getElementById('copy') as HTMLButtonElement
const getMessage = await preferredMessages()
const copyLabel = getMessage('popupCopy')

input.placeholder = getMessage('popupInputPlaceholder')
output.placeholder = getMessage('popupOutputPlaceholder')
copyBtn.textContent = copyLabel

function render(): void {
  output.value = toNewLatin(input.value)
}

input.addEventListener('input', render)

copyBtn.addEventListener('click', () => {
  void navigator.clipboard.writeText(output.value).then(() => {
    copyBtn.textContent = getMessage('popupCopied')
    setTimeout(() => (copyBtn.textContent = copyLabel), 1200)
  })
})
