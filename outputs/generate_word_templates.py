from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import Iterable

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "五类文书Word导出模板"

PRIMARY = "2563EB"
PRIMARY_DARK = "1D4ED8"
PRIMARY_LIGHT = "EFF6FF"
INK = "1F2937"
MUTED = "6B7280"
BORDER = "E5E7EB"
CANVAS = "F5F7FA"
WARNING_BG = "FFFBEB"
WARNING_TEXT = "92400E"

STUDENT = {
    "name_cn": "李雪",
    "name_en": "Li Xue",
    "gender_age": "女 / Female · 22",
    "phone": "138****8888",
    "project_no": "PRJ20260701001",
    "undergrad_school": "北京大学 / Peking University",
    "undergrad_major": "计算机科学 / Computer Science",
    "gpa": "3.8/4.0",
    "language": "IELTS 7.5 · TOEFL 105 · GRE 330",
    "school": "卡内基梅隆大学 / CMU",
    "program": "人工智能 / MSAII",
    "level": "硕士申请 / Master's",
    "round": "ED",
    "version": "v1.2",
    "export_date": "2026-08-27",
    "status": "撰写中 / Drafting",
    "editor": "张老师 · 2026-07-17 14:32",
}

DOC_META = {
    "PS": ("个人陈述", "Personal Statement", "李雪_CMU_MSAII_PS_个人陈述_导出模板.docx"),
    "CV": ("学术简历", "Curriculum Vitae", "李雪_CMU_MSAII_CV_学术简历_导出模板.docx"),
    "RL": ("推荐信", "Recommendation Letter", "李雪_CMU_MSAII_RL_推荐信_导出模板.docx"),
    "RP": ("研究计划", "Research Proposal", "李雪_CMU_MSAII_RP_研究计划_导出模板.docx"),
    "CL": ("套磁信", "Cold Email", "李雪_CMU_MSAII_CL_套磁信_导出模板.docx"),
}


def set_run_font(
    run,
    size: float,
    *,
    bold: bool = False,
    color: str = INK,
    english: bool = False,
    sans: bool = False,
    italic: bool = False,
) -> None:
    if english:
        font_name = "Arial" if sans else "Times New Roman"
        east_asia = "Arial" if sans else "Times New Roman"
    else:
        font_name = "Microsoft YaHei"
        east_asia = "微软雅黑"
    run.font.name = font_name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = RGBColor.from_string(color)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), east_asia)


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")


def set_cell_width(cell, width) -> None:
    cell.width = width
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.find(qn("w:tcW"))
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(width.twips))
    tc_w.set(qn("w:type"), "dxa")


def set_cell_margins(cell, *, top: int = 75, start: int = 100, bottom: int = 75, end: int = 100) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table, color: str = BORDER, size: int = 6) -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = borders.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), str(size))
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), color)


def set_fixed_layout(table) -> None:
    tbl_pr = table._tbl.tblPr
    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")
    table.autofit = False


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))


def set_paragraph_shading(paragraph, fill: str) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    shd = p_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        p_pr.append(shd)
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")


def set_paragraph_border(paragraph, *, edge: str, color: str, size: int, space: int = 4) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    node = p_bdr.find(qn(f"w:{edge}"))
    if node is None:
        node = OxmlElement(f"w:{edge}")
        p_bdr.append(node)
    node.set(qn("w:val"), "single")
    node.set(qn("w:sz"), str(size))
    node.set(qn("w:space"), str(space))
    node.set(qn("w:color"), color)


def configure_document(document: Document, code: str, cn: str, en: str) -> None:
    section = document.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.65)
    section.bottom_margin = Cm(1.55)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    section.header_distance = Cm(0.55)
    section.footer_distance = Cm(0.55)

    normal = document.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    normal.paragraph_format.space_after = Pt(5)

    for style_name in ("List Bullet", "List Number"):
        style = document.styles[style_name]
        style.font.name = "Times New Roman"
        style.font.size = Pt(10.5)
        style._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.paragraph_format.line_spacing = 1.3
        style.paragraph_format.space_after = Pt(2.5)

    props = document.core_properties
    props.title = f"{STUDENT['name_en']} - {en}"
    props.subject = f"PBS document export · {STUDENT['school']} · {STUDENT['level']}"
    props.author = "PBS Study Abroad Application Management System"
    props.keywords = f"{code}, {en}, {STUDENT['name_en']}, {STUDENT['project_no']}"
    props.comments = "English document template generated from the PBS 5.1 writing editor prototype."

    add_header(section, code)
    add_footer(section, code)


