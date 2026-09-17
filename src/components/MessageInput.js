import { appState } from '../services/state.js';
import { playFabService } from '../services/playfab.js';
import { pollingEngine } from '../services/pollingEngine.js';
import { soundSynth } from '../services/soundEffects.js';

const EMOJI_CATEGORIES = [
  {
    name: "Smileys & Emotion",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "🫠", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "🫤", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"
    ]
  },
  {
    name: "People & Gestures",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷", "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓", "👴", "👵", "👨‍⚕️", "👩‍⚕️", "👨‍🎓", "👩‍🎓", "👨‍🏫", "👩‍🏫", "👨‍⚖️", "👩‍⚖️", "👨‍🌾", "👩‍🌾", "👨‍🍳", "👩‍🍳", "👨‍🔧", "👩‍🔧", "👨‍🏭", "👩‍🏭", "👨‍💼", "👩‍💼", "👨‍🔬", "👩‍🔬", "👨‍💻", "👩‍💻", "👨‍🎤", "👩‍🎤", "👨‍🎨", "👩‍🎨", "👨‍✈️", "👩‍✈️", "👨‍🚀", "👩‍🚀", "👨‍🚒", "👩‍🚒", "👮", "🕵️", "💂", "🥷", "👷", "🤴", "👸", "👳", "👲", "🧕", "🤵", "👰", "🤰", "🫄", "🤱", "👼", "🎅", "🤶", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "🧌"
    ]
  },
  {
    name: "Animals & Nature",
    icon: "🐶",
    emojis: [
      "🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦫", "🦔", "🦇", "🐻", "🐻‍❄️", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦤", "🪶", "🦩", "🦚", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🪸", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🪳", "🕷️", "🕸️", "🦂", "🦟", "🪰", "🪱", "🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🪷", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃"
    ]
  },
  {
    name: "Food & Drink",
    icon: "🍕",
    emojis: [
      "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🥜", "🫘", "🌰", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧋", "🧃", "🧉", "🧊"
    ]
  },
  {
    name: "Activities & Gaming",
    icon: "🎮",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🕹️", "🎰"
    ]
  },
  {
    name: "Travel & Places",
    icon: "🚗",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", "🛟", "⛽", "🚧", "🚦", "🚥", "🗺️", "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺", "🛖", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭"
    ]
  },
  {
    name: "Objects & Tech",
    icon: "💻",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🪫", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪"
    ]
  },
  {
    name: "Symbols & Hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧️", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "🔟", "🔢", "#️⃣", "*️⃣", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "🟰", "♾️", "💲", "💱", "™️", "©️", "®️", "👁️‍🗨️", "🔚", "🔙", "🔛", "🔝", "🔜", "〰️", "➰", "➿", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "⬛", "⬜", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫"
    ]
  },
  {
    name: "Flags",
    icon: "🚩",
    emojis: [
      "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🏁", "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇻", "🇧🇼", "🇧🇾", "🇧🇿", "🇨🇦", "🇨🇨", "🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇵", "🇨🇷", "🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿", "🇩🇪", "🇩🇬", "🇩🇯", "🇩🇰", "🇩🇲", "🇩🇴", "🇩🇿", "🇪🇦", "🇪🇨", "🇪🇪", "🇪🇬", "🇪🇭", "🇪🇷", "🇪🇸", "🇪🇹", "🇪🇺", "🇫🇮", "🇫🇯", "🇫🇰", "🇫🇲", "🇫🇴", "🇫🇷", "🇬🇦", "🇬🇧", "🇬🇩", "🇬🇪", "🇬🇫", "🇬🇬", "🇬🇭", "🇬🇮", "🇬🇱", "🇬🇲", "🇬🇳", "🇬🇵", "🇬🇶", "🇬🇷", "🇬🇸", "🇬🇹", "🇬🇺", "🇬🇼", "🇬🇾", "🇭🇰", "🇭🇲", "🇭🇳", "🇭🇷", "🇭🇹", "🇭🇺", "🇮🇨", "🇮🇩", "🇮🇪", "🇮🇱", "🇮🇲", "🇮🇳", "🇮🇴", "🇮🇶", "🇮🇷", "🇮🇸", "🇮🇹", "🇯🇪", "🇯🇲", "🇯🇴", "🇯🇵", "🇰🇪", "🇰🇬", "🇰🇭", "🇰🇮", "🇰🇲", "🇰🇳", "🇰🇵", "🇰🇷", "🇰🇼", "🇰🇾", "🇰🇿", "🇱🇦", "🇱🇧", "🇱🇨", "🇱🇮", "🇱🇰", "🇱🇷", "🇱🇸", "🇱🇹", "🇱🇺", "🇱🇻", "🇱🇾", "🇲🇦", "🇲🇨", "🇲🇩", "🇲🇪", "🇲🇫", "🇲🇬", "🇲🇭", "🇲🇰", "🇲🇱", "🇲🇲", "🇲🇳", "🇲🇴", "🇲🇵", "🇲🇶", "🇲🇷", "🇲🇸", "🇲🇹", "🇲🇺", "🇲🇻", "🇲🇼", "🇲🇽", "🇲🇾", "🇲🇿", "🇳🇦", "🇳🇨", "🇳🇪", "🇳🇫", "🇳🇬", "🇳🇮", "🇳🇱", "🇳🇴", "🇳🇵", "🇳🇷", "🇳🇺", "🇳🇿", "🇴🇲", "🇵🇦", "🇵🇪", "🇵🇫", "🇵🇬", "🇵🇭", "🇵🇰", "🇵🇱", "🇵🇲", "🇵🇳", "🇵🇷", "🇵🇸", "🇵🇹", "🇵🇼", "🇵🇾", "🇶🇦", "🇷🇪", "🇷🇴", "🇷🇸", "🇷🇺", "🇷🇼", "🇸🇦", "🇸🇧", "🇸🇨", "🇸🇩", "🇸🇪", "🇸🇬", "🇸🇭", "🇸🇮", "🇸🇯", "🇸🇰", "🇸🇱", "🇸🇲", "🇸🇳", "🇸🇴", "🇸🇷", "🇸🇸", "🇸🇹", "🇸🇻", "🇸🇽", "🇸🇾", "🇸🇿", "🇹🇦", "🇹🇨", "🇹🇩", "🇹🇫", "🇹🇬", "🇹🇭", "🇹🇯", "🇹🇰", "🇹🇱", "🇹🇲", "🇹🇳", "🇹🇴", "🇹🇷", "🇹🇹", "🇹🇻", "🇹🇼", "🇹🇿", "🇺🇦", "🇺🇬", "🇺🇲", "🇺🇳", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇦", "🇻🇨", "🇻🇪", "🇻🇬", "🇻🇮", "🇻🇳", "🇻🇺", "🇼🇫", "🇼🇸", "🇽🇰", "🇾🇪", "🇾🇹", "🇿🇦", "🇿🇲", "🇿🇼"
    ]
  }
];

