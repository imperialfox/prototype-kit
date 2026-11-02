"""Copy the prototype kit into a prototype page, so it works as one file in the artifact viewer.

Usage: python tools/bundle.py my_prototype.html out.html

The prototype links the kit the normal way while it's being written:
    <link rel="stylesheet" href="kit.css">   and   <script src="kit.js"></script>
This swaps those two tags for the kit's own text. Nothing else in the page changes.
"""
import pathlib
import re
import sys

KIT = pathlib.Path(__file__).resolve().parent.parent


def bundle(html: str) -> str:
    css = (KIT / "kit.css").read_text(encoding="utf-8")
    js = (KIT / "kit.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
    html, n_css = re.subn(r'<link[^>]*href="[^"]*kit\.css"[^>]*>', lambda m: '<style id="kit-css">\n' + css + "\n</style>", html)
    html, n_js = re.subn(r'<script[^>]*src="[^"]*kit\.js"[^>]*>\s*</script>', lambda m: '<script id="kit-js">\n' + js + "\n</script>", html)
    if n_css != 1 or n_js != 1:
        raise SystemExit(f"Expected one kit.css link and one kit.js script, found {n_css} and {n_js}.")
    return html


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, out = map(pathlib.Path, sys.argv[1:])
    out.write_text(bundle(src.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Bundled {src.name} → {out} ({out.stat().st_size // 1024} KB)")
