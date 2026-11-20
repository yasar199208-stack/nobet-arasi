import { setAvatarData } from "./avatar.js?v=2";

const $ = (i) => document.getElementById(i);

// Kategoriler: [sekme simgesi, sekme adı, emojiler]
const GROUPS = [
  ["🛡️", "Nöbet", "🛡️ 👮 🚓 🚨 🔦 🔑 🔒 📞 📱 🎧 📻 🕶️ 🧤 🥾 🏢 🚪 🅿️ 🚧 🧯 📹 🪪 ⏰ 🌙 ☀️ 🧿 🫡 ☕ 🍵 😴 🥶 🥵 🌧️ ❄️ 🇹🇷"],
  ["😀", "Yüzler", "☠️ ☹️ ☺️ 👹 👺 👻 👽 👾 👿 💀 💩 😀 😁 😂 😃 😄 😅 😆 😇 😈 😉 😊 😋 😌 😍 😎 😏 😐 😑 😒 😓 😔 😕 😖 😗 😘 😙 😚 😛 😜 😝 😞 😟 😠 😡 😢 😣 😤 😥 😦 😧 😨 😩 😪 😫 😬 😭 😮 😯 😰 😱 😲 😳 😴 😵 😶 😷 😸 😹 😺 😻 😼 😽 😾 😿 🙀 🙁 🙂 🙃 🙄 🙈 🙉 🙊 🤐 🤑 🤒 🤓 🤔 🤕 🤖 🤗 🤠 🤡 🤢 🤣 🤤 🤥 🤧 🤨 🤩 🤪 🤫 🤬 🤭 🤮 🤯 🥰 🥱 🥲 🥳 🥴 🥵 🥶 🥺 🧐"],
  ["👋", "İnsanlar", "☝️ ⛹️ ✊ ✋ ✌️ ✍️ 🎅 🏃 🏄 🏇 🏊 🏋️ 🏌️ 👀 👁️ 👂 👃 👄 👅 👆 👇 👈 👉 👊 👋 👌 👍 👎 👏 👐 👤 👥 👦 👧 👨 👩 👪 👫 👬 👭 👮 👯 👰 👱 👲 👳 👴 👵 👶 👷 👸 👼 💁 💂 💃 💄 💅 💆 💇 💏 💑 💪 🕴️ 🕵️ 🕺 🖐️ 🖕 🖖 🗣️ 🙅 🙆 🙇 🙋 🙌 🙍 🙎 🙏 🚴 🚵 🚶 🛀 🛌 🤌 🤏 🤘 🤙 🤚 🤛 🤜 🤝 🤞 🤟 🤦 🤰 🤱 🤲 🤳 🤴 🤵 🤶 🤷 🤸 🤹 🤺 🤼 🤽 🤾 🥷 🦰 🦱 🦲 🦳 🦴 🦵 🦶 🦷 🦸 🦹 🦻 🦼 🦽 🦾 🦿 🧍 🧎 🧏 🧑 🧒 🧓 🧔 🧕 🧖 🧗 🧘 🧙 🧚 🧛 🧜 🧝 🧞 🧟 🧠 🫀 🫁 🫂 ⛹️‍♀️ 🏃‍♀️ 🏄‍♀️ 🏊‍♀️ 🏋️‍♀️ 🏌️‍♀️ 👮‍♀️ 👯‍♀️ 👰‍♀️ 👱‍♀️ 👳‍♀️ 👷‍♀️ 💁‍♀️ 💂‍♀️ 💆‍♀️ 💇‍♀️ 🕵️‍♀️ 🙅‍♀️ 🙆‍♀️ 🙇‍♀️ 🙋‍♀️ 🙍‍♀️ 🙎‍♀️ 🚴‍♀️ 🚵‍♀️ 🚶‍♀️ 🤦‍♀️ 🤵‍♀️ 🤷‍♀️ 🤸‍♀️ 🤹‍♀️ 🤼‍♀️ 🤽‍♀️ 🤾‍♀️ 🦸‍♀️ 🦹‍♀️ 🧍‍♀️ 🧎‍♀️ 🧏‍♀️ 🧖‍♀️ 🧗‍♀️ 🧘‍♀️ 🧙‍♀️ 🧚‍♀️ 🧛‍♀️ 🧜‍♀️ 🧝‍♀️ 🧞‍♀️ 🧟‍♀️ ⛹️‍♂️ 🏃‍♂️ 🏄‍♂️ 🏊‍♂️ 🏋️‍♂️ 🏌️‍♂️ 👮‍♂️ 👯‍♂️ 👰‍♂️ 👱‍♂️ 👳‍♂️ 👷‍♂️ 💁‍♂️ 💂‍♂️ 💆‍♂️ 💇‍♂️ 🕵️‍♂️ 🙅‍♂️ 🙆‍♂️ 🙇‍♂️ 🙋‍♂️ 🙍‍♂️ 🙎‍♂️ 🚴‍♂️ 🚵‍♂️ 🚶‍♂️ 🤦‍♂️ 🤵‍♂️ 🤷‍♂️ 🤸‍♂️ 🤹‍♂️ 🤼‍♂️ 🤽‍♂️ 🤾‍♂️ 🦸‍♂️ 🦹‍♂️ 🧍‍♂️ 🧎‍♂️ 🧏‍♂️ 🧖‍♂️ 🧗‍♂️ 🧘‍♂️ 🧙‍♂️ 🧚‍♂️ 🧛‍♂️ 🧜‍♂️ 🧝‍♂️ 🧞‍♂️ 🧟‍♂️ 👨‍⚕️ 👩‍⚕️ 🧑‍⚕️ 👨‍⚖️ 👩‍⚖️ 🧑‍⚖️ 👨‍✈️ 👩‍✈️ 🧑‍✈️ 👨‍🌾 👩‍🌾 🧑‍🌾 👨‍🍳 👩‍🍳 🧑‍🍳 👨‍🍼 👩‍🍼 🧑‍🍼 🧑‍🎄 👨‍🎓 👩‍🎓 🧑‍🎓 👨‍🎤 👩‍🎤 🧑‍🎤 👨‍🎨 👩‍🎨 🧑‍🎨 👨‍🏫 👩‍🏫 🧑‍🏫 👨‍🏭 👩‍🏭 🧑‍🏭 👁️‍🗨️ 👨‍👦‍👦 👨‍👨‍👦‍👦 👩‍👦‍👦 👨‍👩‍👦‍👦 👩‍👩‍👦‍👦 👨‍👧‍👦 👨‍👨‍👧‍👦 👩‍👧‍👦 👨‍👩‍👧‍👦 👩‍👩‍👧‍👦 👨‍👦 👨‍👨‍👦 👩‍👦 👨‍👩‍👦 👩‍👩‍👦 👨‍👧‍👧 👨‍👨‍👧‍👧 👩‍👧‍👧 👨‍👩‍👧‍👧 👩‍👩‍👧‍👧 👨‍👧 👨‍👨‍👧 👩‍👧 👨‍👩‍👧 👩‍👩‍👧 👨‍❤️‍👨 👩‍❤️‍👨 👨‍❤️‍💋‍👨 👩‍❤️‍💋‍👨 👨‍💻 👨‍💼 👨‍🔧 👨‍🔬 👨‍🚀 👨‍🚒 👨‍🦯 👨‍🦰 👨‍🦱 👨‍🦲 👨‍🦳 👨‍🦼 👨‍🦽 👩‍❤️‍👩 👩‍❤️‍💋‍👩 👩‍💻 👩‍💼 👩‍🔧 👩‍🔬 👩‍🚀 👩‍🚒 👩‍🦯 👩‍🦰 👩‍🦱 👩‍🦲 👩‍🦳 👩‍🦼 👩‍🦽 🧑‍💻 🧑‍💼 🧑‍🔧 🧑‍🔬 🧑‍🚀 🧑‍🚒 🧑‍🦯 🧑‍🦰 🧑‍🦱 🧑‍🦲 🧑‍🦳 🧑‍🦼 🧑‍🦽 🧑‍🤝‍🧑"],
  ["🐶", "Hayvanlar", "🐀 🐁 🐂 🐃 🐄 🐅 🐆 🐇 🐈 🐉 🐊 🐋 🐌 🐍 🐎 🐏 🐐 🐑 🐒 🐓 🐔 🐕 🐖 🐗 🐘 🐙 🐚 🐛 🐜 🐝 🐞 🐟 🐠 🐡 🐢 🐣 🐤 🐥 🐦 🐧 🐨 🐩 🐪 🐫 🐬 🐭 🐮 🐯 🐰 🐱 🐲 🐳 🐴 🐵 🐶 🐷 🐸 🐹 🐺 🐻 🐼 🐽 🐾 🐿️ 🕊️ 🕷️ 🕸️ 🦀 🦁 🦂 🦃 🦄 🦅 🦆 🦇 🦈 🦉 🦊 🦋 🦌 🦍 🦎 🦏 🦐 🦑 🦒 🦓 🦔 🦕 🦖 🦗 🦘 🦙 🦚 🦛 🦜 🦝 🦞 🦟 🦡 🦢 🦣 🦤 🦥 🦦 🦧 🦨 🦩 🦪 🦫 🦬 🦭 🪰 🪱 🪲 🪳 🐈‍⬛ 🐕‍🦺"],
  ["🌿", "Doğa ve hava", "☀️ ☁️ ☂️ ☃️ ☄️ ☔ ☘️ ⚡ ⛄ ⛅ ⛈️ ❄️ ⭐ 🌀 🌂 🌊 🌌 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 🌝 🌞 🌟 🌠 🌡️ 🌤️ 🌥️ 🌦️ 🌧️ 🌨️ 🌩️ 🌪️ 🌫️ 🌬️ 🌱 🌲 🌳 🌴 🌵 🌷 🌸 🌹 🌺 🌻 🌼 🌾 🌿 🍀 🍁 🍂 🍃 🍄 🏵️ 💐 💮 🔥 🥀 🦠 🪐 🪴 🪵 🪶"],
  ["🍔", "Yiyecek ve içecek", "☕ 🌭 🌮 🌯 🌰 🌶️ 🌽 🍅 🍆 🍇 🍈 🍉 🍊 🍋 🍌 🍍 🍎 🍏 🍐 🍑 🍒 🍓 🍔 🍕 🍖 🍗 🍘 🍙 🍚 🍛 🍜 🍝 🍞 🍟 🍠 🍡 🍢 🍣 🍤 🍥 🍦 🍧 🍨 🍩 🍪 🍫 🍬 🍭 🍮 🍯 🍰 🍱 🍲 🍳 🍴 🍵 🍶 🍷 🍸 🍹 🍺 🍻 🍼 🍽️ 🍾 🍿 🏺 🔪 🥂 🥃 🥄 🥐 🥑 🥒 🥓 🥔 🥕 🥖 🥗 🥘 🥙 🥚 🥛 🥜 🥝 🥞 🥟 🥠 🥡 🥢 🥣 🥤 🥥 🥦 🥧 🥨 🥩 🥪 🥫 🥬 🥭 🥮 🥯 🧀 🧁 🧂 🧃 🧄 🧅 🧆 🧇 🧈 🧉 🧊 🧋 🫐 🫑 🫒 🫓 🫔 🫕 🫖"],
  ["⚽", "Etkinlik ve oyun", "♟️ ♠️ ♣️ ♥️ ♦️ ⚽ ⚾ ⛳ ⛷️ ⛸️ 🀄 🃏 🎀 🎁 🎂 🎃 🎄 🎆 🎇 🎈 🎉 🎊 🎋 🎍 🎎 🎏 🎐 🎑 🎒 🎓 🎖️ 🎗️ 🎞️ 🎟️ 🎠 🎡 🎢 🎣 🎨 🎩 🎪 🎫 🎬 🎭 🎮 🎯 🎰 🎱 🎲 🎳 🎴 🎽 🎾 🎿 🏀 🏂 🏅 🏆 🏈 🏉 🏏 🏐 🏑 🏒 🏓 🏸 🏹 🔮 🤿 🥅 🥇 🥈 🥉 🥊 🥋 🥌 🥍 🥎 🥏 🧩 🧸 🪀 🪁 🪂 🪃 🪄 🪅 🪆"],
  ["🚗", "Yerler ve ulaşım", "⚓ ⛩️ ⛪ ⛰️ ⛱️ ⛲ ⛴️ ⛵ ⛺ ⛽ ✈️ 🌁 🌃 🌄 🌅 🌆 🌇 🌈 🌉 🌋 🌍 🌎 🌏 🌐 🏍️ 🏎️ 🏔️ 🏕️ 🏖️ 🏗️ 🏘️ 🏙️ 🏚️ 🏛️ 🏜️ 🏝️ 🏞️ 🏟️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏧 🏨 🏩 🏪 🏫 🏬 🏭 🏮 🏯 🏰 💒 🕋 🕌 🕍 🗺️ 🗻 🗼 🗽 🗾 🗿 🚀 🚁 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚋 🚌 🚍 🚎 🚏 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚙 🚚 🚛 🚜 🚝 🚞 🚟 🚠 🚡 🚢 🚣 🚤 🚥 🚦 🚧 🚨 🚲 🚳 🛕 🛖 🛗 🛢️ 🛣️ 🛤️ 🛥️ 🛩️ 🛫 🛬 🛰️ 🛳️ 🛴 🛵 🛶 🛷 🛸 🛹 🛺 🛻 🛼 🚣‍♀️ 🚣‍♂️"],
  ["💡", "Nesneler", "⌚ ⌛ ⌨️ ⏰ ⏱️ ⏲️ ⏳ ☎️ ⚒️ ⚔️ ⚙️ ⛏️ ⛑️ ⛓️ ✂️ ✉️ ✏️ ✒️ 🎙️ 🎚️ 🎛️ 🎤 🎥 🎦 🎧 🎵 🎶 🎷 🎸 🎹 🎺 🎻 🎼 🏷️ 👑 👒 👓 👔 👕 👖 👗 👘 👙 👚 👛 👜 👝 👞 👟 👠 👡 👢 👣 💈 💉 💊 💍 💎 💡 💣 💰 💱 💲 💳 💴 💵 💶 💷 💸 💺 💻 💼 💽 💾 💿 📀 📁 📂 📃 📄 📅 📆 📇 📈 📉 📊 📋 📌 📍 📎 📏 📐 📑 📒 📓 📔 📕 📖 📗 📘 📙 📚 📛 📜 📝 📞 📟 📠 📡 📢 📣 📤 📥 📦 📧 📨 📩 📪 📫 📬 📭 📮 📯 📰 📱 📲 📷 📸 📹 📺 📻 📼 📽️ 📿 🔋 🔌 🔍 🔎 🔏 🔐 🔑 🔒 🔓 🔔 🔕 🔖 🔗 🔦 🔧 🔨 🔩 🔫 🔬 🔭 🔯 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛 🕜 🕝 🕞 🕟 🕠 🕡 🕢 🕣 🕤 🕥 🕦 🕧 🕯️ 🕰️ 🕳️ 🕶️ 🕹️ 🖇️ 🖊️ 🖋️ 🖌️ 🖍️ 🖥️ 🖨️ 🖱️ 🖲️ 🖼️ 🗂️ 🗃️ 🗄️ 🗑️ 🗒️ 🗓️ 🗜️ 🗝️ 🗞️ 🗡️ 🗳️ 🚪 🚽 🚿 🛁 🛋️ 🛍️ 🛎️ 🛏️ 🛒 🛠️ 🛡️ 🥁 🥻 🥼 🥽 🥾 🥿 🦯 🦺 🧢 🧣 🧤 🧥 🧦 🧧 🧨 🧪 🧫 🧬 🧭 🧮 🧯 🧰 🧱 🧲 🧳 🧴 🧵 🧶 🧷 🧹 🧺 🧻 🧼 🧽 🧾 🧿 🩰 🩱 🩲 🩳 🩴 🩸 🩹 🩺 🪑 🪒 🪓 🪔 🪕 🪖 🪗 🪘 🪙 🪚 🪛 🪜 🪝 🪞 🪟 🪠 🪡 🪢 🪣 🪤 🪥 🪦 🪧 🪨"],
  ["❤️", "Semboller", "‼️ ⁉️ ™️ ℹ️ ↔️ ↕️ ↖️ ↗️ ↘️ ↙️ ↩️ ↪️ ⏏️ ⏩ ⏪ ⏫ ⏬ ⏭️ ⏮️ ⏯️ ⏸️ ⏹️ ⏺️ Ⓜ️ ▪️ ▫️ ▶️ ◀️ ◻️ ◼️ ◽ ◾ ☑️ ☢️ ☣️ ☦️ ☪️ ☮️ ☯️ ☸️ ♀️ ♂️ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ♨️ ♻️ ♾️ ♿ ⚕️ ⚖️ ⚗️ ⚛️ ⚜️ ⚠️ ⚧️ ⚪ ⚫ ⚰️ ⚱️ ⛎ ⛔ ✅ ✔️ ✖️ ✝️ ✡️ ✨ ✳️ ✴️ ❇️ ❌ ❎ ❓ ❔ ❕ ❗ ❣️ ❤️ ➕ ➖ ➗ ➡️ ➰ ➿ ⤴️ ⤵️ ⬅️ ⬆️ ⬇️ ⬛ ⬜ ⭕ 〰️ 〽️ ㊗️ ㊙️ 🅰️ 🅱️ 🅾️ 🅿️ 🆎 🆑 🆒 🆓 🆔 🆕 🆖 🆗 🆘 🆙 🆚 🈁 🈂️ 🈚 🈯 🈲 🈳 🈴 🈵 🈶 🈷️ 🈸 🈹 🈺 🉐 🉑 💋 💌 💓 💔 💕 💖 💗 💘 💙 💚 💛 💜 💝 💞 💟 💠 💢 💤 💥 💦 💧 💨 💫 💬 💭 💯 💹 📳 📴 📵 📶 🔀 🔁 🔂 🔃 🔄 🔅 🔆 🔇 🔈 🔉 🔊 🔘 🔙 🔚 🔛 🔜 🔝 🔞 🔟 🔠 🔡 🔢 🔣 🔤 🔰 🔱 🔲 🔳 🔴 🔵 🔶 🔷 🔸 🔹 🔺 🔻 🔼 🔽 🕉️ 🕎 🖤 🗨️ 🗯️ 🚫 🚬 🚭 🚮 🚯 🚰 🚱 🚷 🚸 🚹 🚺 🚻 🚼 🚾 🛂 🛃 🛄 🛅 🛐 🛑 🟠 🟡 🟢 🟣 🟤 🟥 🟦 🟧 🟨 🟩 🟪 🟫 🤍 🤎 🦮 🧡"],
  ["🏁", "Bayraklar", "🇹🇷 🎌 🏁 🏳️ 🏴 🚩 🏴‍☠️ 🏳️‍⚧️ 🇦🇨 🇨🇦 🇦🇩 🇦🇪 🇪🇦 🇦🇫 🇦🇬 🇬🇦 🇦🇮 🇦🇱 🇱🇦 🇦🇲 🇲🇦 🇦🇴 🇦🇶 🇶🇦 🇦🇷 🇦🇸 🇸🇦 🇦🇹 🇹🇦 🇦🇺 🇺🇦 🇦🇼 🇦🇽 🇦🇿 🇿🇦 🇧🇦 🇧🇧 🇧🇩 🇧🇪 🇧🇫 🇧🇬 🇬🇧 🇧🇭 🇧🇮 🇧🇯 🇧🇱 🇱🇧 🇧🇲 🇧🇳 🇧🇴 🇧🇶 🇧🇷 🇧🇸 🇸🇧 🇧🇹 🇧🇻 🇧🇼 🇧🇾 🇧🇿 🇨🇨 🇨🇩 🇨🇫 🇨🇬 🇨🇭 🇨🇮 🇮🇨 🇨🇰 🇨🇱 🇱🇨 🇨🇲 🇲🇨 🇨🇳 🇳🇨 🇨🇴 🇨🇵 🇨🇶 🇨🇷 🇨🇺 🇨🇻 🇻🇨 🇨🇼 🇨🇽 🇨🇾 🇨🇿 🇩🇪 🇩🇬 🇬🇩 🇩🇯 🇩🇰 🇩🇲 🇲🇩 🇩🇴 🇩🇿 🇪🇨 🇪🇪 🇪🇬 🇬🇪 🇪🇭 🇪🇷 🇷🇪 🇪🇸 🇸🇪 🇪🇹 🇪🇺 🇫🇮 🇫🇯 🇫🇰 🇫🇲 🇲🇫 🇫🇴 🇫🇷 🇬🇫 🇬🇬 🇬🇭 🇬🇮 🇬🇱 🇬🇲 🇲🇬 🇬🇳 🇳🇬 🇬🇵 🇵🇬 🇬🇶 🇬🇷 🇬🇸 🇸🇬 🇬🇹 🇹🇬 🇬🇺 🇺🇬 🇬🇼 🇬🇾 🇭🇰 🇰🇭 🇭🇲 🇲🇭 🇭🇳 🇭🇷 🇭🇹 🇹🇭 🇭🇺 🇮🇩 🇮🇪 🇮🇱 🇱🇮 🇮🇲 🇮🇳 🇳🇮 🇮🇴 🇮🇶 🇮🇷 🇮🇸 🇸🇮 🇮🇹 🇯🇪 🇯🇲 🇯🇴 🇯🇵 🇰🇪 🇰🇬 🇰🇮 🇰🇲 🇲🇰 🇰🇳 🇰🇵 🇵🇰 🇰🇷 🇰🇼 🇰🇾 🇰🇿 🇱🇰 🇱🇷 🇱🇸 🇸🇱 🇱🇹 🇹🇱 🇱🇺 🇱🇻 🇱🇾 🇲🇪 🇲🇱 🇲🇲 🇲🇳 🇲🇴 🇴🇲 🇲🇵 🇵🇲 🇲🇶 🇲🇷 🇲🇸 🇸🇲 🇲🇹 🇹🇲 🇲🇺 🇺🇲 🇲🇻 🇲🇼 🇲🇽 🇲🇾 🇲🇿 🇿🇲 🇳🇦 🇳🇪 🇳🇫 🇳🇱 🇳🇴 🇳🇵 🇵🇳 🇳🇷 🇳🇺 🇺🇳 🇳🇿 🇵🇦 🇵🇪 🇵🇫 🇵🇭 🇵🇱 🇵🇷 🇵🇸 🇵🇹 🇵🇼 🇵🇾 🇷🇴 🇷🇸 🇸🇷 🇷🇺 🇷🇼 🇸🇨 🇸🇩 🇸🇭 🇸🇯 🇸🇰 🇸🇳 🇸🇴 🇸🇸 🇸🇹 🇸🇻 🇸🇽 🇸🇾 🇸🇿 🇹🇨 🇹🇩 🇹🇫 🇹🇯 🇹🇰 🇹🇳 🇹🇴 🇹🇹 🇹🇻 🇹🇼 🇹🇿 🇺🇸 🇺🇾 🇺🇿 🇻🇦 🇻🇪 🇻🇬 🇻🇮 🇻🇳 🇻🇺 🇼🇫 🇼🇸 🇽🇰 🇾🇪 🇾🇹 🇿🇼 🏳️‍🌈"]
];