const CURATED_GIFS = [
  { id: "g1", title: "Gaming Cat", tags: ["gaming", "game", "cat"], url: "https://media.tenor.com/ofQTcck4q7AAAAAM/cat-glasses.gif" },
  { id: "g2", title: "Gaming Rig", tags: ["gaming", "game", "pc", "computer"], url: "https://media.tenor.com/1Op1SlDy7hUAAAAM/computer-games.gif" },
  { id: "g3", title: "Gaming Streamer", tags: ["gaming", "game", "hype"], url: "https://media.tenor.com/6afWhPVV8uAAAAAM/gaming-ishotz.gif" },
  { id: "g4", title: "Anime Dance", tags: ["anime", "dance", "happy"], url: "https://media.tenor.com/TxflfpxQNgcAAAAM/happy-dance.gif" },
  { id: "g5", title: "Anime Goku", tags: ["anime", "fight", "goku"], url: "https://media.tenor.com/INKyrUrQW3AAAAAM/anime-goku.gif" },
  { id: "g6", title: "Bocchi Anime", tags: ["anime", "cute", "bocchi"], url: "https://media.tenor.com/d-lz7Nu6X2oAAAAM/bocchi-the-rock-bocchi.gif" },
  { id: "g7", title: "Anime Eva Dance", tags: ["anime", "dance", "vibe"], url: "https://media.tenor.com/YwP5km8TjY8AAAAM/anime-dance-neon-genesis-evangelion.gif" },
  { id: "g8", title: "Cat Dance", tags: ["cats", "cat", "dance", "cute"], url: "https://media.tenor.com/aGj-frNYMFEAAAAM/cat-cat-dance.gif" },
  { id: "g9", title: "Swag Cat", tags: ["cats", "cat", "swag", "cool"], url: "https://media.tenor.com/cRTQk6N_FxMAAAAM/swag-cat-swagbilli-cutecat-cats-cat-swag-ok-yooo-yo.gif" },
  { id: "g10", title: "Water Cat", tags: ["cats", "cat", "cute"], url: "https://media.tenor.com/OPG42VTMUrYAAAAM/water-cat.gif" },
  { id: "g11", title: "Cat Pringle", tags: ["cats", "cat", "funny"], url: "https://media.tenor.com/2S4TvwVcj9AAAAAM/cat-pringle-cat.gif" },
  { id: "g12", title: "Side Eye Dog", tags: ["dogs", "dog", "meme", "suspicious"], url: "https://media.tenor.com/OEvKhm_qIQ0AAAAM/side-eye-dog-suspicious.gif" },
  { id: "g13", title: "Angry Dog", tags: ["dogs", "dog", "mad"], url: "https://media.tenor.com/O64aKH8IkAkAAAAM/angry-chihuahua-chi.gif" },
  { id: "g14", title: "Happy Dog", tags: ["dogs", "dog", "smile"], url: "https://media.tenor.com/mAfUU70X_1UAAAAM/dog-smirk-dog-happy.gif" },
  { id: "g15", title: "IShowSpeed Dance", tags: ["memes", "meme", "dance", "speed"], url: "https://media.tenor.com/kLfwF7LJ5-wAAAAM/ishowspeed-dance.gif" },
  { id: "g16", title: "Stare Meme", tags: ["memes", "meme", "stare"], url: "https://media.tenor.com/27UExmylb3sAAAAM/stare-meme-meme.gif" },
  { id: "g17", title: "Plankton Meme", tags: ["memes", "meme", "funny"], url: "https://media.tenor.com/28ZaziH4y1kAAAAM/ugly-plankton-meme-ugly-plankton.gif" },
  { id: "g18", title: "Office Party", tags: ["party", "dance", "office", "celebrate"], url: "https://media.tenor.com/vBicH3Lgb5MAAAAM/the-office-party.gif" },
  { id: "g19", title: "Birthday Party", tags: ["party", "happy", "celebrate"], url: "https://media.tenor.com/lgYzuW5fBvAAAAAM/happy-birthday-bon-anniversaire.gif" },
  { id: "g20", title: "Goodfellas Laugh", tags: ["reactions", "laugh", "funny"], url: "https://media.tenor.com/wE0jylD_O4gAAAAM/goodfellas-laugh-liotta.gif" },
  { id: "g21", title: "Spit Laugh", tags: ["reactions", "laugh", "spit"], url: "https://media.tenor.com/3YX1vx3m6OwAAAAM/laugh-spit.gif" },
  { id: "g22", title: "Popcorn Eating", tags: ["reactions", "popcorn", "drama"], url: "https://media.tenor.com/D9qDYwwlJC0AAAAM/pop-corn.gif" },
  { id: "g23", title: "Popcorn Guy", tags: ["reactions", "popcorn", "chill"], url: "https://media.tenor.com/T7oGpFmn3_YAAAAM/popcorn-guy-relaxing.gif" },
  { id: "g24", title: "Mr Bean Thumbs Up", tags: ["reactions", "thumbs up", "ok", "nice"], url: "https://media.tenor.com/tVy1iyr9AMQAAAAM/mr-bean-thumbs-up.gif" },
  { id: "g25", title: "Cat Thumbs Up", tags: ["reactions", "thumbs up", "cat", "good"], url: "https://media.tenor.com/TsVXIAMBZXoAAAAM/cat-thumbs-up-thumbs-up.gif" },
  { id: "g26", title: "Rickroll", tags: ["memes", "meme", "dance", "rickroll"], url: "https://c.tenor.com/yheo1GGu3FwAAAAC/rick-roll-rick-ashley.gif" }
];

