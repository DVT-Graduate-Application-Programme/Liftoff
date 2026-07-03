"""
Stage 0 — Structural Injection Pre-Scan (pymupdf version)

NOT EXECUTION-TESTED — this environment has no network access to install
pymupdf, unlike the pdfplumber version tested earlier against
CV_Injection_AyandaZulu.pdf. Run this against your own fixtures before
trusting it. The get_text("dict") structure below is stable, documented
PyMuPDF API, but "documented" isn't the same guarantee as "verified."

Uses page.get_text("dict"), which returns text as blocks -> lines -> spans,
each span carrying font size and color for that run of text. This is the
same level PyMuPDF4LLM's to_markdown() reads internally before it flattens
everything into a markdown string and discards the formatting -- which is
exactly why this scan has to run independently, on the raw page, before
to_markdown() is called.
"""

from dataclasses import dataclass, field
from typing import Optional
import pymupdf


@dataclass
class StructuralFlag:
    flag_type: str          # "tiny_font" | "low_contrast"
    page_number: int
    snippet: str
    detail: str
    confidence: str          # "high" | "medium" -- see note below


@dataclass
class StructuralScanResult:
    suspected: bool
    flags: list[StructuralFlag] = field(default_factory=list)
    skipped: bool = False
    skip_reason: Optional[str] = None


MIN_READABLE_FONT_SIZE = 4.0   # pt
MIN_CONTRAST_DELTA = 0.15      # 0-1 scale, distance from assumed white background


def _int_color_to_rgb(color_int: int) -> tuple[float, float, float]:
    """pymupdf span['color'] is a packed sRGB int."""
    r = (color_int >> 16) & 255
    g = (color_int >> 8) & 255
    b = color_int & 255
    return (r / 255, g / 255, b / 255)


def _relative_luminance(rgb: tuple[float, float, float]) -> float:
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrast_delta(text_rgb, background_rgb=(1, 1, 1)) -> float:
    return abs(_relative_luminance(text_rgb) - _relative_luminance(background_rgb))


def scan_pdf_for_structural_injection(pdf_path: str) -> StructuralScanResult:
    """
    Deterministic, no LLM call. Catches tiny-font and near-white-on-white
    text reliably. Does NOT currently check PDF text render mode 3 (the
    spec-level "invisible text" trick, distinct from just coloring text
    white) -- pymupdf exposes this via the lower-level get_texttrace() API
    in recent versions, not surfaced here. Worth adding as a follow-up if
    you confirm your pymupdf version supports it; not implemented here
    since I can't verify the field name/availability without a live test.

    IMPORTANT FALSE-POSITIVE CAVEAT: the contrast check assumes a white
    page background. Resumes using colored sidebar/header design elements
    (a common modern template pattern -- white text on a colored banner)
    will trigger `low_contrast` here even though nothing is actually being
    hidden. `tiny_font` has no such legitimate case -- nobody sets real
    resume content below 4pt on purpose. Treat these two flag types with
    different confidence, which is why `confidence` is a separate field
    below: route `tiny_font` findings more aggressively, treat
    `low_contrast` as a softer signal pending a real design-aware check
    (e.g. sampling actual rendered pixel color behind the text via
    page.get_pixmap(), rather than assuming white -- not implemented here).
    """
    flags: list[StructuralFlag] = []

    try:
        with pymupdf.open(pdf_path) as doc:
            for page_index in range(doc.page_count):
                page = doc[page_index]
                page_dict = page.get_text("dict")

                spans_with_text = [
                    span
                    for block in page_dict.get("blocks", [])
                    if block.get("type") == 0  # 0 = text block, 1 = image block
                    for line in block.get("lines", [])
                    for span in line.get("spans", [])
                    if span.get("text", "").strip()
                ]

                if not spans_with_text:
                    continue

                sizes = sorted(s["size"] for s in spans_with_text)
                median_size = sizes[len(sizes) // 2]

                for span in spans_with_text:
                    text = span["text"]
                    size = span.get("size", median_size)
                    rgb = _int_color_to_rgb(span.get("color", 0))

                    if size < MIN_READABLE_FONT_SIZE:
                        flags.append(StructuralFlag(
                            flag_type="tiny_font",
                            page_number=page_index + 1,
                            snippet=text.strip()[:200],
                            detail=f"font size {size:.1f}pt (page median: {median_size:.1f}pt)",
                            confidence="high",
                        ))
                        continue  # don't double-flag the same span

                    delta = _contrast_delta(rgb)
                    if delta < MIN_CONTRAST_DELTA:
                        flags.append(StructuralFlag(
                            flag_type="low_contrast",
                            page_number=page_index + 1,
                            snippet=text.strip()[:200],
                            detail=f"text color RGB{tuple(round(c, 2) for c in rgb)}, "
                                   f"contrast delta {delta:.3f} from white",
                            confidence="medium",
                        ))

        return StructuralScanResult(suspected=len(flags) > 0, flags=flags)

    except Exception as e:
        # A scan failure should never crash the pipeline or silently look
        # like "nothing found" -- surface it explicitly so it's auditable.
        return StructuralScanResult(
            suspected=False,
            flags=[],
            skipped=True,
            skip_reason=f"structural scan failed: {e}",
        )