// Türkçe arama: anahtar kelimeler -> emojiler (ç/ğ/ı/ö/ş/ü yazmasan da bulur)
const SEARCH = [
  ["nöbet güvenlik bekçi", "🛡️ 👮 🚓 🚨 🔦 🔑 🔒 📻 🧿"],
  ["polis jandarma", "👮 🚓 🚔 🚨"],
  ["asker", "💂 🪖 🇹🇷 🫡"],
  ["alarm siren", "🚨 🔔 📢"],
  ["gece", "🌙 🌃 🌌 ⭐ 😴 🦉 🌠"],
  ["iyi geceler", "🌙 😴 💤 🌃 🛌"],
  ["gündüz güneş", "☀️ 🌞 🌤️ 😎"],
  ["sabah günaydın", "🌅 🌄 ☀️ ☕ 😊"],
  ["akşam", "🌆 🌇 🌙"],
  ["uyku uykusuz yorgun", "😴 🥱 💤 🛌 😪 😩 😫"],
  ["esneme", "🥱 😪 😴"],
  ["kahve", "☕ 🫖"],
  ["çay", "🍵 ☕ 🫖"],
  ["yemek", "🍔 🍕 🍳 🥪 🍜 🍲 🥗 🍛"],
  ["ekmek", "🍞 🥖 🥐"],
  ["simit", "🥨 🍩"],
  ["pizza", "🍕"],
  ["hamburger", "🍔 🍟"],
  ["tavuk", "🍗 🐔 🐓"],
  ["et kebap", "🥩 🍖 🌯"],
  ["pilav", "🍚 🍛"],
  ["çorba", "🍲 🍜"],
  ["makarna", "🍝 🍜"],
  ["tatlı", "🍰 🍩 🍪 🍫 🍬 🍮 🍯"],
  ["dondurma", "🍦 🍨 🍧"],
  ["meyve", "🍎 🍌 🍇 🍉 🍓 🍊 🍒 🍑"],
  ["elma", "🍎 🍏"],
  ["muz", "🍌"],
  ["karpuz", "🍉"],
  ["sebze", "🥕 🥦 🥒 🍅 🥬 🌽"],
  ["yumurta", "🥚 🍳"],
  ["süt", "🥛 🍼"],
  ["bira içki", "🍺 🍻 🍷 🍸"],
  ["sigara", "🚬 🚭"],
  ["su damla", "💧 🚰 🥤 🌊 💦"],
  ["soğuk", "🥶 ❄️ ⛄ 🧊 🧤 🧣"],
  ["sıcak", "🥵 ☀️ 🔥"],
  ["terleme", "😓 😅 💦 🥵"],
  ["yağmur", "🌧️ ☔ ⛈️ 🌂"],
  ["kar", "❄️ ⛄ 🌨️"],
  ["bulut", "☁️ ⛅ 🌥️"],
  ["rüzgar fırtına", "🌬️ 🌪️ ⛈️"],
  ["şimşek yıldırım", "⚡ ⛈️ 🌩️"],
  ["gökkuşağı", "🌈 🏳️‍🌈"],
  ["gülmek gülümseme", "🙂 😊 😀 😄 😁"],
  ["komik kahkaha", "😂 🤣 😆 😹"],
  ["göz kırpma", "😉 😏"],
  ["dil çıkarma şaka", "😛 😜 😝 🤪 🤡"],
  ["öpücük öpmek", "😘 😗 😙 😚 💋 💏 😽"],
  ["sarılmak", "🤗 🫂 🥰"],
  ["kalp aşk sevgi sevmek", "❤️ 💕 😍 🥰 💘 💖 💗 💓 💞 💝 🧡 💛 💚 💙 💜 🖤 🤍 🤎"],
  ["kırık", "💔"],
  ["sevimli", "🥰 😻 🐱 🐶"],
  ["ağlamak gözyaşı üzgün", "😢 😭 🥺 😞 😔 😿"],
  ["kızgın sinir öfke", "😡 😤 🤬 😠 👿"],
  ["küfür", "🤬 😡"],
  ["korku", "😱 😨 👻 😰"],
  ["şaşırma şaşkın", "😲 😮 🤯 😳 😯"],
  ["utanma mahcup", "😳 🙈 😅 🥴"],
  ["düşünme", "🤔 🧐 💭"],
  ["sessiz şşş", "🤫 🤐 🔇"],
  ["havalı cool", "😎 🕶️ 😏"],
  ["zengin", "🤑 💰 💵 💎"],
  ["inek akıllı", "🤓 🧠"],
  ["sarhoş", "🥴 🍺 🍷"],
  ["hasta grip öksürük", "🤒 🤧 😷 🤕"],
  ["ateş yangın", "🔥 🧯 🚒"],
  ["ölüm", "💀 ☠️ ⚰️"],
  ["hayalet", "👻"],
  ["şeytan", "😈 👿"],
  ["melek", "😇 👼"],
  ["palyaço", "🤡"],
  ["robot", "🤖"],
  ["uzaylı", "👽 👾 🛸"],
  ["kaka", "💩"],
  ["selam merhaba", "👋 🙋 🤝"],
  ["el sıkışmak anlaşma", "🤝"],
  ["alkış bravo", "👏 🙌 🎉"],
  ["dua", "🙏"],
  ["teşekkür sağ ol", "🙏 🤝 ❤️"],
  ["tamam evet onay", "👍 ✅ 👌 🆗 ✔️"],
  ["hayır", "👎 ❌ 🚫"],
  ["başparmak", "👍 👎"],
  ["işaret parmak", "👆 👇 👈 👉 ☝️"],
  ["zafer barış", "✌️ 🕊️"],
  ["yumruk", "👊 ✊"],
  ["güç kuvvet", "💪 🦾 🏋️"],
  ["el", "🖐️ ✋ 👋 🤚 👐"],
  ["bacak ayak", "🦵 🦶 👣"],
  ["beyin akıl", "🧠"],
  ["kulak", "👂"],
  ["burun", "👃"],
  ["göz", "👀 👁️ 🕶️"],
  ["dudak ağız", "👄 💋"],
  ["dil", "👅"],
  ["çocuk", "👦 👧 🧒 👶"],
  ["bebek", "👶 🍼"],
  ["anne", "👩 🤱"],
  ["baba", "👨"],
  ["aile", "👪 👨‍👩‍👧‍👦"],
  ["doktor", "👨‍⚕️ 👩‍⚕️ 🩺"],
  ["tamirci usta", "👨‍🔧 🔧 🛠️"],
  ["aşçı", "👨‍🍳 👩‍🍳"],
  ["öğretmen", "👨‍🏫 👩‍🏫"],
  ["pilot", "👨‍✈️ ✈️"],
  ["itfaiye", "👨‍🚒 🚒 🧯"],
  ["hayvan", "🐶 🐱 🐭 🐰 🦊 🐻 🐼 🐯 🦁"],
  ["kedi", "🐱 😺 🐈"],
  ["köpek", "🐶 🐕 🐩"],
  ["kuş", "🐦 🕊️ 🦅 🦉"],
  ["balık", "🐟 🐠 🎣"],
  ["at", "🐴 🏇"],
  ["inek", "🐄 🐮"],
  ["koyun", "🐑"],
  ["aslan", "🦁"],
  ["kaplan", "🐯"],
  ["ayı", "🐻"],
  ["kurt", "🐺"],
  ["tilki", "🦊"],
  ["fare", "🐭 🐁"],
  ["tavşan", "🐰 🐇"],
  ["maymun", "🐵 🙈 🙉 🙊"],
  ["yılan", "🐍"],
  ["kelebek", "🦋"],
  ["arı", "🐝"],
  ["böcek", "🐛 🐞 🐜"],
  ["kaplumbağa", "🐢"],
  ["çiçek", "🌹 🌷 🌸 🌺 🌻 🌼"],
  ["ağaç", "🌲 🌳 🌴"],
  ["deniz", "🌊 🏖️ ⛵ 🐬"],
  ["dağ", "⛰️ 🏔️"],
  ["ay yıldız", "🌙 🌕 ⭐ 🌟 ✨ 💫"],
  ["futbol maç top", "⚽ 🥅 🏆 🥇"],
  ["basketbol", "🏀"],
  ["voleybol", "🏐"],
  ["tenis", "🎾"],
  ["spor", "🏋️ 🏃 ⚽ 🏀 🥊"],
  ["koşu", "🏃 👟"],
  ["yüzme", "🏊"],
  ["bisiklet", "🚴 🚲"],
  ["kupa şampiyon madalya", "🏆 🥇 🥈 🥉 🏅"],
  ["oyun", "🎮 🎲 🧩 🎯"],
  ["müzik", "🎵 🎶 🎧 🎸 🎤"],
  ["gitar", "🎸"],
  ["piyano", "🎹"],
  ["davul", "🥁"],
  ["mikrofon", "🎤"],
  ["kulaklık", "🎧"],
  ["araba yol", "🚗 🚕 🚓 🛣️"],
  ["otobüs", "🚌 🚍"],
  ["tren", "🚆 🚂"],
  ["uçak", "✈️ 🛫 🛬"],
  ["gemi", "🚢 ⛴️"],
  ["motor", "🏍️"],
  ["taksi", "🚕"],
  ["ambulans yardım", "🚑 🆘"],
  ["kamyon", "🚚 🚛"],
  ["trafik ışık", "🚦 🚥 🚧"],
  ["benzin", "⛽"],
  ["ev", "🏠 🏡 🛏️ 🛋️"],
  ["bina", "🏢 🏭 🏬"],
  ["okul", "🏫 🎓"],
  ["hastane", "🏥"],
  ["cami", "🕌"],
  ["otel", "🏨"],
  ["market", "🏪 🛒"],
  ["banka", "🏦"],
  ["fabrika", "🏭"],
  ["telefon ara", "📞 📱 ☎️"],
  ["bilgisayar", "💻 🖥️"],
  ["pil şarj", "🔋 🔌"],
  ["fener", "🔦"],
  ["radyo", "📻"],
  ["televizyon", "📺"],
  ["kamera video", "📹 📷 🎥"],
  ["saat zaman", "⏰ ⌚ 🕐 ⏳"],
  ["takvim", "📅 📆"],
  ["not yazı", "📝 ✏️ 📓"],
  ["mektup posta", "✉️ 📧 📨 💌"],
  ["bildirim zil", "🔔 📣"],
  ["kilit anahtar", "🔒 🔑 🔓"],
  ["çanta", "💼 🎒 👜"],
  ["gözlük", "👓 🕶️"],
  ["şapka", "🧢 🎩 👒"],
  ["ayakkabı bot", "👟 🥾 👞"],
  ["elbise", "👗 👔 👕"],
  ["mont", "🧥"],
  ["eldiven", "🧤"],
  ["atkı", "🧣"],
  ["para maaş", "💰 💵 💸 💳 🤑"],
  ["altın", "🥇 💰 ✨"],
  ["kredi kart", "💳"],
  ["elmas", "💎"],
  ["iş çalışma mesai", "💼 ⏰ 🏢 🛠️ 💪"],
  ["hediye", "🎁"],
  ["doğum günü", "🎂 🎈 🎁 🎉"],
  ["yılbaşı", "🎄 🎅 🎆"],
  ["balon", "🎈"],
  ["havai fişek", "🎆 🎇"],
  ["kutlama parti konfeti", "🎉 🎊 🥳 🎈 🎂"],
  ["ok yön", "➡️ ⬅️ ⬆️ ⬇️"],
  ["doğru yanlış", "✅ ❌"],
  ["soru", "❓ ❔"],
  ["ünlem", "❗ ‼️"],
  ["artı eksi", "➕ ➖"],
  ["rakam sayı", "🔢 💯 🔟"],
  ["yüz puan", "💯"],
  ["yeni", "🆕"],
  ["ücretsiz bedava", "🆓"],
  ["yasak", "🚫 ⛔"],
  ["dikkat uyarı", "⚠️ 🚨 ❗ 🔔"],
  ["yardım", "🆘 🤝 🙏 🚑"],
  ["ilaç aşı", "💊 💉 🩺 🏥"],
  ["bomba", "💣 🧨"],
  ["bayrak", "🇹🇷 🚩 🎌 🏁 🏳️ 🏴"],
  ["türkiye türk", "🇹🇷 🚩 🎌"],
  ["azerbaycan", "🇦🇿"],
  ["almanya", "🇩🇪"],
  ["amerika abd", "🇺🇸"],
  ["ingiltere", "🇬🇧"],
  ["fransa", "🇫🇷"],
  ["italya", "🇮🇹"],
  ["ispanya", "🇪🇸"],
  ["rusya", "🇷🇺"],
  ["japonya", "🇯🇵"],
  ["çin", "🇨🇳"],
  ["suudi arabistan", "🇸🇦"],
  ["irak", "🇮🇶"],
  ["suriye", "🇸🇾"],
  ["pakistan", "🇵🇰"],
  ["kıbrıs", "🇨🇾"],
  ["gürcistan", "🇬🇪"],
  ["bulgaristan", "🇧🇬"],
  ["yunanistan", "🇬🇷"],
  ["ukrayna", "🇺🇦"],
  ["brezilya", "🇧🇷"],
  ["arjantin", "🇦🇷"],
  ["hollanda", "🇳🇱"],
  ["belçika", "🇧🇪"],
  ["isviçre", "🇨🇭"],
  ["avusturya", "🇦🇹"],
  ["kanada", "🇨🇦"],
  ["mısır", "🇪🇬"],
  ["iran", "🇮🇷"],
  ["hindistan", "🇮🇳"],
  ["kore", "🇰🇷 🇰🇵"],
  ["portekiz", "🇵🇹"],
  ["polonya", "🇵🇱"],
  ["isveç", "🇸🇪"],
  ["norveç", "🇳🇴"],
  ["mutlu", "😊 😀 😄 🥳"]
];

