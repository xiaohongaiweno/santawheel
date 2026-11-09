import pathlib, base64
from playwright.sync_api import sync_playwright

OUT = pathlib.Path("/Users/workspace/ai_workspace/santawheel/.backlink/assets/fazier")
OUT.mkdir(parents=True, exist_ok=True)

svg = pathlib.Path("/Users/workspace/ai_workspace/santawheel/app/icon.svg").read_text()

pages = [
    ("gallery-1-home.png", "https://santawheel.com/"),
    ("gallery-2-white-elephant.png", "https://santawheel.com/white-elephant-generator"),
    ("gallery-3-gift-ideas.png", "https://santawheel.com/secret-santa-gift-ideas"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()

    # square logo 250x250
    page = browser.new_page(viewport={"width": 250, "height": 250})
    html = f'<html><body style="margin:0;padding:0">{svg.replace("<svg ", "<svg width=250 height=250 ")}</body></html>'
    page.set_content(html)
    page.screenshot(path=str(OUT / "logo-250.png"), omit_background=True)
    page.close()

    # gallery 1200x628
    page = browser.new_page(viewport={"width": 1200, "height": 628})
    for name, url in pages:
        page.goto(url, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(OUT / name))
        print("saved", name)
    browser.close()