def add_header(section, code: str) -> None:
    paragraph = section.header.paragraphs[0]
    paragraph.paragraph_format.space_after = Pt(1)
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.tab_stops.add_tab_stop(Cm(17.3), WD_TAB_ALIGNMENT.RIGHT)
    set_paragraph_border(paragraph, edge="top", color=PRIMARY, size=24, space=2)
    set_run_font(paragraph.add_run("PBS STUDY ABROAD APPLICATIONS"), 8, bold=True, color=PRIMARY_DARK, english=True, sans=True)
    paragraph.add_run("\t")
    set_run_font(paragraph.add_run(f"DOCUMENT EXPORT · {code}"), 8, color=MUTED, english=True, sans=True)


def add_page_field(paragraph) -> None:
    set_run_font(paragraph.add_run("Page "), 7.5, color=MUTED, english=True, sans=True)
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run = paragraph.add_run()
    run._r.extend([begin, instruction, separate, placeholder, end])
    set_run_font(run, 7.5, color=MUTED, english=True, sans=True)


def add_footer(section, code: str) -> None:
    paragraph = section.footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(3)
    paragraph.paragraph_format.space_after = Pt(0)
    set_paragraph_border(paragraph, edge="top", color=BORDER, size=6, space=3)
    prefix = f"PBS · {STUDENT['name_en']} · {STUDENT['project_no']} · {code} · {STUDENT['version']}  |  "
    set_run_font(paragraph.add_run(prefix), 7.5, color=MUTED, english=True, sans=True)
    add_page_field(paragraph)


def add_title_block(document: Document, code: str, en: str) -> None:
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_before = Pt(5)
    title.paragraph_format.space_after = Pt(2)
    set_run_font(title.add_run(en), 20, bold=True, color="111827", english=True, sans=True)

    code_line = document.add_paragraph()
    code_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    code_line.paragraph_format.space_after = Pt(9)
    set_run_font(code_line.add_run(f"{code}  ·  MASTER'S APPLICATION"), 8.5, bold=True, color=PRIMARY_DARK, english=True, sans=True)


def add_info_heading(document: Document) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.left_indent = Cm(0.15)
    set_paragraph_border(paragraph, edge="left", color=PRIMARY, size=20, space=6)
    set_run_font(paragraph.add_run("APPLICATION PROFILE"), 9.5, bold=True, color=PRIMARY_DARK, english=True, sans=True)
    set_run_font(paragraph.add_run("  /  学生与申请信息"), 8, bold=True, color=MUTED)


def set_cell_text(cell, text: str, *, label: bool = False) -> None:
    cell.text = ""
    paragraph = cell.paragraphs[0]
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = 1.05
    if label:
        set_run_font(paragraph.add_run(text), 8.2, bold=True, color="4B5563")
    else:
        set_run_font(paragraph.add_run(text), 8.5, color=INK)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell)


