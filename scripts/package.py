"""Create the static HOSTiQ deployment archive without development files."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--payment-fix', action='store_true', help='Package only the 19 runtime files changed by the hosted-checkout fix')
args = parser.parse_args()
output = root / 'dist' / ('imoce-payment-fix.zip' if args.payment_fix else 'imoce-donation-demo.zip')
output.parent.mkdir(exist_ok=True)
files = [root / name for name in ('index.html', 'privacy.html', 'terms.html', 'donation-policy.html', 'styles.css', 'app.js', 'locales.js')]
if not args.payment_fix:
    files.extend(sorted((root / 'assets').rglob('*')))
for language in ('en', 'uk', 'ru'):
    for page in ('index.html', 'privacy.html', 'terms.html', 'donation-policy.html'):
        files.append(root / language / page)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in files:
        if path.is_file():
            archive.write(path, path.relative_to(root))
with ZipFile(output) as archive:
    assert archive.testzip() is None
print(output)
