import type { KeyboardLayoutCopy } from './types'
import type { Locale } from '../seo/config'

// No install-time claim until the owner has measured one, and nothing calls
// the layout official: a test holds both.
const XATTR = 'xattr -d com.apple.quarantine "$HOME/Library/Keyboard Layouts/Ozbek-yangi-alifbo.keylayout"'
const TAR = 'tar -xzf alfavit-xkb.tar.gz -C ~/.config'

export const keyboardLayout: Record<Locale, KeyboardLayoutCopy> = {
  en: {
    title: 'Uzbek new-alphabet keyboard layout for Mac and Linux',
    intro: 'Type ö, ğ, ş, ç and ʼ directly: hold Option on a Mac, or AltGr on Linux, and press the letter you would reach for anyway. Every other key stays exactly where it is.',
    combosHeading: 'The five keys',
    displacedHeading: 'What these combinations typed before on a Mac',
    mac: {
      heading: 'Install on a Mac',
      steps: [
        'Download the layout file below.',
        'Move it to the Keyboard Layouts folder in your Library: in Finder, choose Go → Go to Folder and enter ~/Library/Keyboard Layouts.',
        'Log out and back in.',
        'Open System Settings → Keyboard → Input Sources → Edit, press + and add the layout. Switch to it from the input menu in the menu bar.',
      ],
      lookFor: 'In the list it is called',
      notListed: `Not in the list? Run ${XATTR} in Terminal, then log out and back in.`,
      uninstall: 'To remove it, delete the file from ~/Library/Keyboard Layouts and log out and back in.',
    },
    linux: {
      heading: 'Install on Linux',
      steps: [
        'Download the archive below.',
        `Unpack it into your configuration folder: ${TAR}`,
        'Log out and back in.',
        'In your desktop’s keyboard settings, add “Uzbek (Alfavit, AltGr)”. AltGr is the right-hand Alt key.',
      ],
      x11Note: 'This works on Wayland desktops (GNOME, KDE Plasma, Sway and others). X11 sessions do not read ~/.config/xkb, so there the layout has to be installed system-wide by hand.',
    },
    windows: {
      heading: 'Windows',
      body: 'The Windows layout is in preparation. Until then, the Alfavit app for Windows converts what you type into the new alphabet in any program.',
    },
    privacy: 'The layout is a file, not a program: it runs nothing in the background and sends nothing anywhere. Delete the file and it is gone.',
  },
  uz: {
    // UNVERIFIED (drafted 2026-10-23): needs the owner's native-speaker check.
    title: 'Yangi alifbo klaviaturasi: Mac va Linux uchun joylashuv',
    intro: 'ö, ğ, ş, ç va ʼ ni bevosita yozing: Mac’da Option, Linux’da AltGr tugmasini bosib turib, odatdagi harfni bosing. Qolgan barcha tugmalar joyida qoladi.',
    combosHeading: 'Beshta tugma',
    displacedHeading: 'Bu tugmalar Mac’da avval nimani yozardi',
    mac: {
      heading: 'Mac’ga oʻrnatish',
      steps: [
        'Quyidagi joylashuv faylini yuklab oling.',
        'Uni Library ichidagi Keyboard Layouts jildiga koʻchiring: Finder’da Go → Go to Folder ni tanlab, ~/Library/Keyboard Layouts deb yozing.',
        'Tizimdan chiqib, qayta kiring.',
        'System Settings → Keyboard → Input Sources → Edit ni oching, + tugmasini bosing va joylashuvni qoʻshing. Unga menyu satridagi kiritish menyusidan oʻting.',
      ],
      lookFor: 'Roʻyxatda u shunday nomlanadi:',
      notListed: `Roʻyxatda koʻrinmasa, Terminal’da ${XATTR} buyrugʻini bajaring va tizimdan chiqib, qayta kiring.`,
      uninstall: 'Oʻchirish uchun faylni ~/Library/Keyboard Layouts jildidan oʻchiring va tizimdan chiqib, qayta kiring.',
    },
    linux: {
      heading: 'Linux’ga oʻrnatish',
      steps: [
        'Quyidagi arxivni yuklab oling.',
        `Uni sozlamalar jildiga oching: ${TAR}`,
        'Tizimdan chiqib, qayta kiring.',
        'Ish stolining klaviatura sozlamalarida “Uzbek (Alfavit, AltGr)” ni qoʻshing. AltGr — oʻng tomondagi Alt tugmasi.',
      ],
      x11Note: 'Bu Wayland ish stollarida (GNOME, KDE Plasma, Sway va boshqalar) ishlaydi. X11 seanslari ~/.config/xkb ni oʻqimaydi, u yerda joylashuvni tizimga qoʻlda oʻrnatish kerak.',
    },
    windows: {
      heading: 'Windows',
      body: 'Windows uchun joylashuv tayyorlanmoqda. Ungacha Alfavit’ning Windows ilovasi istalgan dasturda yozganingizni yangi alifboga oʻgiradi.',
    },
    privacy: 'Joylashuv dastur emas, fayl: u fonda hech narsa ishga tushirmaydi va hech qayerga hech narsa yubormaydi. Faylni oʻchirsangiz, u yoʻqoladi.',
  },
  ru: {
    // UNVERIFIED (drafted 2026-10-23): needs the owner's check.
    title: 'Раскладка для нового узбекского алфавита: Mac и Linux',
    intro: 'Набирайте ö, ğ, ş, ç и ʼ напрямую: удерживайте Option на Mac или AltGr в Linux и нажмите привычную букву. Все остальные клавиши остаются на своих местах.',
    combosHeading: 'Пять клавиш',
    displacedHeading: 'Что эти сочетания печатали на Mac раньше',
    mac: {
      heading: 'Установка на Mac',
      steps: [
        'Скачайте файл раскладки ниже.',
        'Переместите его в папку Keyboard Layouts в вашей библиотеке: в Finder выберите Go → Go to Folder и введите ~/Library/Keyboard Layouts.',
        'Выйдите из системы и войдите снова.',
        'Откройте System Settings → Keyboard → Input Sources → Edit, нажмите + и добавьте раскладку. Переключайтесь на неё через меню ввода в строке меню.',
      ],
      lookFor: 'В списке она называется',
      notListed: `Нет в списке? Выполните в Терминале ${XATTR}, затем выйдите из системы и войдите снова.`,
      uninstall: 'Чтобы удалить раскладку, удалите файл из ~/Library/Keyboard Layouts и перезайдите в систему.',
    },
    linux: {
      heading: 'Установка в Linux',
      steps: [
        'Скачайте архив ниже.',
        `Распакуйте его в папку настроек: ${TAR}`,
        'Выйдите из системы и войдите снова.',
        'В настройках клавиатуры добавьте «Uzbek (Alfavit, AltGr)». AltGr — правая клавиша Alt.',
      ],
      x11Note: 'Работает в окружениях Wayland (GNOME, KDE Plasma, Sway и другие). Сеансы X11 не читают ~/.config/xkb — там раскладку нужно установить в систему вручную.',
    },
    windows: {
      heading: 'Windows',
      body: 'Раскладка для Windows готовится. А пока приложение Alfavit для Windows переводит набранный текст на новый алфавит в любой программе.',
    },
    privacy: 'Раскладка — это файл, а не программа: она ничего не запускает в фоне и ничего никуда не отправляет. Удалите файл — и её нет.',
  },
}
