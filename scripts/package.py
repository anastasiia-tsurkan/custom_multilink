"""Create the static HOSTiQ deployment archive without development files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / 'dist' / 'imoce-donation-demo.zip'
output.parent.mkdir(exist_ok=True)
files = [root / name for name in ('index.html', 'styles.css', 'app.js')]
files.extend(sorted((root / 'assets').rglob('*')))
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in files:
        if path.is_file():
            archive.write(path, path.relative_to(root))
with ZipFile(output) as archive:
    assert archive.testzip() is None
print(output)