function fold(s) {
  return s.toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
}

const AVATARS = [
  ["🛡️", "#c99a12"], ["👮", "#2f6fb0"], ["🚓", "#c0392b"], ["🔦", "#d9822b"],
  ["🦅", "#8a6a4f"], ["🐺", "#5d6d7e"], ["🦁", "#c9a227"], ["🐻", "#7b4b2a"],
  ["🐯", "#e08e0b"], ["🦊", "#d35400"], ["🐼", "#566573"], ["🦉", "#6c5b7b"],
  ["🌙", "#2c3e75"], ["⭐", "#b9770e"], ["🔥", "#c0392b"], ["⚡", "#8e44ad"],
  ["🌲", "#1e8449"], ["🏔️", "#2874a6"], ["🎯", "#a93226"], ["💪", "#17806d"],
  ["😎", "#2e86c1"], ["🤠", "#a04000"], ["🥷", "#212f3d"], ["👑", "#b7950b"]
];

let toast = null, picker = null;

// Sadece emojiden oluşan kısa mesajlar büyük gösterilir
export function isBigEmoji(t) {
  return !!t && t.length <= 24
    && /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u.test(t)
    && /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(t);
}

function insert(e) {
  const i = $("in");
  if (i.value.length + e.length > 400) return;
  const s = i.selectionStart == null ? i.value.length : i.selectionStart;
  const t = i.selectionEnd == null ? s : i.selectionEnd;
  i.value = i.value.slice(0, s) + e + i.value.slice(t);
  const p = s + e.length;
  i.setSelectionRange(p, p);
}

