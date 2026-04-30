// Splits a string with **bold** markers into an array of { text, bold } segments.
function parseSegments(text) {
  const segs = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index), bold: false })
    segs.push({ text: m[1], bold: true })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ text: text.slice(last), bold: false })
  return segs
}

module.exports = { parseSegments }
