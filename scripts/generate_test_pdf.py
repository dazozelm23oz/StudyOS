import os
import sys
from PIL import Image, ImageDraw
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def create_sample_image(path):
    img = Image.new('RGB', (400, 200), color=(30, 41, 59))
    draw = ImageDraw.Draw(img)
    # Draw geometric academic diagrams
    draw.rectangle([20, 20, 380, 180], outline=(56, 189, 248), width=3)
    draw.line([20, 100, 380, 100], fill=(148, 163, 184), width=1)
    draw.ellipse([50, 40, 150, 160], outline=(168, 85, 247), width=2)
    draw.ellipse([250, 40, 350, 160], outline=(34, 197, 94), width=2)
    img.save(path)

def generate_500_page_pdf(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img_path = "/tmp/academic_diagram.png"
    create_sample_image(img_path)

    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    total_pages = 500
    print(f"Generating real {total_pages}-page PDF with bookmarks, images, and text...")

    for page_num in range(1, total_pages + 1):
        # Create Bookmark & TOC Entry for units/chapters
        bookmark_name = f"page_{page_num}"
        c.bookmarkPage(bookmark_name)

        if page_num == 1:
            c.addOutlineEntry("StudyOS Comprehensive Academic Syllabus", bookmark_name, level=0)
        elif page_num % 50 == 1:
            chapter_num = (page_num // 50) + 1
            c.addOutlineEntry(f"Chapter {chapter_num}: Advanced Academic Systems (Page {page_num})", bookmark_name, level=0)
        elif page_num % 10 == 1:
            section_num = (page_num // 10) + 1
            c.addOutlineEntry(f"Section {section_num}: Analysis and Verification (Page {page_num})", bookmark_name, level=1)

        # Page Header
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(colors.HexColor("#0f172a"))
        c.drawString(54, height - 54, f"StudyOS Research Compendium — Volume IV")
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#64748b"))
        c.drawRightString(width - 54, height - 54, f"Page {page_num} of {total_pages}")
        c.line(54, height - 60, width - 54, height - 60)

        # Page Content
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(colors.HexColor("#1e293b"))
        c.drawString(54, height - 100, f"Module Reference: Segment {page_num:03d}")

        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor("#334155"))
        text_lines = [
            f"This is an authenticated, real content page generated for StudyOS offline stress testing.",
            f"Index reference: #{page_num * 1024} | Deterministic verification token: SHA256-REF-{page_num:04d}",
            f"The module explores concurrent PDF rendering, Web Audio synthesis pipelines, and localized SQLite persistence.",
            f"No telemetry, remote cloud handshakes, or third-party analytical pipelines are permitted during execution.",
            f"All state transformations must remain 100% offline and resilient to process interruption."
        ]
        y_pos = height - 130
        for line in text_lines:
            c.drawString(54, y_pos, line)
            y_pos -= 18

        # Embed Image every few pages
        if page_num % 5 == 0:
            c.drawImage(img_path, 54, y_pos - 150, width=300, height=140)
            c.setFont("Helvetica-Oblique", 9)
            c.setFillColor(colors.HexColor("#64748b"))
            c.drawString(54, y_pos - 165, f"Figure {page_num}.1: Atmospheric and procedural signal pipeline schematic.")
            y_pos -= 190

        # Footer
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#94a3b8"))
        c.drawString(54, 36, f"STUDYOS-OFFLINE-TESTING-CORPUS • VERIFIED FEDORA KDE HOST")
        c.drawRightString(width - 54, 36, f"DOC_ID: CORPUS-500P-BUILD")
        c.line(54, 48, width - 54, 48)

        c.showPage()

        if page_num % 100 == 0 or page_num == total_pages:
            print(f"Generated {page_num}/{total_pages} pages...")

    c.save()
    file_size = os.path.getsize(output_path)
    print(f"Successfully generated {output_path} ({file_size / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    out = "data/testing/500_pages.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    generate_500_page_pdf(out)
