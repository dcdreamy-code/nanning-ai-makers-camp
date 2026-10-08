#!/usr/bin/env python3
"""
把 dist 产物打包成单个自包含 HTML，用于 htmlcode.fun 等只接受单文件的托管。

处理：
  1. 内联 <link rel="stylesheet"> → <style>
  2. 内联 <script src> → <script>
  3. 字体 woff2 → base64 data URI（保留 unicode-range，按需加载机制不变）
  4. favicon → data URI
  5. 把 /assets/xxx 路径重写为 data URI
"""
import base64
import mimetypes
import re
import sys
from pathlib import Path

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "dist-single/nanning-ai-makers-camp.html")

html = (DIST / "index.html").read_text(encoding="utf-8")

# GitHub Pages 子路径部署时 base 会被烘进 href，需要剥掉才能定位到 dist 里的文件
BASE = "/nanning-ai-makers-camp"


def strip_base(path: str) -> str:
    """去掉部署 base 前缀，还原成 dist 内的相对路径。"""
    if path.startswith(BASE + "/"):
        return path[len(BASE):]
    if path.startswith(BASE):
        return "/" + path[len(BASE):].lstrip("/")
    return path


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


# --- 1. CSS ---
def inline_css(m: re.Match) -> str:
    href = m.group(1)
    p = DIST / strip_base(href).lstrip("/")
    if not p.exists():
        return m.group(0)
    css = p.read_text(encoding="utf-8")
    # 把 CSS 里的字体 url 换成 data URI
    # 形如 ../fonts/x.woff2（子路径部署）或 /fonts/x.woff2（根目录部署）都要匹配，
    # 捕获组要含 fonts/ 这一层，否则会解析成 dist/x.woff2 而找不到文件。
    def repl_font(fm: re.Match) -> str:
        fp = DIST / fm.group(1)
        if not fp.exists():
            return fm.group(0)
        return f"url({data_uri(fp)})"

    css = re.sub(r"url\((?:\.\./|/)?((?:fonts/)?[^)/]+\.woff2)\)", repl_font, css)
    return f"<style>{css}</style>"


html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*/?>', inline_css, html)


# --- 2. JS ---
def inline_js(m: re.Match) -> str:
    src = m.group(1)
    p = DIST / strip_base(src).lstrip("/")
    if not p.exists():
        return m.group(0)
    js = p.read_text(encoding="utf-8")
    # 避免 </script> 提前闭合
    js = js.replace("</script>", "<\\/script>")
    return f"<script>{js}</script>"


html = re.sub(r'<script[^>]*src="([^"]+\.js)"[^>]*></script>', inline_js, html)


# --- 3. favicon / icon ---
def inline_icon(m: re.Match) -> str:
    href = m.group(2)
    p = DIST / strip_base(href).lstrip("/")
    if not p.exists():
        return m.group(0)
    return f'{m.group(1)}="{data_uri(p)}"'


html = re.sub(r'(<link[^>]*rel="[^"]*icon[^"]*"[^>]*href=")([^"]+)"', inline_icon, html)


# --- 4. 检查残留的本地绝对路径引用 ---
leftovers = re.findall(r'(?:href|src)="(/[^"]+)"', html)
leftovers = [l for l in leftovers if not l.startswith("//") and not l.startswith(BASE)]

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")

size_kb = OUT.stat().st_size / 1024
print(f"输出: {OUT}")
print(f"体积: {size_kb:.0f} KB")
print(f"残留本地路径引用: {leftovers if leftovers else '无'}")
