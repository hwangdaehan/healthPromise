/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ColorHunt 팔레트 기반 색상 정의
        primary: {
          50: '#FFE8DB',   // 가장 밝은 색상
          100: '#FFD4C2',
          200: '#FFBFA9',
          300: '#FFAA90',
          400: '#FF9577',
          500: '#FF805E',  // 기본 primary
          600: '#E66B4A',
          700: '#CC5636',
          800: '#B34122',
          900: '#992C0E',
        },
        secondary: {
          50: '#F0F4F8',   // 가장 밝은 색상
          100: '#E1E9F1',
          200: '#C3D3E3',
          300: '#A5BDD5',
          400: '#87A7C7',
          500: '#739EC9',  // 기본 secondary
          600: '#5682B1',
          700: '#4A6B99',
          800: '#3E5481',
          900: '#323D69',
        },
        accent: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E3E7EA',
          300: '#D5DBE0',
          400: '#C7CFD6',
          500: '#B9C3CC',
          600: '#9BA5AE',
          700: '#7D8790',
          800: '#5F6972',
          900: '#414B54',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#000000',  // ColorHunt의 검은색
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
