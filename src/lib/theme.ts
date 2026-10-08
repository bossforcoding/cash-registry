export type Theme = 'light' | 'dark'

export const THEME_KEY = 'theme'
export const THEME_COLORS: Record<Theme, string> = { light: '#f3f4f8', dark: '#080a12' }

// Runs before the first paint (inlined in <head>) so the page never flashes
// the wrong theme: saved choice first, otherwise the system preference.
export const themeInitScript = `(function(){try{
var t=localStorage.getItem('${THEME_KEY}');
if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
document.documentElement.classList.toggle('dark',t==='dark');
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute('content',t==='dark'?'${THEME_COLORS.dark}':'${THEME_COLORS.light}');
}catch(e){document.documentElement.classList.add('dark')}})()`

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}