def add_application_info_table(document: Document, code: str, cn: str, en: str) -> None:
    rows = [
        ("文书类型", f"{en} / {cn}", "文书代码", code),
        ("学生姓名", f"{STUDENT['name_cn']} / {STUDENT['name_en']}", "项目编号", STUDENT["project_no"]),
        ("性别 / 年龄", STUDENT["gender_age"], "联系电话", STUDENT["phone"]),
        ("本科院校", STUDENT["undergrad_school"], "本科专业", STUDENT["undergrad_major"]),
        ("本科 GPA", STUDENT["gpa"], "语言成绩", STUDENT["language"]),
        ("申请院校", STUDENT["school"], "申请专业", STUDENT["program"]),
        ("申请层次", STUDENT["level"], "申请轮次", STUDENT["round"]),
        ("文书版本", STUDENT["version"], "导出日期", STUDENT["export_date"]),
        ("状态", STUDENT["status"], "编辑信息", STUDENT["editor"]),
    ]
    table = document.add_table(rows=len(rows), cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_fixed_layout(table)
    set_table_borders(table)
    widths = [Cm(2.35), Cm(6.35), Cm(2.35), Cm(6.35)]
    for row_index, values in enumerate(rows):
        row = table.rows[row_index]
        prevent_row_split(row)
        row.height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
        row.height = Cm(0.54)
        for column_index, value in enumerate(values):
            cell = row.cells[column_index]
            set_cell_width(cell, widths[column_index])
            is_label = column_index in (0, 2)
            if is_label:
                set_cell_shading(cell, CANVAS)
            elif row_index == len(rows) - 1:
                set_cell_shading(cell, PRIMARY_LIGHT)
            set_cell_text(cell, value, label=is_label)


def add_body_heading(document: Document, label: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(9)
    paragraph.paragraph_format.space_after = Pt(6)
    set_paragraph_border(paragraph, edge="bottom", color=PRIMARY, size=12, space=4)
    set_run_font(paragraph.add_run(label), 12, bold=True, color="111827", english=True, sans=True)


def add_section_heading(document: Document, title: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(8)
    paragraph.paragraph_format.space_after = Pt(4)
    paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.left_indent = Cm(0.15)
    set_paragraph_shading(paragraph, CANVAS)
    set_paragraph_border(paragraph, edge="left", color=PRIMARY, size=18, space=5)
    set_run_font(paragraph.add_run("  " + title), 11, bold=True, color="111827", english=True, sans=True)


def add_body_paragraph(
    document: Document,
    text: str,
    *,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    size: float = 10.8,
    italic: bool = False,
    space_after: float = 5,
) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(space_after)
    paragraph.paragraph_format.line_spacing = 1.35
    paragraph.alignment = align
    set_run_font(paragraph.add_run(text), size, color=INK, english=True, italic=italic)


def create_restarted_numbering(document: Document) -> int:
    """Create a real numbered-list instance that restarts at 1."""
    numbering = document.part.numbering_part.element
    style = document.styles["List Number"]
    style_num_ids = style._element.xpath("./w:pPr/w:numPr/w:numId")
    if not style_num_ids:
        raise RuntimeError("The List Number style has no numbering definition")

    style_num_id = style_num_ids[0]
    base_num_id = style_num_id.get(qn("w:val"))
    base_nums = numbering.xpath(f"./w:num[@w:numId='{base_num_id}']")
    if not base_nums:
        raise RuntimeError("The List Number numbering instance is missing")
    base_num = base_nums[0]
    abstract_num = base_num.find(qn("w:abstractNumId"))
    if abstract_num is None:
        raise RuntimeError("The List Number abstract numbering definition is missing")

    base_abstract_id = abstract_num.get(qn("w:val"))
    base_abstracts = numbering.xpath(f"./w:abstractNum[@w:abstractNumId='{base_abstract_id}']")
    if not base_abstracts:
        raise RuntimeError("The List Number abstract numbering element is missing")

    existing_abstract_ids = [
        int(node.get(qn("w:abstractNumId")))
        for node in numbering.findall(qn("w:abstractNum"))
        if node.get(qn("w:abstractNumId")) is not None
    ]
    new_abstract_id = max(existing_abstract_ids, default=0) + 1
    restarted_abstract = deepcopy(base_abstracts[0])
    restarted_abstract.set(qn("w:abstractNumId"), str(new_abstract_id))
    level = restarted_abstract.find(qn("w:lvl"))
    if level is None:
        raise RuntimeError("The List Number level definition is missing")

    suffix = level.find(qn("w:suff"))
    if suffix is None:
        suffix = OxmlElement("w:suff")
        level_text = level.find(qn("w:lvlText"))
        level.insert(level.index(level_text) if level_text is not None else len(level), suffix)
    suffix.set(qn("w:val"), "space")

    level_p_pr = level.find(qn("w:pPr"))
    if level_p_pr is not None:
        tabs = level_p_pr.xpath("./w:tabs/w:tab")
        if tabs:
            tabs[0].set(qn("w:pos"), "397")
        indent = level_p_pr.find(qn("w:ind"))
        if indent is not None:
            indent.set(qn("w:left"), "397")
            indent.set(qn("w:hanging"), "198")

    first_num_index = next(
        (index for index, node in enumerate(numbering) if node.tag == qn("w:num")),
        len(numbering),
    )
    numbering.insert(first_num_index, restarted_abstract)

    existing_ids = [
        int(node.get(qn("w:numId")))
        for node in numbering.findall(qn("w:num"))
        if node.get(qn("w:numId")) is not None
    ]
    new_num_id = max(existing_ids, default=0) + 1

    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(new_num_id))
    abstract_ref = OxmlElement("w:abstractNumId")
    abstract_ref.set(qn("w:val"), str(new_abstract_id))
    num.append(abstract_ref)
    level_override = OxmlElement("w:lvlOverride")
    level_override.set(qn("w:ilvl"), "0")
    start_override = OxmlElement("w:startOverride")
    start_override.set(qn("w:val"), "1")
    level_override.append(start_override)
    num.append(level_override)
    numbering.append(num)
    return new_num_id


def add_list(document: Document, items: Iterable[str], *, numbered: bool = False) -> None:
    style = "List Number" if numbered else "List Bullet"
    num_id = create_restarted_numbering(document) if numbered else None
    for item in items:
        paragraph = document.add_paragraph(style=style)
        if num_id is not None:
            num_pr = paragraph._p.get_or_add_pPr().get_or_add_numPr()
            num_pr.get_or_add_ilvl().set(qn("w:val"), "0")
            num_pr.get_or_add_numId().set(qn("w:val"), str(num_id))
        paragraph.paragraph_format.left_indent = Cm(0.7)
        paragraph.paragraph_format.first_line_indent = Cm(-0.35)
        paragraph.paragraph_format.space_after = Pt(2.5)
        set_run_font(paragraph.add_run(item), 10.5, color=INK, english=True)


def add_label_value(document: Document, label: str, value: str, *, warning: bool = False) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(2.5)
    paragraph.paragraph_format.left_indent = Cm(0.2)
    if warning:
        set_paragraph_shading(paragraph, WARNING_BG)
    set_run_font(paragraph.add_run(label + " "), 10, bold=True, color="374151", english=True, sans=True)
    set_run_font(paragraph.add_run(value), 10, color=WARNING_TEXT if warning else INK, english=True)


def add_note(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(7)
    paragraph.paragraph_format.space_after = Pt(5)
    paragraph.paragraph_format.left_indent = Cm(0.15)
    paragraph.paragraph_format.right_indent = Cm(0.15)
    set_paragraph_shading(paragraph, WARNING_BG)
    set_paragraph_border(paragraph, edge="left", color="F59E0B", size=14, space=5)
    set_run_font(paragraph.add_run("  " + text), 8.8, color=WARNING_TEXT, english=True)


def add_entry_header(document: Document, title: str, date: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(3)
    paragraph.paragraph_format.space_after = Pt(2)
    paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.tab_stops.add_tab_stop(Cm(17.2), WD_TAB_ALIGNMENT.RIGHT)
    set_run_font(paragraph.add_run(title), 10.5, bold=True, color="111827", english=True, sans=True)
    paragraph.add_run("\t")
    set_run_font(paragraph.add_run(date), 8.8, color=MUTED, english=True, sans=True)


def add_phase(document: Document, title: str, period: str, work: str, deliverable: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(1)
    paragraph.paragraph_format.keep_with_next = True
    set_run_font(paragraph.add_run(f"{title} — {period}"), 10.5, bold=True, color=PRIMARY_DARK, english=True, sans=True)
    add_body_paragraph(document, f"Work: {work}", size=10.2, space_after=1)
    add_body_paragraph(document, f"Deliverable: {deliverable}", size=10.2, italic=True, space_after=3)


def build_ps(document: Document) -> None:
    add_body_heading(document, "DOCUMENT CONTENT")
    sections = [
        (
            "1. Motivation and Defining Experience",
            "My interest in artificial intelligence became concrete while I was working on a national undergraduate innovation project titled “Deep Learning-Based Medical Image Analysis System.” The project exposed me to noisy real-world data, limited annotations, and the difficulty of aligning images with clinical text. I learned that an improvement on a conventional validation set does not automatically translate into reliable performance in a complex clinical setting. That experience changed the way I viewed AI: meaningful progress requires not only a higher score, but also methods that can be explained, tested, and adapted to imperfect environments. It motivated me to pursue graduate training in robust multimodal learning.",
        ),
        (
            "2. Research Interests",
            "I am particularly interested in robust multimodal representation learning under limited-data conditions. My current questions concern semantic alignment between images and text, the stability of contrastive objectives, and the role of attention mechanisms in cross-modal fusion. I want to investigate how models can generalize when training samples are scarce and class distributions are imbalanced. Rather than treating these issues as abstract benchmarks, I hope to begin with problems observed in real projects, formulate testable hypotheses, and evaluate each proposed method through reproducible experiments and careful error analysis.",
        ),
        (
            "3. Academic Preparation",
            "As a Computer Science undergraduate at Peking University, I have built a systematic foundation in data structures and algorithms, operating systems, machine learning, deep learning, and natural language processing. My GPA of 3.8/4.0 reflects consistent academic performance and disciplined study. These courses taught me to move from problem formulation to implementation and experimental evaluation. My GRE score of 330, IELTS score of 7.5, and TOEFL score of 105 have also prepared me to study, write, and collaborate in an English-speaking academic environment.",
        ),
        (
            "4. Research, Internship, and Project Experience",
            "In the medical imaging project, I contributed to model design and core experiments, with particular attention to performance bottlenecks in cross-modal alignment under small-sample conditions. During my NLP internship at Baidu AI Lab, I worked on intent classification and slot filling for a dialogue system. Through iterative feature and model improvements, the intent-classification accuracy increased from 91.2% to 94.6%. I also placed in the top 5% of a Kaggle multimodal classification challenge. Together, these experiences taught me to define a measurable problem, implement a solution, document the process, and connect technical choices to verifiable outcomes.",
        ),
        (
            "5. Why Carnegie Mellon and MSAII",
            "Carnegie Mellon University's M.S. in Artificial Intelligence and Innovation is a strong fit for my goal of combining rigorous technical training with real-world problem solving. The broader School of Computer Science environment and the resources of the Machine Learning Department would allow me to deepen my understanding of robust learning, multimodal reasoning, and large-scale model development. I am also drawn to the program's emphasis on translating advanced AI methods into usable systems. This combination would help me turn my existing project experience into a more disciplined capacity for research and innovation.",
        ),
        (
            "6. Future Goals",
            "In the short term, I hope to strengthen my theoretical foundation, participate in reproducible research, and become more precise in defining questions, designing experiments, and interpreting results. In the longer term, I plan to work at the intersection of AI research and engineering, with a focus on deploying reliable multimodal systems in high-impact domains such as healthcare. I believe that CMU's academic community would challenge me to grow beyond my current experience while giving me the tools to contribute responsibly to the development of practical artificial intelligence.",
        ),
    ]
    for title, text in sections:
        add_section_heading(document, title)
        add_body_paragraph(document, text)


def build_cv(document: Document) -> None:
    add_body_heading(document, "CURRICULUM VITAE")

    add_section_heading(document, "1. Profile")
    add_label_value(document, "Name:", "Li Xue")
    add_label_value(document, "Location:", "Beijing, China")
    add_label_value(document, "Email:", "[To be synchronized from the student record]", warning=True)
    add_label_value(document, "Research Interests:", "Multimodal learning, natural language processing, medical image analysis, and robust representation learning with limited data")

    add_section_heading(document, "2. Education")
    add_entry_header(document, "Peking University — B.S. in Computer Science", "Sep 2022 – Jun 2026 (Expected)")
    add_list(document, [
        "GPA: 3.8/4.0; ranked in the top 5% of the program.",
        "Relevant coursework: Data Structures and Algorithms, Operating Systems, Machine Learning, Deep Learning, and Natural Language Processing.",
    ])

    add_section_heading(document, "3. Research Experience")
    add_entry_header(document, "National Undergraduate Innovation Program — Deep Learning-Based Medical Image Analysis System", "Sep 2025 – Present")
    add_list(document, [
        "Contributed to model design and core experiments for image-text representation alignment under limited-data conditions.",
        "Implemented training, evaluation, and error-analysis workflows in Python and PyTorch, with an emphasis on reproducibility.",
    ])

    add_section_heading(document, "4. Selected Project")
    add_entry_header(document, "Kaggle Multimodal Classification Challenge", "Jun 2024 – Sep 2024")
    add_list(document, [
        "Developed a multimodal feature-processing and classification pipeline and finished in the top 5% of participating teams.",
    ])

    add_section_heading(document, "5. Industry Experience")
    add_entry_header(document, "Baidu AI Lab — NLP Algorithm Intern", "Jan 2025 – Aug 2025")
    add_list(document, [
        "Worked on intent classification and slot filling for a production dialogue system.",
        "Improved intent-classification accuracy from 91.2% to 94.6% through iterative feature and model optimization.",
    ])

    add_section_heading(document, "6. Publications, Skills, and Honors")
    add_list(document, [
        "Publications and intellectual property: co-author of two papers, including one ACL Workshop paper; one patent.",
        "Technical skills: Python, PyTorch, Git, deep learning, natural language processing, and multimodal modeling.",
        "Languages and tests: GRE 330; IELTS 7.5; TOEFL 105.",
        "Honors: National Scholarship and University First-Class Scholarship.",
    ])


def build_rl(document: Document) -> None:
    add_body_heading(document, "RECOMMENDATION LETTER")

    add_section_heading(document, "Recommender Details")
    add_label_value(document, "Name:", "[To be completed]", warning=True)
    add_label_value(document, "Title / Position:", "[To be completed]", warning=True)
    add_label_value(document, "Institution:", "[To be completed]", warning=True)
    add_label_value(document, "Relationship to Applicant:", "Course Instructor and Project Supervisor")
    add_label_value(document, "Telephone:", "[To be completed]", warning=True)
    add_label_value(document, "Email:", "[To be completed]", warning=True)

    add_body_paragraph(document, "August 27, 2026", align=WD_ALIGN_PARAGRAPH.RIGHT)
    add_body_paragraph(document, "To the Admissions Committee of the M.S. in Artificial Intelligence and Innovation\nCarnegie Mellon University", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_body_paragraph(document, "Dear Members of the Admissions Committee,", align=WD_ALIGN_PARAGRAPH.LEFT)

    paragraphs = [
        "I am pleased to recommend Li Xue for admission to Carnegie Mellon University's M.S. in Artificial Intelligence and Innovation. I have known Li for two years as her instructor in Machine Learning and as the supervisor of her national undergraduate innovation project. These sustained interactions have allowed me to observe her academic preparation, research potential, reliability, and ability to collaborate with others.",
        "Li has a strong foundation in computer science and learns new material with unusual speed and discipline. In my course, she consistently connected model assumptions with optimization objectives and evaluation methods rather than treating them as isolated formulas. She frequently designed additional experiments to test the limits of a classroom result. When she encountered an open-ended problem, she did not stop after reproducing a baseline; she examined the error patterns, identified possible causes, and proposed improvements that could be tested objectively.",
        "Her performance in the project “Deep Learning-Based Medical Image Analysis System” further demonstrated her research potential. Li contributed to model design and core experiments concerning image-text alignment under limited annotations. She compared baseline approaches systematically, documented experimental variables, and helped establish a repeatable evaluation process. Her work showed both technical competence and sound judgment: she was careful not to overstate an improvement and could explain why a particular result was or was not meaningful.",
        "Li is also dependable and generous as a team member. She completes assigned work on schedule, communicates problems early, and uses evidence rather than personal preference when discussing alternative solutions. When teammates encountered implementation difficulties, she volunteered to debug code and shared organized notes and experiment records. Her research, internship, and competition experience all reflect a sustained commitment to artificial intelligence rather than a short-term interest.",
        "I recommend Li Xue without reservation. I am confident that she can meet the demands of CMU's graduate curriculum and contribute positively to project teams and the wider academic community. Please feel free to contact me if additional information would be helpful.",
    ]
    for text in paragraphs:
        add_body_paragraph(document, text)

    add_body_paragraph(document, "Sincerely,", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_body_paragraph(document, "Signature: ______________________________", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "Name and Title: [To be completed]", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "Institution: [To be completed]", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "Telephone: [To be completed]", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "Email: [To be completed]", align=WD_ALIGN_PARAGRAPH.LEFT)


def build_rp(document: Document) -> None:
    add_body_heading(document, "RESEARCH PROPOSAL")

    add_section_heading(document, "1. Title")
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_after = Pt(6)
    title.paragraph_format.left_indent = Cm(0.3)
    title.paragraph_format.right_indent = Cm(0.3)
    set_paragraph_shading(title, PRIMARY_LIGHT)
    set_paragraph_border(title, edge="bottom", color="BFDBFE", size=8, space=4)
    set_run_font(title.add_run("Robust Multimodal Representation Alignment for Medical Imaging in Low-Data Settings"), 12.5, bold=True, color="111827", english=True, sans=True)

    add_section_heading(document, "2. Abstract")
    add_body_paragraph(document, "Multimodal learning offers an important way to combine medical images with clinical text, yet existing methods remain vulnerable to representation mismatch when annotations are limited, modalities are imbalanced, or inputs are noisy. This project proposes a robust alignment framework that combines contrastive learning, prototype-based regularization, and cross-modal attention. The framework will be evaluated on public medical image-text datasets under consistent training budgets. Ablation studies, robustness tests, calibration analysis, and cross-dataset evaluation will be used to determine whether each component provides a stable benefit. The expected outcome is a reproducible method and evaluation protocol for multimodal modeling in low-resource medical settings.")
    add_note(document, "Keywords: multimodal learning; medical imaging; contrastive learning; low-data learning; representation alignment")

    add_section_heading(document, "3. Background and Rationale")
    add_body_paragraph(document, "Medical decisions often rely on images, reports, and structured records at the same time. Mapping these sources into a shared representation space can improve classification, retrieval, and decision-support tasks. However, medical data are expensive to collect and annotate, and different modalities describe the same case at different levels of detail. During my work on a medical image analysis project, I observed that conventional alignment methods became unstable when the number of labeled examples was reduced. This observation motivates a focused investigation of robust representation learning when data are limited.")

    add_section_heading(document, "4. Research Questions")
    add_list(document, [
        "Which factors contribute most to unstable image-text alignment in low-data settings?",
        "Can prototype-based regularization and cross-modal attention improve contrastive learning under class imbalance?",
        "Does the proposed framework remain transferable and interpretable across datasets and downstream tasks?",
    ], numbered=True)

    add_section_heading(document, "5. Related Work")
    add_body_paragraph(document, "Existing research can be grouped into joint embedding methods, contrastive objectives, pretrained multimodal models, and cross-modal attention mechanisms. Contrastive learning can establish a shared semantic space from paired samples, but it is sensitive to negative-sample quality and batch composition. Prototype-based methods can reduce within-class variation, although they may amplify the effect of incorrect labels. Attention mechanisms can identify local relationships between modalities, but their computational cost and stability require careful evaluation. The final version of this proposal should review eight to twelve recent core studies and state clearly how the proposed framework differs from prior work.")

    add_section_heading(document, "6. Methodology")
    add_list(document, [
        "Data preparation: select public paired medical image-text datasets; conduct quality checks; define training, validation, and test partitions; and construct controlled low-data subsets.",
        "Baseline reproduction: reproduce standard contrastive and attention-based models under a unified preprocessing pipeline, training budget, and evaluation protocol.",
        "Method development: introduce class-prototype regularization and cross-modal attention into the contrastive framework, then isolate the contribution of each component.",
        "Evaluation: report accuracy, F1, retrieval recall, and calibration error; conduct ablation, robustness, cross-dataset, and qualitative error analyses.",
    ], numbered=True)

    add_section_heading(document, "7. Expected Outcomes")
    add_list(document, [
        "A measurable improvement of approximately two to three percentage points over strong baselines under a consistent experimental setting.",
        "Reproducible code, model configurations, experiment logs, and an error-analysis report.",
        "One or two research papers or technical reports that describe both the contribution and the limitations of the proposed method.",
    ])

    add_section_heading(document, "8. Timeline")
    add_phase(document, "Phase 1", "Months 1–3", "Review the literature, define the research scope, and prepare the datasets.", "A structured literature review and data specification.")
    add_phase(document, "Phase 2", "Months 4–6", "Reproduce baselines and establish the evaluation protocol and experiment environment.", "A baseline comparison report.")
    add_phase(document, "Phase 3", "Months 7–12", "Develop the method and conduct ablation and robustness experiments.", "Core experimental results and an interim analysis.")
    add_phase(document, "Phase 4", "Months 13–18", "Complete cross-dataset validation, write the paper, and package reproducible materials.", "A final manuscript and reproducible code release.")

    add_section_heading(document, "9. References")
    add_body_paragraph(document, "[1] [Insert recent core references on multimodal representation learning.]", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "[2] [Insert references on medical image-text alignment and low-data learning.]", align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)
    add_body_paragraph(document, "[3] [Format all references according to the target program's required citation style.]", align=WD_ALIGN_PARAGRAPH.LEFT)


def build_cl(document: Document) -> None:
    add_body_heading(document, "COLD EMAIL")

    add_label_value(document, "To:", "[Professor's email]", warning=True)
    add_label_value(document, "From:", "[Applicant's email]", warning=True)
    add_label_value(document, "Subject:", "Prospective M.S. Student — Multimodal Learning for Medical Imaging — CMU MSAII")
    add_label_value(document, "Attachments:", "LiXue_CV.pdf; LiXue_Transcript.pdf")

    paragraphs = [
        "Dear Prof. Smith,",
        "My name is Li Xue, a Computer Science undergraduate at Peking University preparing an application to Carnegie Mellon University's M.S. in Artificial Intelligence and Innovation. I am writing because your recent work on robust multimodal alignment closely relates to a problem I encountered in medical image analysis.",
        "In a national undergraduate innovation project, I designed core experiments for a deep-learning medical image analysis system and explored how contrastive learning and cross-modal attention can improve alignment when annotated samples are limited. During an NLP internship at Baidu AI Lab, my work helped raise intent-classification accuracy from 91.2% to 94.6%. I also placed in the top 5% of a Kaggle multimodal classification challenge. With a GPA of 3.8/4.0, a GRE score of 330, and two co-authored papers, I have developed a solid foundation for further research.",
        "I would appreciate the opportunity to ask whether my background could fit your group's upcoming projects. Would you be available for a brief 15–30 minute Zoom conversation? My CV and transcript are attached for reference.",
        "Best regards,\nLi Xue",
    ]
    for text in paragraphs:
        add_body_paragraph(document, text, align=WD_ALIGN_PARAGRAPH.LEFT)

    add_note(document, "Before sending: replace “Prof. Smith,” the email addresses, and the research reference with verified details. Keep the email body between 150 and 200 English words and confirm that the attachment names match the actual files.")


def apply_plain_layout(document: Document) -> None:
    """Remove decorative bars and color blocks; use whitespace for separation."""
    decorative_run_colors = {PRIMARY.upper(), PRIMARY_DARK.upper(), WARNING_TEXT.upper(), "F59E0B"}
    removable_cell_fills = {PRIMARY_LIGHT.upper(), WARNING_BG.upper(), "BFDBFE"}
    body_markers = {
        "DOCUMENT CONTENT",
        "CURRICULUM VITAE",
        "RECOMMENDATION LETTER",
        "RESEARCH PROPOSAL",
        "COLD EMAIL",
    }

    def simplify_paragraph(paragraph, *, add_body_spacing: bool = False) -> None:
        p_pr = paragraph._p.get_or_add_pPr()
        had_decoration = False
        for tag in ("w:pBdr", "w:shd"):
            node = p_pr.find(qn(tag))
            if node is not None:
                p_pr.remove(node)
                had_decoration = True

        if had_decoration:
            paragraph.paragraph_format.left_indent = Cm(0)
            paragraph.paragraph_format.right_indent = Cm(0)
            paragraph.paragraph_format.space_before = Pt(10)
            paragraph.paragraph_format.space_after = Pt(7)
            for run in paragraph.runs:
                if run.text:
                    run.text = run.text.lstrip()
                    break

        for run in paragraph.runs:
            rgb = run.font.color.rgb
            if rgb is not None and str(rgb).upper() in decorative_run_colors:
                run.font.color.rgb = RGBColor.from_string(INK)

        if add_body_spacing and paragraph.text.strip():
            is_list = paragraph.style is not None and paragraph.style.name in ("List Bullet", "List Number")
            paragraph.paragraph_format.space_after = Pt(5 if is_list else 9)

    content_started = False
    for paragraph in document.paragraphs:
        if paragraph.text.strip() in body_markers:
            content_started = True
        simplify_paragraph(paragraph, add_body_spacing=content_started)

    for section in document.sections:
        for paragraph in section.header.paragraphs:
            simplify_paragraph(paragraph)
        for paragraph in section.footer.paragraphs:
            simplify_paragraph(paragraph)

    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                tc_pr = cell._tc.get_or_add_tcPr()
                shd = tc_pr.find(qn("w:shd"))
                if shd is not None and shd.get(qn("w:fill"), "").upper() in removable_cell_fills:
                    shd.set(qn("w:fill"), "FFFFFF")
                for paragraph in cell.paragraphs:
                    simplify_paragraph(paragraph)


def generate_document(code: str) -> Path:
    cn, en, filename = DOC_META[code]
    document = Document()
    configure_document(document, code, cn, en)
    add_title_block(document, code, en)
    add_info_heading(document)
    add_application_info_table(document, code, cn, en)

    builders = {
        "PS": build_ps,
        "CV": build_cv,
        "RL": build_rl,
        "RP": build_rp,
        "CL": build_cl,
    }
    builders[code](document)
    apply_plain_layout(document)

    output_path = OUTPUT_DIR / filename
    document.save(output_path)
    return output_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = [generate_document(code) for code in ("PS", "CV", "RL", "RP", "CL")]
    print(f"Generated {len(generated)} English DOCX templates in: {OUTPUT_DIR}")
    for path in generated:
        print(f"- {path.name} ({path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
