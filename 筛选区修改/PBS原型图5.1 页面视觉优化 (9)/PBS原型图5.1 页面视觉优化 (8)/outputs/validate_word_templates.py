from __future__ import annotations

import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import fitz

BASE = Path(__file__).resolve().parent
DOC_DIR = BASE / "五类文书Word导出模板"
SOFFICE = Path(r"C:\Program Files\LibreOffice\program\soffice.com")
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{W_NS}}}"

EXPECTED = {
    "PS": {
        "cn": "个人陈述",
        "en": "Personal Statement",
        "body_marker": "DOCUMENT CONTENT",
        "tokens": [
            "Motivation and Defining Experience",
            "Research Interests",
            "Academic Preparation",
            "Why Carnegie Mellon and MSAII",
            "Future Goals",
        ],
        "min_words": 500,
    },
    "CV": {
        "cn": "学术简历",
        "en": "Curriculum Vitae",
        "body_marker": "CURRICULUM VITAE",
        "tokens": [
            "Profile",
            "Education",
            "Research Experience",
            "Industry Experience",
            "Publications, Skills, and Honors",
        ],
        "min_words": 180,
    },
    "RL": {
        "cn": "推荐信",
        "en": "Recommendation Letter",
        "body_marker": "RECOMMENDATION LETTER",
        "tokens": [
            "Recommender Details",
            "Dear Members of the Admissions Committee",
            "I recommend Li Xue without reservation",
            "Sincerely",
        ],
        "min_words": 380,
    },
    "RP": {
        "cn": "研究计划",
        "en": "Research Proposal",
        "body_marker": "RESEARCH PROPOSAL",
        "tokens": [
            "Background and Rationale",
            "Research Questions",
            "Related Work",
            "Methodology",
            "Expected Outcomes",
            "Timeline",
            "References",
        ],
        "min_words": 550,
    },
    "CL": {
        "cn": "套磁信",
        "en": "Cold Email",
        "body_marker": "COLD EMAIL",
        "tokens": [
            "Professor's email",
            "Prospective M.S. Student",
            "Dear Prof. Smith",
            "Best regards",
            "Before sending",
        ],
        "min_words": 150,
    },
}

COMMON_LABELS = [
    "文书类型", "文书代码", "学生姓名", "项目编号", "性别 / 年龄", "联系电话",
    "本科院校", "本科专业", "本科 GPA", "语言成绩", "申请院校", "申请专业",
    "申请层次", "申请轮次", "文书版本", "导出日期", "状态", "编辑信息",
]
COMMON_VALUES = [
    "李雪", "Li Xue", "PRJ20260701001", "北京大学", "Peking University",
    "计算机科学", "Computer Science", "3.8/4.0", "卡内基梅隆大学", "CMU",
    "人工智能", "MSAII", "硕士申请", "Master's", "ED", "v1.2", "2026-08-27",
]
CJK_PATTERN = re.compile(r"[\u3400-\u4DBF\u4E00-\u9FFF]")
WORD_PATTERN = re.compile(r"[A-Za-z]+(?:[’'-][A-Za-z]+)*")


def element_text(element: ET.Element) -> str:
    return "".join(node.text or "" for node in element.iter(f"{W}t"))


def normalize(value: str) -> str:
    return re.sub(r"\s+", "", value)