function makeAvatar(e, c) {
  const S = 128, cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  g.fillStyle = c; g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(40, 34, 4, 64, 64, 100);
  gr.addColorStop(0, "rgba(255,255,255,.38)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.font = "72px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(e, S / 2, S / 2 + 4);
  return cv.toDataURL("image/jpeg", 0.85);
}

export function openAvatarPicker(uid) {
  let p = $("ap");
  if (!p) {
    p = document.createElement("div");
    p.className = "panel"; p.id = "ap"; p.hidden = true;
    const sheet = document.createElement("div"); sheet.className = "sheet";
    const head = document.createElement("div"); head.className = "sh";
    const h = document.createElement("h2"); h.textContent = "Hazır avatar seç";
    const x = document.createElement("button"); x.type = "button"; x.textContent = "Kapat";
    x.onclick = () => { p.hidden = true; };
    head.appendChild(h); head.appendChild(x);
    const grid = document.createElement("div"); grid.className = "agrid";
    AVATARS.forEach((a) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ao"; b.textContent = a[0];
      b.style.background = "radial-gradient(circle at 30% 25%, rgba(255,255,255,.4), rgba(255,255,255,0) 70%), " + a[1];
      b.onclick = () => { p.hidden = true; setAvatarData(p.dataset.uid, makeAvatar(a[0], a[1])); };
      grid.appendChild(b);
    });
    sheet.appendChild(head); sheet.appendChild(grid);
    p.appendChild(sheet);
    p.onclick = (e) => { if (e.target === p) p.hidden = true; };
    document.body.appendChild(p);
  }
  p.dataset.uid = uid;
  p.hidden = false;
}

