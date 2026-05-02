// Reusable loading screen — globe + animated dots after title.
// Used by /pages/loading and any in-flow loading overlay.
//
// Props:
//   title (String) — main line, e.g. "加载中"
//   sub (String)   — optional plain subtitle below
//   subSegs (Array) — optional [{text, bold}] segments; takes precedence over `sub`
//
// To highlight part of the subtitle, parse with utils/parse-segments.js using
// **markers** and pass the result as subSegs.
Component({
  properties: {
    title:   { type: String, value: "加载中" },
    sub:     { type: String, value: "" },
    subSegs: { type: Array,  value: [] },
  },
})