def validate_package(path: Path, code: str, spec: dict[str, object]) -> dict[str, int | str | bool]:
    assert path.exists(), f"Missing file: {path.name}"
    assert path.suffix.lower() == ".docx", f"Wrong extension: {path.name}"
    assert path.stat().st_size > 10_000, f"File is unexpectedly small: {path.name}"

    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None, f"ZIP CRC failed: {path.name}"
        members = set(archive.namelist())
        for required in ("[Content_Types].xml", "_rels/.rels", "word/document.xml", "word/styles.xml"):
            assert required in members, f"{path.name} is missing {required}"
        content_types = archive.read("[Content_Types].xml")
        assert b"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" in content_types

        xml_parts = {
            name: archive.read(name)
            for name in members
            if name.startswith("word/") and name.endswith(".xml")
        }
        document_xml = xml_parts["word/document.xml"]
        styles_xml = xml_parts["word/styles.xml"]
        root = ET.fromstring(document_xml)

        package_table_count = 0
        for name, payload in xml_parts.items():
            part_root = ET.fromstring(payload)
            package_table_count += len(list(part_root.iter(f"{W}tbl")))
        assert package_table_count == 1, (
            f"{path.name} must contain exactly one table in the entire DOCX package; "
            f"found {package_table_count}"
        )

    body = root.find(f"{W}body")
    assert body is not None, f"{path.name} has no document body"
    children = list(body)
    table_indexes = [index for index, child in enumerate(children) if child.tag == f"{W}tbl"]
    assert len(table_indexes) == 1, f"{path.name} must have one application-information table"
    table_index = table_indexes[0]
    table_text = element_text(children[table_index])

    body_marker = str(spec["body_marker"])
    marker_indexes = [
        index for index, child in enumerate(children)
        if body_marker in element_text(child)
    ]
    assert marker_indexes, f"{path.name} is missing body marker: {body_marker}"
    marker_index = marker_indexes[0]
    assert table_index < marker_index, f"{path.name} application table is not before the document content"
    assert not any(child.tag == f"{W}tbl" for child in children[marker_index:]), (
        f"{path.name} contains a table after the application-information section"
    )

    full_text = element_text(root)
    normalized = normalize(full_text)
    marker_char_index = full_text.find(body_marker)
    assert marker_char_index >= 0
    content_text = full_text[marker_char_index + len(body_marker):]

    for token in COMMON_LABELS + COMMON_VALUES + [code, str(spec["cn"]), str(spec["en"])]:
        assert normalize(token) in normalized, f"{path.name} is missing: {token}"
    for token in COMMON_LABELS + COMMON_VALUES:
        token_index = full_text.find(token)
        assert 0 <= token_index < marker_char_index, f"{path.name}: {token} is not before the English content"
    for token in spec["tokens"]:
        assert str(token) in content_text, f"{path.name} English content is missing: {token}"

    cjk_match = CJK_PATTERN.search(content_text)
    assert cjk_match is None, (
        f"{path.name} contains a Chinese character after {body_marker}: {cjk_match.group(0) if cjk_match else ''}"
    )
    word_count = len(WORD_PATTERN.findall(content_text))
    assert word_count >= int(spec["min_words"]), (
        f"{path.name} English content is too short: {word_count} words"
    )

    if code == "CL":
        email_start = content_text.find("Dear Prof. Smith")
        email_end = content_text.find("Before sending")
        assert 0 <= email_start < email_end, f"{path.name} cold-email boundaries are invalid"
        email_word_count = len(WORD_PATTERN.findall(content_text[email_start:email_end]))
        assert 150 <= email_word_count <= 200, (
            f"{path.name} cold-email body must be 150–200 words; got {email_word_count}"
        )
    else:
        email_word_count = 0

    page_sizes = list(root.iter(f"{W}pgSz"))
    assert page_sizes, f"{path.name} has no page size"
    width = int(page_sizes[-1].attrib.get(f"{W}w", "0"))
    height = int(page_sizes[-1].attrib.get(f"{W}h", "0"))
    assert 11_700 <= width <= 12_100 and 16_600 <= height <= 17_100, (
        f"{path.name} is not A4: {width}x{height}"
    )

    package_xml = b"".join(xml_parts.values()).lower()
    forbidden_decorative_colors = (b"2563eb", b"1d4ed8", b"eff6ff", b"bfdbfe", b"f59e0b", b"fffbeb", b"92400e")
    present_colors = [color.decode("ascii") for color in forbidden_decorative_colors if color in package_xml]
    assert not present_colors, f"{path.name} still contains decorative colors: {present_colors}"

    paragraph_decorations = 0
    for payload in xml_parts.values():
        part_root = ET.fromstring(payload)
        for paragraph in part_root.iter(f"{W}p"):
            p_pr = paragraph.find(f"{W}pPr")
            if p_pr is None:
                continue
            paragraph_decorations += int(p_pr.find(f"{W}pBdr") is not None)
            paragraph_decorations += int(p_pr.find(f"{W}shd") is not None)
    assert paragraph_decorations == 0, (
        f"{path.name} still contains {paragraph_decorations} paragraph border/shading decorations"
    )

    body_spacing_values = []
    for child in children[marker_index:]:
        if child.tag != f"{W}p" or not element_text(child).strip():
            continue
        spacing = child.find(f"{W}pPr/{W}spacing")
        after = int(spacing.attrib.get(f"{W}after", "0")) if spacing is not None else 0
        body_spacing_values.append(after)
    assert body_spacing_values and min(body_spacing_values) >= 100, (
        f"{path.name} does not keep enough blank spacing between content paragraphs: {body_spacing_values}"
    )

    return {
        "size": path.stat().st_size,
        "words": word_count,
        "email_words": email_word_count,
        "tables": package_table_count,
        "a4": f"{width}x{height}",
        "paragraph_decorations": paragraph_decorations,
        "min_body_spacing": min(body_spacing_values),
    }