export class MessageInput {
  constructor(container, { onRequireAuth }) {
    this.container = container;
    this.callbacks = { onRequireAuth };
    this.isSending = false;
    this.isEmojiOpen = false;
    this.isGifOpen = false;
    this.activeEmojiCategory = 0;
    this.emojiSearchQuery = '';
    this.activeGifCategory = 'all';
    this.gifSearchQuery = '';
    this.lastSentTime = 0;
    this.render();

    this.unsubscribe = appState.subscribe((state, key) => {
      if (key === 'navigation' || key === 'channel' || key === 'servers' || key === 'profile') {
        this.updatePlaceholder();
      }
      if (key === 'reply') {
        this.updateReplyBar();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="chat-input-wrapper">
        <div id="reply-preview-bar" style="display: none; align-items: center; justify-content: space-between; padding: 6px 14px; background: #1a1a1a; border: 1px solid #2e2e2e; border-bottom: none; border-radius: 6px 6px 0 0; font-size: 12px; color: #cccccc;">
          <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="flex-shrink: 0; color: #888888;">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
            <span id="reply-preview-text" style="font-weight: 500;">Replying...</span>
          </div>
          <button type="button" id="cancel-reply-btn" style="background: none; border: none; color: #888888; cursor: pointer; padding: 2px 4px; display: flex; align-items: center; font-size: 14px;">
            ✕
          </button>
        </div>

        <div class="chat-input-box" id="chat-input-box">
          <textarea
            id="chat-input-textarea"
            class="chat-textarea"
            placeholder="Message... (Enter to send, Shift+Enter for newline)"
            rows="1"
            maxlength="2000"
          ></textarea>

          <input type="file" id="chat-file-input" multiple style="display: none;" />

          <div class="input-actions">
            <button class="icon-btn" id="format-bold-btn" type="button" title="Bold" style="font-size: 11px; font-weight: 800; padding: 4px 6px;">B</button>
            <button class="icon-btn" id="format-italic-btn" type="button" title="Italic" style="font-size: 11px; font-style: italic; padding: 4px 6px;">I</button>
            <button class="icon-btn" id="format-code-btn" type="button" title="Code" style="font-size: 11px; font-family: var(--font-mono); padding: 4px 6px;">&lt;&gt;</button>
            <button class="icon-btn" id="format-spoiler-btn" type="button" title="Spoiler" style="font-size: 11px; font-weight: 800; padding: 4px 6px;">||</button>
            <button class="icon-btn" id="attach-file-btn" type="button" title="Upload File (<10MB)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>

            <button class="icon-btn" id="gif-toggle-btn" type="button" title="GIFs" style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px; padding: 4px 6px; border: 1px solid var(--border-subtle); border-radius: 4px;">
              GIF
            </button>

            <button class="icon-btn" id="emoji-toggle-btn" type="button" title="Emoji">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <circle cx="9" cy="9.5" r="1.2" fill="currentColor"></circle>
                <circle cx="15" cy="9.5" r="1.2" fill="currentColor"></circle>
              </svg>
            </button>

            <button class="send-btn" id="chat-send-btn" type="button" title="Send (Enter)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <div id="upload-status-indicator" style="display: none; align-items: center; gap: 8px; font-size: 12px; color: #ffffff; padding: 6px 10px; background: #1f1f1f; border-radius: 4px; margin-top: 4px; border: 1px solid #333333;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="spin-icon">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span id="upload-status-text">Uploading file...</span>
        </div>

        <div class="emoji-popover" id="emoji-popover" style="display: none;">
          <div style="padding: 6px 8px; border-bottom: 1px solid var(--border-subtle);">
            <input type="text" id="emoji-search-input" placeholder="Search emojis..." style="width: 100%; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); color: var(--text-primary); padding: 4px 8px; font-size: 12px; outline: none;" autocomplete="off" />
          </div>
          <div class="emoji-categories">
            ${EMOJI_CATEGORIES.map((cat, idx) => `
              <button type="button" class="emoji-cat-btn ${idx === 0 ? 'active' : ''}" data-cat-index="${idx}" title="${cat.name}">
                ${cat.icon}
              </button>
            `).join('')}
          </div>
          <div class="emoji-grid" id="emoji-grid"></div>
        </div>

        <div class="gif-popover" id="gif-popover" style="display: none;">
          <div class="gif-popover-header" style="display: flex; gap: 6px; align-items: center; padding: 8px 10px; border-bottom: 1px solid #282828;">
            <input type="text" id="gif-search-input" class="gif-search-input" placeholder="Search GIFs..." autocomplete="off" style="flex: 1;" />
            <button type="button" id="btn-add-custom-gif" class="btn-secondary" style="padding: 6px 10px; font-size: 11px; white-space: nowrap; height: 32px; font-weight: 600; cursor: pointer;" title="Add Custom GIF URL">+ Fav URL</button>
          </div>
          <div class="gif-category-bar">
            <button type="button" class="gif-tag-btn active" data-gif-tag="all">All</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="favs">★ Favs</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="gaming">Gaming</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="anime">Anime</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="cats">Cats</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="dogs">Dogs</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="memes">Memes</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="party">Party</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="reactions">Reactions</button>
          </div>
          <div class="gif-results-grid" id="gif-results-grid"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 4px; padding: 0 4px;">
          <span id="char-counter" style="font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); transition: color 0.15s ease;"></span>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('#chat-input-textarea');
    this.sendBtn = this.container.querySelector('#chat-send-btn');
    this.attachBtn = this.container.querySelector('#attach-file-btn');
    this.fileInput = this.container.querySelector('#chat-file-input');
    this.uploadIndicator = this.container.querySelector('#upload-status-indicator');
    this.uploadStatusText = this.container.querySelector('#upload-status-text');
    this.emojiBtn = this.container.querySelector('#emoji-toggle-btn');
    this.emojiPopover = this.container.querySelector('#emoji-popover');
    this.emojiGrid = this.container.querySelector('#emoji-grid');
    this.emojiSearchInput = this.container.querySelector('#emoji-search-input');
    this.gifBtn = this.container.querySelector('#gif-toggle-btn');
    this.gifPopover = this.container.querySelector('#gif-popover');
    this.gifGrid = this.container.querySelector('#gif-results-grid');
    this.gifSearchInput = this.container.querySelector('#gif-search-input');
    this.addCustomGifBtn = this.container.querySelector('#btn-add-custom-gif');
    this.charCounter = this.container.querySelector('#char-counter');
    this.replyBar = this.container.querySelector('#reply-preview-bar');
    this.replyText = this.container.querySelector('#reply-preview-text');
    this.cancelReplyBtn = this.container.querySelector('#cancel-reply-btn');
    this.formatBoldBtn = this.container.querySelector('#format-bold-btn');
    this.formatItalicBtn = this.container.querySelector('#format-italic-btn');
    this.formatCodeBtn = this.container.querySelector('#format-code-btn');
    this.formatSpoilerBtn = this.container.querySelector('#format-spoiler-btn');

    this.attachEvents();
    this.renderEmojiGrid();
    this.renderGifGrid();
    this.updatePlaceholder();
    this.updateReplyBar();
  }

  getFavoriteGifs() {
    try {
      const stored = localStorage.getItem('pulse_fav_gifs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  saveFavoriteGifs(favs) {
    try {
      localStorage.setItem('pulse_fav_gifs', JSON.stringify(favs));
    } catch {}
  }

  isGifFavorite(url) {
    const favs = this.getFavoriteGifs();
    return favs.some(f => f.url === url);
  }

  toggleFavoriteGif(gif) {
    let favs = this.getFavoriteGifs();
    const existsIndex = favs.findIndex(f => f.url === gif.url);
    if (existsIndex >= 0) {
      favs.splice(existsIndex, 1);
    } else {
      favs.unshift({
        id: gif.id || ('fav_' + Date.now()),
        title: gif.title || 'Favorite GIF',
        tags: gif.tags || ['favs'],
        url: gif.url
      });
    }
    this.saveFavoriteGifs(favs);
    this.renderGifGrid();
  }

  attachEvents() {
    const wrapSelection = (prefix, suffix) => {
      const start = this.textarea.selectionStart || 0;
      const end = this.textarea.selectionEnd || 0;
      const val = this.textarea.value;
      const selected = val.substring(start, end);
      const replacement = `${prefix}${selected || 'text'}${suffix}`;
      this.textarea.value = val.substring(0, start) + replacement + val.substring(end);
      const newStart = start + prefix.length;
      const newEnd = selected ? newStart + selected.length : newStart + 4;
      this.textarea.selectionStart = newStart;
      this.textarea.selectionEnd = newEnd;
      this.textarea.focus();
    };

    this.formatBoldBtn?.addEventListener('click', () => wrapSelection('**', '**'));
    this.formatItalicBtn?.addEventListener('click', () => wrapSelection('*', '*'));
    this.formatCodeBtn?.addEventListener('click', () => wrapSelection('`', '`'));
    this.formatSpoilerBtn?.addEventListener('click', () => wrapSelection('||', '||'));

    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = `${Math.min(this.textarea.scrollHeight, 120)}px`;
      const len = this.textarea.value.length;
      if (this.charCounter) {
        if (len > 1500) {
          this.charCounter.textContent = `${len}/2000`;
          this.charCounter.style.color = len >= 2000 ? '#f43f5e' : (len >= 1800 ? '#f59e0b' : 'var(--text-muted)');
        } else {
          this.charCounter.textContent = '';
        }
      }
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
      if (e.key === 'Escape') {
        if (appState.getState().replyingTo) {
          appState.clearReplyingTo();
        }
      }
    });

    this.sendBtn.addEventListener('click', () => {
      this.handleSend();
    });

    this.textarea.addEventListener('paste', async (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        await this.uploadAndSendFiles(pastedFiles);
      }
    });

    this.attachBtn?.addEventListener('click', () => {
      if (!playFabService.isAuthenticated()) {
        this.callbacks.onRequireAuth();
        return;
      }
      this.fileInput.value = '';
      this.fileInput.click();
    });

    this.fileInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files || files.length === 0) return;
      await this.uploadAndSendFiles(files);
    });

