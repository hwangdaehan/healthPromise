/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Pretendard Variable', 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