def render_to_pdf(paths: list[Path]) -> dict[str, tuple[int, int]]:
    assert SOFFICE.exists(), "LibreOffice is unavailable for the open/render validation"
    with tempfile.TemporaryDirectory(prefix="pbs-docx-render-") as temp_name:
        temp_dir = Path(temp_name)
        pdf_dir = temp_dir / "pdf"
        profile_dir = temp_dir / "lo-profile"
        pdf_dir.mkdir()
        profile_dir.mkdir()
        result = subprocess.run(
            [
                str(SOFFICE),
                "--headless",
                f"-env:UserInstallation={profile_dir.resolve().as_uri()}",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                str(pdf_dir),
                *[str(path) for path in paths],
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            raise AssertionError(f"LibreOffice render failed: {result.returncode}\n{result.stdout}\n{result.stderr}")

        rendered = {}
        for path in paths:
            pdf_path = pdf_dir / f"{path.stem}.pdf"
            assert pdf_path.exists() and pdf_path.stat().st_size > 5_000, f"{path.name} did not render to PDF"
            assert pdf_path.read_bytes()[:5] == b"%PDF-", f"{pdf_path.name} is not a PDF"
            with fitz.open(pdf_path) as pdf:
                pages = pdf.page_count
                assert pages >= 1, f"{pdf_path.name} has no pages"
                assert all(page.rect.width > 0 and page.rect.height > 0 for page in pdf), f"{pdf_path.name} has an invalid page"
            rendered[path.name] = (pdf_path.stat().st_size, pages)
        return rendered


def main() -> None:
    actual = sorted(DOC_DIR.glob("*.docx"))
    assert len(actual) == 5, f"Expected 5 DOCX files, found {len(actual)}"

    paths = []
    summaries = {}
    for code, spec in EXPECTED.items():
        matches = list(DOC_DIR.glob(f"*_{code}_*.docx"))
        assert len(matches) == 1, f"{code} file count is {len(matches)}, expected 1"
        path = matches[0]
        summaries[path.name] = validate_package(path, code, spec)
        paths.append(path)

    rendered = render_to_pdf(paths)

    print("VALIDATION PASSED: 5/5 English DOCX templates")
    for path in paths:
        data = summaries[path.name]
        pdf_size, pages = rendered[path.name]
        email_info = f", email={data['email_words']} words" if data["email_words"] else ""
        print(
            f"- {path.name}: OOXML/CRC=OK, package_tables={data['tables']}, "
            f"English_content={data['words']} words{email_info}, A4={data['a4']}, "
            f"PDF={pdf_size:,} bytes/{pages} pages"
        )


if __name__ == "__main__":
    main()
