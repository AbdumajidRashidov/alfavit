import type { KeyboardLayoutCopy } from './types'
import type { Locale } from '../seo/config'

// No install-time claim until the owner has measured one, and nothing calls
// the layout official: a test holds both.
// The Mac download is a zip holding the .bundle; the bundle is what carries
// the menu-bar icon. Before 24 Oct 2026 the download was the bare .keylayout.
const ZIP = 'Ozbek-yangi-alifbo.zip'
const BUNDLE = 'Ozbek-yangi-alifbo.bundle'
const OLD_FILE = 'Ozbek-yangi-alifbo.keylayout'
const XATTR = `xattr -r -d com.apple.quarantine "$HOME/Library/Keyboard Layouts/${BUNDLE}"`
const TAR = 'tar -xzf ~/Downloads/alfavit-xkb.tar.gz -C ~/.config'
const RM = 'rm ~/.config/xkb/symbols/uz ~/.config/xkb/rules/evdev.xml ~/.config/xkb/COPYING.xkeyboard-config'

export const keyboardLayout: Record<Locale, KeyboardLayoutCopy> = {
  en: {
    title: 'Uzbek new-alphabet keyboard layout for Mac and Linux',
    intro: 'Type ö, ğ, ş, ç and ʼ directly: hold Option on a Mac, or AltGr on Linux, and press the letter you would reach for anyway. Every other key stays exactly where it is.',
    combosHeading: 'The five keys',
    displacedHeading: 'What these combinations typed before on a Mac',
    mac: {
      heading: 'Install on a Mac',
      steps: [
        `Download the archive below. If your browser does not unpack it, double-click ${ZIP} in your Downloads folder: you get ${BUNDLE}.`,
        `Move ${BUNDLE} to the Keyboard Layouts folder in your Library: in Finder, choose Go → Go to Folder and enter ~/Library/Keyboard Layouts. If an earlier ${OLD_FILE} is there, delete it.`,
        'Log out and back in.',
        'Open System Settings → Keyboard → Input Sources → Edit, press + and add the layout. Switch to it from the input menu in the menu bar.',
      ],
      lookFor: 'In the list it is called',
      notListed: `Not in the list? Run ${XATTR} in Terminal, then log out and back in.`,
      uninstall: `To remove it, delete ${BUNDLE} from ~/Library/Keyboard Layouts and log out and back in.`,
    },
    linux: {
      heading: 'Install on Linux',
      steps: [
        'Download the archive below; it lands in your Downloads folder.',
        `Unpack it into your configuration folder: ${TAR}`,
        'Log out and back in.',
        'In your desktop’s keyboard settings, add “Uzbek (Alfavit, AltGr)”. AltGr is the right-hand Alt key.',
      ],
      x11Note: 'This works on desktops that read ~/.config/xkb, such as GNOME on Wayland. X11 sessions do not read it, so there the layout has to be installed system-wide by hand.',
      caution: 'If you already keep your own layouts in ~/.config/xkb, back up rules/evdev.xml and symbols/uz first: unpacking replaces them.',
      uninstall: `To remove it, delete “Uzbek (Alfavit, AltGr)” in your keyboard settings, run ${RM}, and log out and back in.`,
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
      // UNVERIFIED (drafted 2026-10-24): the first two steps and the uninstall line, rewritten for the .zip and .bundle.
      steps: [
        `Quyidagi arxivni yuklab oling. Brauzer uni oʻzi ochmasa, Downloads jildidagi ${ZIP} faylini ikki marta bosing: ${BUNDLE} paydo boʻladi.`,
        `${BUNDLE} ni Library ichidagi Keyboard Layouts jildiga koʻchiring: Finder’da Go → Go to Folder ni tanlab, ~/Library/Keyboard Layouts deb yozing. U yerda avvalgi ${OLD_FILE} fayli boʻlsa, uni oʻchiring.`,
        'Tizimdan chiqib, qayta kiring.',
        'System Settings → Keyboard → Input Sources → Edit ni oching, + tugmasini bosing va joylashuvni qoʻshing. Unga menyu satridagi kiritish menyusidan oʻting.',
      ],
      lookFor: 'Roʻyxatda u shunday nomlanadi:',
      notListed: `Roʻyxatda koʻrinmasa, Terminal’da ${XATTR} buyrugʻini bajaring va tizimdan chiqib, qayta kiring.`,
      uninstall: `Oʻchirish uchun ${BUNDLE} ni ~/Library/Keyboard Layouts jildidan oʻchiring va tizimdan chiqib, qayta kiring.`,
    },
    linux: {
      heading: 'Linux’ga oʻrnatish',
      steps: [
        'Quyidagi arxivni yuklab oling; u Downloads jildiga tushadi.',
        `Uni sozlamalar jildiga oching: ${TAR}`,
        'Tizimdan chiqib, qayta kiring.',
        'Ish stolining klaviatura sozlamalarida “Uzbek (Alfavit, AltGr)” ni qoʻshing. AltGr — oʻng tomondagi Alt tugmasi.',
      ],
      x11Note: 'Bu ~/.config/xkb ni oʻqiydigan ish stollarida, masalan, Wayland’dagi GNOME’da ishlaydi. X11 seanslari uni oʻqimaydi, u yerda joylashuvni tizimga qoʻlda oʻrnatish kerak.',
      caution: 'Agar ~/.config/xkb da oʻz joylashuvlaringiz boʻlsa, avval rules/evdev.xml va symbols/uz nusxasini saqlab qoʻying: arxivni ochish ularni almashtiradi.',
      uninstall: `Oʻchirish uchun klaviatura sozlamalaridan “Uzbek (Alfavit, AltGr)” ni olib tashlang, ${RM} buyrugʻini bajaring va tizimdan chiqib, qayta kiring.`,
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
      // UNVERIFIED (drafted 2026-10-24): the first two steps and the uninstall line, rewritten for the .zip and .bundle.
      steps: [
        `Скачайте архив ниже. Если браузер не распаковал его сам, дважды щёлкните ${ZIP} в папке Downloads — появится ${BUNDLE}.`,
        `Переместите ${BUNDLE} в папку Keyboard Layouts в вашей библиотеке: в Finder выберите Go → Go to Folder и введите ~/Library/Keyboard Layouts. Если там есть прежний файл ${OLD_FILE}, удалите его.`,
        'Выйдите из системы и войдите снова.',
        'Откройте System Settings → Keyboard → Input Sources → Edit, нажмите + и добавьте раскладку. Переключайтесь на неё через меню ввода в строке меню.',
      ],
      lookFor: 'В списке она называется',
      notListed: `Нет в списке? Выполните в Терминале ${XATTR}, затем выйдите из системы и войдите снова.`,
      uninstall: `Чтобы удалить раскладку, удалите ${BUNDLE} из ~/Library/Keyboard Layouts и перезайдите в систему.`,
    },
    linux: {
      heading: 'Установка в Linux',
      steps: [
        'Скачайте архив ниже — он сохранится в папку Downloads.',
        `Распакуйте его в папку настроек: ${TAR}`,
        'Выйдите из системы и войдите снова.',
        'В настройках клавиатуры добавьте «Uzbek (Alfavit, AltGr)». AltGr — правая клавиша Alt.',
      ],
      x11Note: 'Работает в окружениях, которые читают ~/.config/xkb, например в GNOME на Wayland. Сеансы X11 его не читают — там раскладку нужно установить в систему вручную.',
      caution: 'Если вы уже храните свои раскладки в ~/.config/xkb, сначала сохраните копии rules/evdev.xml и symbols/uz: распаковка их заменит.',
      uninstall: `Чтобы удалить раскладку, уберите «Uzbek (Alfavit, AltGr)» в настройках клавиатуры, выполните ${RM} и перезайдите в систему.`,
    },
    windows: {
      heading: 'Windows',
      body: 'Раскладка для Windows готовится. А пока приложение Alfavit для Windows переводит набранный текст на новый алфавит в любой программе.',
    },
    privacy: 'Раскладка — это файл, а не программа: она ничего не запускает в фоне и ничего никуда не отправляет. Удалите файл — и её нет.',
  },
}
