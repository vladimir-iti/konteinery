"""Готовит фото для лендинга: убирает логотип референса, ужимает, сохраняет WebP.
Запуск из корня проекта: python3 tools/build-images.py
Исходники — img/src (скачаны с delfacom.ru, временно), результат — img/."""
import os, sys, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from delogo import delogo

MAP = {
  # имя на сайте: (исходник, макс. ширина)
  'hero': ('sandwich-1.webp', 1600),
  'bk-1': ('sandwich-4.webp', 1200), 'bk-2': ('sandwich-2.webp', 1200),
  'bk-3': ('sandwich-5.webp', 1200), 'bk-4': ('sandwich-7.webp', 1200),
  'kpp-1': ('kpp-14.webp', 1200), 'kpp-2': ('kpp-24.webp', 1200),
  'kpp-3': ('kpp-20.webp', 1200), 'kpp-4': ('kpp-11.webp', 1200),
  'mod-1': ('modular-01.jpg', 900), 'mod-2': ('modular-06.jpg', 900),
  'mod-3': ('modular-03.jpg', 900), 'mod-4': ('products-05.jpg', 900),
  'cat-household': ('products-14.jpg', 600), 'cat-tech': ('modular-03.jpg', 600),
  'cat-sanitary': ('modular-04.jpg', 600),
  'delivery': ('work-05.jpg', 1200),
}
for i in [1,2,3,4,5,7,8,10,12,13,16,19]:
    MAP[f'grid-{i:02d}'] = (f'products-{i:02d}.jpg', 600)

os.makedirs('img', exist_ok=True)
RAW = {'mod-2', 'delivery'}  # живые фото: логотипа нет, а зелень и огни фильтр портит
for name, (src, w) in MAP.items():
    out = f'img/{name}.webp'
    if os.path.exists(out):
        continue
    if name in RAW:
        im = Image.open(f'img/src/{src}').convert('RGB')
    else:
        bgr, _ = delogo(f'img/src/{src}')
        im = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=80, method=6)
    print(out, im.size, os.path.getsize(out)//1024, 'KB')
