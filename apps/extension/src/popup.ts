import { toNewLatin } from './convert'

const input = document.getElementById('in') as HTMLTextAreaElement
const output = document.getElementById('out') as HTMLTextAreaElement
const copyBtn = document.getElementById('copy') as HTMLButtonElement
const copyLabel = chrome.i18n.getMessage('popupCopy')

input.placeholder = chrome.i18n.getMessage('popupInputPlaceholder')
output.placeholder = chrome.i18n.getMessage('popupOutputPlaceholder')
copyBtn.textContent = copyLabel

function render(): void {
  output.value = toNewLatin(input.value)
}

input.addEventListener('input', render)

copyBtn.addEventListener('click', () => {
  void navigator.clipboard.writeText(output.value).then(() => {
    copyBtn.textContent = chrome.i18n.getMessage('popupCopied')
    setTimeout(() => (copyBtn.textContent = copyLabel), 1200)
  })
})
