from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import fitz

BASE = Path(__file__).resolve().parent
DOC_DIR = BASE / "五类文书Word导出模板"
SOFFICE = Path(r"C:\Program Files\LibreOffice\program\soffice.com")


def main() -> None:
    docs = sorted(DOC_DIR.glob("*.docx"))
    if len(docs) != 5:
        raise RuntimeError(f"Expected 5 DOCX files, got {len(docs)}")
    with tempfile.TemporaryDirectory(prefix="pbs-lo-profile-", dir=BASE) as temp_name:
        profile = Path(temp_name) / "profile"
        profile.mkdir()
        result = subprocess.run(
            [
                str(SOFFICE), "--headless",
                f"-env:UserInstallation={profile.resolve().as_uri()}",
                "--convert-to", "pdf:writer_pdf_Export",
                "--outdir", str(BASE),
                *[str(path) for path in docs],
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            raise RuntimeError(result.stdout + "\n" + result.stderr)

    for docx_path in docs:
        code = docx_path.name.split("_")[3]
        pdf_path = BASE / f"{docx_path.stem}.pdf"
        if not pdf_path.exists():
            raise FileNotFoundError(pdf_path)
        pdf = fitz.open(pdf_path)
        page = pdf[0]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.45, 1.45), alpha=False)
        image_path = BASE / f"preview_{code}.png"
        pixmap.save(image_path)
        print(f"{code}: pages={pdf.page_count}, preview={image_path.name}, size={image_path.stat().st_size}")
        pdf.close()


if __name__ == "__main__":
    main()