/* ---------- Son kullanılan emojiler ---------- */
const RKEY = "na_recent_emoji";
function getRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RKEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function addRecent(e) {
  try {
    const v = getRecent().filter((x) => x !== e);
    v.unshift(e);
    localStorage.setItem(RKEY, JSON.stringify(v.slice(0, 32)));
  } catch (e2) { /* sorun değil */ }
}

function buildPicker() {
  const p = document.createElement("div");
  p.className = "epick"; p.hidden = true;
  const sr = document.createElement("input");
  sr.type = "search"; sr.className = "esearch"; sr.autocomplete = "off";
  sr.placeholder = "Ara: çay, gece, nöbet, kalp…";
  sr.setAttribute("aria-label", "Emoji ara");
  const tabs = document.createElement("div"); tabs.className = "etabs";
  const grid = document.createElement("div"); grid.className = "egrid";
  p.appendChild(sr); p.appendChild(tabs); p.appendChild(grid);

  let cur = 0;
  function fillGrid(list, emptyText) {
    if (!list.length) {
      grid.innerHTML = "";
      const d = document.createElement("div");
      d.className = "eempty"; d.textContent = emptyText;
      grid.appendChild(d);
      return;
    }
    grid.innerHTML = list.map((e) => '<button type="button">' + e + "</button>").join("");
  }
  function show(idx) {
    cur = idx;
    sr.value = "";
    const tbs = Array.from(tabs.children);
    tbs.forEach((t, i) => t.classList.toggle("on", i === idx));
    if (idx === 0) {
      fillGrid(getRecent(), "Henüz kullandığın emoji yok. Bir emoji seçince burada görünür.");
    } else {
      fillGrid(GROUPS[idx - 1][2].split(" "), "");
    }
    grid.scrollTop = 0;
  }
  function search(q) {
    const w = fold(q.trim());
    if (!w) { show(cur); return; }
    Array.from(tabs.children).forEach((t) => t.classList.remove("on"));
    const found = [];
    SEARCH.forEach((s) => {
      if (fold(s[0]).split(" ").some((k) => k.indexOf(w) === 0)) {
        s[1].split(" ").forEach((e) => { if (found.indexOf(e) < 0) found.push(e); });
      }
    });
    fillGrid(found, "Sonuç yok. Başka bir kelime dene.");
  }

  const rt = document.createElement("button");
  rt.type = "button"; rt.textContent = "🕘"; rt.title = "Son kullanılanlar";
  rt.onclick = () => show(0);
  tabs.appendChild(rt);
  GROUPS.forEach((g, i) => {
    const t = document.createElement("button");
    t.type = "button"; t.textContent = g[0]; t.title = g[1];
    t.onclick = () => show(i + 1);
    tabs.appendChild(t);
  });
  grid.onclick = (ev) => {
    const b = ev.target.closest("button");
  