    this.cancelReplyBtn?.addEventListener('click', () => {
      appState.clearReplyingTo();
    });

    this.emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isEmojiOpen = !this.isEmojiOpen;
      this.emojiPopover.style.display = this.isEmojiOpen ? 'flex' : 'none';
      if (this.isEmojiOpen) {
        if (this.isGifOpen) {
          this.isGifOpen = false;
          this.gifPopover.style.display = 'none';
        }
        setTimeout(() => this.emojiSearchInput?.focus(), 50);
      }
    });

    this.emojiSearchInput?.addEventListener('input', (e) => {
      this.emojiSearchQuery = e.target.value.toLowerCase().trim();
      this.renderEmojiGrid();
    });

    this.gifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isGifOpen = !this.isGifOpen;
      this.gifPopover.style.display = this.isGifOpen ? 'flex' : 'none';
      if (this.isGifOpen) {
        if (this.isEmojiOpen) {
          this.isEmojiOpen = false;
          this.emojiPopover.style.display = 'none';
        }
        setTimeout(() => this.gifSearchInput?.focus(), 50);
      }
    });

    this.gifSearchInput?.addEventListener('input', (e) => {
      this.gifSearchQuery = e.target.value.toLowerCase().trim();
      this.renderGifGrid();
    });

    this.addCustomGifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const customUrl = prompt('Enter GIF image URL (https://...):');
      if (!customUrl) return;
      const trimmed = customUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        alert('Please enter a valid HTTP or HTTPS GIF URL.');
        return;
      }
      const title = prompt('Enter a label for this GIF (optional):', 'Custom GIF') || 'Custom GIF';
      this.toggleFavoriteGif({
        id: 'custom_' + Date.now(),
        title: title.trim(),
        tags: ['favs', 'custom'],
        url: trimmed
      });
      const favTabBtn = this.container.querySelector('.gif-tag-btn[data-gif-tag="favs"]');
      if (favTabBtn) {
        this.container.querySelectorAll('.gif-tag-btn').forEach(b => b.classList.remove('active'));
        favTabBtn.classList.add('active');
        this.activeGifCategory = 'favs';
        this.renderGifGrid();
      }
    });

    const gifTagBtns = this.container.querySelectorAll('.gif-tag-btn');
    gifTagBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        gifTagBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeGifCategory = btn.getAttribute('data-gif-tag');
        this.renderGifGrid();
      });
    });

    const catBtns = this.container.querySelectorAll('.emoji-cat-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        catBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeEmojiCategory = parseInt(btn.getAttribute('data-cat-index'), 10);
        this.renderEmojiGrid();
      });
    });

    document.addEventListener('click', (e) => {
      if (this.isEmojiOpen && !this.emojiPopover.contains(e.target) && e.target !== this.emojiBtn) {
        this.isEmojiOpen = false;
        this.emojiPopover.style.display = 'none';
      }
      if (this.isGifOpen && !this.gifPopover.contains(e.target) && e.target !== this.gifBtn) {
        this.isGifOpen = false;
        this.gifPopover.style.display = 'none';
      }
    });
  }

  renderGifGrid() {
    if (!this.gifGrid) return;
    const q = this.gifSearchQuery;
    const cat = this.activeGifCategory;
    const favGifs = this.getFavoriteGifs();

    let list = [];
    if (cat === 'favs') {
      list = [...favGifs];
    } else {
      list = [...CURATED_GIFS];
    }

    if (cat && cat !== 'all' && cat !== 'favs') {
      list = list.filter(g => (Array.isArray(g.tags) && g.tags.includes(cat)) || (g.title && g.title.toLowerCase().includes(cat)));
    }
    if (q) {
      list = list.filter(g => (g.title && g.title.toLowerCase().includes(q)) || (Array.isArray(g.tags) && g.tags.some(t => t.includes(q))) || (g.url && g.url.toLowerCase().includes(q)));
    }

    if (list.length === 0) {
      this.gifGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 12px; line-height: 1.5;">
          ${cat === 'favs' ? 'No favorite GIFs saved yet.<br>Click the star (★) on any GIF or use "+ Fav URL" to add your favorites.' : 'No matching GIFs found.'}
        </div>
      `;
      return;
    }

    const escapeStr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    this.gifGrid.innerHTML = list.map(g => {
      const isFav = this.isGifFavorite(g.url);
      const safeUrl = escapeStr(g.url);
      const safeTitle = escapeStr(g.title);
      return `
        <div class="gif-item-card" data-gif-url="${safeUrl}" title="${safeTitle}" style="position: relative;">
          <button type="button" class="gif-fav-star-btn ${isFav ? 'active' : ''}" data-fav-url="${safeUrl}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" style="position: absolute; top: 4px; right: 4px; z-index: 5; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; color: ${isFav ? '#ffffff' : '#888888'}; padding: 2px 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            ★
          </button>
          <img src="${safeUrl}" alt="${safeTitle}" loading="lazy" />
          <span class="gif-item-label">${safeTitle}</span>
        </div>
      `;
    }).join('');

    this.gifGrid.querySelectorAll('.gif-fav-star-btn').forEach(starBtn => {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = starBtn.getAttribute('data-fav-url');
        const matched = list.find(g => g.url === url) || { url, title: 'Custom GIF', tags: ['favs'] };
        this.toggleFavoriteGif(matched);
      });
    });

    this.gifGrid.querySelectorAll('.gif-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const gifUrl = card.getAttribute('data-gif-url');
        if (gifUrl) {
          this.sendDirectMessage(gifUrl);
          this.isGifOpen = false;
          this.gifPopover.style.display = 'none';
        }
      });
    });
  }

  updateReplyBar() {
    const state = appState.getState();
    const replyingTo = state.replyingTo;
    const inputBox = this.container.querySelector('#chat-input-box');

    if (replyingTo && this.replyBar) {
      this.replyBar.style.display = 'flex';
      if (this.replyText) {
        this.replyText.textContent = `Replying to @${replyingTo.senderName || 'User'}`;
      }
      if (inputBox) {
        inputBox.style.borderRadius = '0 0 6px 6px';
      }
      this.textarea.focus();
    } else if (this.replyBar) {
      this.replyBar.style.display = 'none';
      if (inputBox) {
        inputBox.style.borderRadius = '6px';
      }
    }
  }

  renderEmojiGrid() {
    let emojisToRender = [];
    if (this.emojiSearchQuery) {
      const q = this.emojiSearchQuery;
      const matched = [];
      for (const cat of EMOJI_CATEGORIES) {
        if (cat.name.toLowerCase().includes(q)) {
          matched.push(...cat.emojis);
        } else {
          for (const em of cat.emojis) {
            matched.push(em);
          }
        }
      }
      emojisToRender = [...new Set(matched)];
    } else {
      const cat = EMOJI_CATEGORIES[this.activeEmojiCategory];
      emojisToRender = cat ? cat.emojis : [];
    }

    if (!this.emojiGrid) return;

    this.emojiGrid.innerHTML = emojisToRender
      .map((emoji) => `<button type="button" class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`)
      .join('');

    const btns = this.emojiGrid.querySelectorAll('.emoji-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emoji = btn.getAttribute('data-emoji');
        this.insertText(emoji);
      });
    });
  }

  insertText(textToInsert) {
    const start = this.textarea.selectionStart || this.textarea.value.length;
    const end = this.textarea.selectionEnd || this.textarea.value.length;
    const val = this.textarea.value;
    this.textarea.value = val.substring(0, start) + textToInsert + val.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + textToInsert.length;
    this.textarea.focus();
  }

  canUserSend() {
    const state = appState.getState();
    if (state.activeContext !== 'server' || !state.activeServer) return true;

    const server = state.activeServer;
    const currentUserId = playFabService.getCurrentUser()?.playFabId;
    const isOwner = server.ownerId === currentUserId || (!server.ownerId && (server.id === currentUserId || server.serverId === currentUserId));
    if (isOwner) return true;

    const memberRecord = (server.members && server.members[currentUserId]) ? server.members[currentUserId] : null;
    const userRoles = (memberRecord && Array.isArray(memberRecord.roles) && memberRecord.roles.length > 0) ? memberRecord.roles : ['role_member'];
    if (userRoles.includes('role_admin')) return true;

    const chId = state.activeChannelId || 'chat';
    const overrides = (server.channelOverrides && server.channelOverrides[chId]) || {};
    let explicitAllow = false;
    let explicitDeny = false;
    for (const rId of userRoles) {
      if (overrides[rId]) {
        if (overrides[rId].send_messages === true) explicitAllow = true;
        if (overrides[rId].send_messages === false) explicitDeny = true;
      }
    }

    if (explicitAllow) return true;
    if (explicitDeny) return false;

    const allRoles = Array.isArray(server.roles) ? server.roles : [
      { id: 'role_admin', name: 'Admin', permissions: ['manage_server', 'manage_channels', 'manage_roles', 'send_messages'] },
      { id: 'role_member', name: 'Member', permissions: ['send_messages'] }
    ];
    for (const r of allRoles) {
      if (userRoles.includes(r.id) && Array.isArray(r.permissions) && r.permissions.includes('send_messages')) {
        return true;
      }
    }
    return false;
  }

  updatePlaceholder() {
    const state = appState.getState();
    const isFriendsHub = (state.activeContext === 'dm' && !state.activeDM);
    const isChatOpen = !isFriendsHub;
    this.container.style.display = isChatOpen ? 'block' : 'none';

    const canSend = this.canUserSend();

    this.textarea.disabled = !canSend;
    this.sendBtn.disabled = !canSend;
    this.textarea.style.opacity = canSend ? '1' : '0.5';
    this.textarea.style.cursor = canSend ? 'text' : 'not-allowed';

    if (!canSend) {
      this.textarea.placeholder = "You do not have permission to send messages in this channel";
    } else if (state.activeContext === 'global') {
      this.textarea.placeholder = `Message #global-chat... (Enter to send, Shift+Enter for newline)`;
    } else if (state.activeContext === 'server') {
      this.textarea.placeholder = `Message #${state.activeChannelId || 'chat'}... (Enter to send, Shift+Enter for newline)`;
    } else if (state.activeContext === 'dm' && state.activeDM) {
      if (state.activeDM.isGroup) {
        this.textarea.placeholder = `Message ${state.activeDM.name || 'Group'}... (Enter to send, Shift+Enter for newline)`;
      } else {
        this.textarea.placeholder = `Message direct conversation... (Enter to send, Shift+Enter for newline)`;
      }
    } else {
      this.textarea.placeholder = `Message... (Enter to send, Shift+Enter for newline)`;
    }
  }

  async handleSend() {
    if (!this.canUserSend()) return;
    const text = this.textarea.value.trim();
    if (!text || this.isSending) return;

    if (!playFabService.isAuthenticated()) {
      this.callbacks.onRequireAuth();
      return;
    }

    const now = Date.now();
    if (now - this.lastSentTime < 1000) {
      return;
    }

    const currentUser = playFabService.getCurrentUser() || { displayName: "User", playFabId: "" };
    const targetParam = appState.getTargetParam();
    const streamKey = appState.getStreamKey();
    const state = appState.getState();
    const replyingTo = state.replyingTo;

    this.textarea.value = '';
    this.textarea.style.height = 'auto';
    if (this.charCounter) this.charCounter.textContent = '';
    this.sendBtn.disabled = true;
    this.isSending = true;
    this.lastSentTime = now;

    soundSynth.playSent();

    const optimisticMsg = {
      id: "opt_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderId: currentUser.playFabId,
      text: text,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      } : null
    };

    appState.addMessage(streamKey, optimisticMsg);

    const sendPayload = Object.assign({}, targetParam);
    if (replyingTo) {
      sendPayload.replyTo = {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      };
      appState.clearReplyingTo();
    }

    try {
      await playFabService.sendMessage(sendPayload, text);
      pollingEngine.pollNow();
    } catch { } finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.textarea.focus();
    }
  }

  async sendDirectMessage(text) {
    if (!this.canUserSend()) return;
    const cleanText = String(text || "").trim();
    if (!cleanText || this.isSending) return;

    if (!playFabService.isAuthenticated()) {
      this.callbacks.onRequireAuth();
      return;
    }

    const now = Date.now();
    if (now - this.lastSentTime < 1000) {
      return;
    }

    const currentUser = playFabService.getCurrentUser() || { displayName: "User", playFabId: "" };
    const targetParam = appState.getTargetParam();
    const streamKey = appState.getStreamKey();
    const state = appState.getState();
    const replyingTo = state.replyingTo;

    this.sendBtn.disabled = true;
    this.isSending = true;
    this.lastSentTime = now;

    soundSynth.playSent();

    const optimisticMsg = {
      id: "opt_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      senderId: currentUser.playFabId,
      text: cleanText,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      } : null
    };

    appState.addMessage(streamKey, optimisticMsg);

    const sendPayload = Object.assign({}, targetParam);
    if (replyingTo) {
      sendPayload.replyTo = {
        id: replyingTo.id,
        senderId: replyingTo.senderId,
        text: replyingTo.text
      };
      appState.clearReplyingTo();
    }

    try {
      await playFabService.sendMessage(sendPayload, cleanText);
      pollingEngine.pollNow();
    } catch { } finally {
      this.isSending = false;
      this.sendBtn.disabled = false;
    }
  }

  async uploadAndSendFile(file) {
    return this.uploadAndSendFiles([file]);
  }

  async uploadAndSendFiles(files) {
    if (!this.canUserSend() || !files || files.length === 0) return;

    if (!playFabService.isAuthenticated()) {
      this.callbacks.onRequireAuth();
      return;
    }

    const validFiles = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`"${f.name}" exceeds the 10MB limit and was skipped.`);
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) return;

    if (this.uploadIndicator) {
      this.uploadIndicator.style.display = 'flex';
    }
    this.sendBtn.disabled = true;

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const prefix = validFiles.length > 1 ? `(${i + 1}/${validFiles.length}) ` : '';
        if (this.uploadStatusText) {
          this.uploadStatusText.textContent = `Uploading ${prefix}${file.name || 'file'}...`;
        }

        const uploadRes = await playFabService.uploadFile(file, (currentChunk, totalChunks) => {
          if (this.uploadStatusText) {
            this.uploadStatusText.textContent = `Uploading ${prefix}${file.name || 'file'}... (${currentChunk}/${totalChunks})`;
          }
        });

        if (uploadRes && uploadRes.success && uploadRes.fileId) {
          const fileMsg = `pulse://file/${uploadRes.fileId}?name=${encodeURIComponent(uploadRes.fileName || file.name || 'file')}&size=${uploadRes.fileSize || file.size}&type=${encodeURIComponent(uploadRes.fileType || file.type || 'application/octet-stream')}`;
          await this.sendDirectMessage(fileMsg);
        }
      }
    } catch (err) {
      alert(err?.message || "Failed to upload file");
    } finally {
      if (this.uploadIndicator) {
        this.uploadIndicator.style.display = 'none';
      }
      this.sendBtn.disabled = false;
      if (this.fileInput) this.fileInput.value = '';
    }
  }
}
