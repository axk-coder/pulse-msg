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
  { id: "g1", title: "GG / Gaming", tags: ["gaming", "gg", "win", "play"], url: "https://media.tenor.com/26Xm-gM6fWAAAAAM/cat-gaming.gif" },
  { id: "g2", title: "Victory Dance", tags: ["dance", "hype", "happy", "party"], url: "https://media.tenor.com/kS9l57XG01EAAAAM/pepe-dance.gif" },
  { id: "g3", title: "Anime Wave", tags: ["anime", "wave", "hello", "hi"], url: "https://media.tenor.com/4qJ5pG7e2ZAAAAAM/anime-wave.gif" },
  { id: "g4", title: "Typing Fast", tags: ["code", "typing", "fast", "hacker", "work"], url: "https://media.tenor.com/E8f8A_B25fMAAAAM/cat-typing.gif" },
  { id: "g5", title: "Thinking", tags: ["think", "hmm", "question", "smart"], url: "https://media.tenor.com/B94XmCqP-4EAAAAM/pepe-thinking.gif" },
  { id: "g6", title: "Cheers / Party", tags: ["cheers", "celebrate", "toast", "congrats"], url: "https://media.tenor.com/9499i85K_78AAAAM/leonardo-dicaprio-cheers.gif" },
  { id: "g7", title: "Mind Blown", tags: ["mind blown", "shocked", "wow", "omg"], url: "https://media.tenor.com/GfUXS21u04sAAAAM/mind-blown-explosion.gif" },
  { id: "g8", title: "Cat Vibing", tags: ["vibe", "music", "cat", "chill"], url: "https://media.tenor.com/gK9p95T8uC8AAAAM/cat-vibe.gif" },
  { id: "g9", title: "Thumbs Up", tags: ["thumbs up", "ok", "yes", "nice", "good"], url: "https://media.tenor.com/X4_0p5c0Q-MAAAAM/thumbs-up-computer.gif" },
  { id: "g10", title: "Popcorn Watching", tags: ["popcorn", "drama", "watch", "meme"], url: "https://media.tenor.com/f_wWc3J8F7sAAAAM/popcorn-eating.gif" },
  { id: "g11", title: "Anime Wow", tags: ["anime", "wow", "eyes", "sparkle"], url: "https://media.tenor.com/uR6eP4z-f_cAAAAM/anime-sparkle.gif" },
  { id: "g12", title: "Skeleton Dance", tags: ["skeleton", "meme", "funny", "spooky"], url: "https://media.tenor.com/7b58w_B9CNEAAAAM/spooky-skeleton.gif" },
  { id: "g13", title: "Facepalm", tags: ["facepalm", "meme", "fail", "no"], url: "https://media.tenor.com/1Gv_wSjR6F4AAAAM/picard-facepalm.gif" },
  { id: "g14", title: "Hype Dog", tags: ["dog", "hype", "happy", "cute"], url: "https://media.tenor.com/0iH191uL2YcAAAAM/dog-excited.gif" },
  { id: "g15", title: "Shocked Pikachu", tags: ["anime", "meme", "shocked", "pokemon"], url: "https://media.tenor.com/bC_f8a0-2fUAAAAM/pikachu-shocked.gif" },
  { id: "g16", title: "Rage / Anger", tags: ["rage", "angry", "gaming", "mad"], url: "https://media.tenor.com/Y36Wd-5657wAAAAM/keyboard-smash-rage.gif" },
  { id: "g17", title: "Laughing Hard", tags: ["laugh", "funny", "meme", "lol"], url: "https://media.tenor.com/uPvd-6i79EAAAAAM/laughing-hard.gif" },
  { id: "g18", title: "Salute / Respect", tags: ["salute", "respect", "gg", "honor"], url: "https://media.tenor.com/39J-L9C92eAAAAAM/crying-salute.gif" }
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
          <div class="gif-popover-header">
            <input type="text" id="gif-search-input" class="gif-search-input" placeholder="Search GIFs..." autocomplete="off" />
          </div>
          <div class="gif-category-bar">
            <button type="button" class="gif-tag-btn active" data-gif-tag="all">All</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="gaming">Gaming</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="anime">Anime</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="meme">Memes</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="dance">Dance</button>
            <button type="button" class="gif-tag-btn" data-gif-tag="happy">Happy</button>
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

    let filtered = CURATED_GIFS;
    if (cat && cat !== 'all') {
      filtered = filtered.filter(g => g.tags.includes(cat) || g.title.toLowerCase().includes(cat));
    }
    if (q) {
      filtered = filtered.filter(g => g.title.toLowerCase().includes(q) || g.tags.some(t => t.includes(q)) || g.url.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      this.gifGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">
          No matching GIFs found.
        </div>
      `;
      return;
    }

    this.gifGrid.innerHTML = filtered.map(g => `
      <div class="gif-item-card" data-gif-url="${g.url}" title="${g.title}">
        <img src="${g.url}" alt="${g.title}" loading="lazy" />
        <span class="gif-item-label">${g.title}</span>
      </div>
    `).join('');

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
