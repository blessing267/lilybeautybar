/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../templates/**/*.html",
    "../../../shop/templates/**/*.html",
    "../../../users/templates/**/*.html",
    "../../../frontend/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            gold: "#C9A227",
            nude: "#F5EFE7",
            blush: "#E8D8D1",
            charcoal: "#1A1A1A",
        }
    },
  },
  plugins: [
    require("daisyui"),
  ],
}