import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Palette
    COLOR_PRIMARY = RGBColor(26, 16, 60)      # Deep Midnight Indigo
    COLOR_ACCENT = RGBColor(224, 27, 112)     # Neon Pink / Magenta
    COLOR_CYAN = RGBColor(0, 150, 180)        # Darker Cyan for readability
    COLOR_DARK = RGBColor(33, 37, 41)         # Body text dark
    COLOR_MUTED = RGBColor(100, 116, 139)     # Gray text

    # Base Normal Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = COLOR_DARK
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(6)

    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(2)
    run_badge = title_p.add_run("MERAKI MUSICS • AUTOMATED MARKETING & SEO GUIDE\n")
    run_badge.font.size = Pt(10)
    run_badge.font.bold = True
    run_badge.font.color.rgb = COLOR_ACCENT

    run_title = title_p.add_run("Meraki Musics SEO & Organic Distribution Bot")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("A Complete Operational Guide: What It Does, How It Grows Your Audience, and Your 5-Minute Routine")
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_MUTED

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(18)
    p_div_border = parse_xml(r'<w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:bottom w:val="single" w:sz="12" w:space="1" w:color="E01B70"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(p_div_border)

    def add_heading_1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = COLOR_ACCENT
        return h

    def add_callout(text, bold_prefix=""):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        # Add light background shading & left border
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(r'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="clear" w:color="auto" w:fill="F8FAFC"/>')
        borders = parse_xml(r'<w:tcBorders xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:space="0" w:color="0096B4"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
        tcPr.append(shd)
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(6)
        cp.paragraph_format.space_after = Pt(6)
        cp.paragraph_format.left_indent = Inches(0.15)
        cp.paragraph_format.right_indent = Inches(0.15)
        if bold_prefix:
            br = cp.add_run(bold_prefix + " ")
            br.font.bold = True
            br.font.color.rgb = COLOR_CYAN
        cr = cp.add_run(text)
        cr.font.size = Pt(10.5)

        # Empty spacing after table
        sp = doc.add_paragraph()
        sp.paragraph_format.space_after = Pt(6)

    # --- SECTION 1: EXECUTIVE SUMMARY ---
    add_heading_1("1. Executive Summary")
    doc.add_paragraph(
        "The Meraki Musics SEO & Organic Distribution Bot is an automated marketing assistant designed "
        "specifically for your music brand (@merakiMusics, @merakimusicsofficial). "
        "Independent music faces a major hurdle on modern platforms: when you upload a song with basic metadata, "
        "algorithms (YouTube, TikTok, Instagram, Google) lack sufficient text data and external signals to identify your target audience."
    )
    doc.add_paragraph(
        "This bot solves that cold-start problem by automating three core engines: search engine optimization (SEO), "
        "short-form visual hooks, and authoritative web backlinks—all operating completely free without paid advertising or expensive API fees."
    )

    # --- SECTION 2: WHAT THE BOT IS DOING ---
    add_heading_1("2. What the Bot is Doing Behind the Scenes")
    doc.add_paragraph(
        "The bot runs as a lightweight, non-intrusive service in your local project folder (F:\\SEO Bot). "
        "Here is what happens under the hood:"
    )

    add_heading_2("A. Full Channel Catalog Tracking (All 57 Videos & Shorts)")
    doc.add_paragraph(
        "• Complete Ingestion: Rather than being limited to the 15-item public RSS feed, the bot ingests your channel's "
        "complete catalog of 57 releases (12 full songs and 45 vertical shorts/reels) using a high-speed extraction engine."
    )
    doc.add_paragraph(
        "• State Management (catalog.json): It maintains a local database tracking all 57 videos, view counts, "
        "ratings, SEO generation states, and promotional timestamps."
    )

    add_heading_2("B. AI & Heuristic SEO Generation Engine")
    doc.add_paragraph(
        "For every song, clip, or reel, the bot generates a multi-platform promotional package:"
    )
    doc.add_paragraph(
        "• YouTube SEO Package: High-CTR A/B test titles, a 500-character bank of search-volume tags, "
        "rich descriptions structured with lyrics and LSI keywords, and engagement-driving pinned comments."
    )
    doc.add_paragraph(
        "• TikTok & Instagram Reels Hooks: 3-second pattern-interrupt visual text hooks designed to stop fast-scrolling users, "
        "search-optimized captions, and 4-tier hashtag stacks (#synthtok, #synthwave, #80smusic, #nightdrive)."
    )
    doc.add_paragraph(
        "• Reddit & Community Syndication: Pre-formatted, rules-compliant posts for r/synthwave, r/retrowave, r/listentothis, "
        "and r/promoteyourmusic with proper brackets and flairs to ensure your links are welcomed rather than flagged as spam."
    )
    doc.add_paragraph(
        "• Pinterest & Micro-Blogs: Aesthetic Rich Pin blueprints, automated RSS feeds (dist/rss.xml), and 300-word Tumblr/Medium articles."
    )

    add_heading_2("C. Static SEO Web Hub & Instant Search Indexer")
    doc.add_paragraph(
        "• 58 Standalone Web Pages: Inside F:\\SEO Bot\\dist, the bot compiles individual, responsive HTML landing pages "
        "for every single track in your catalog."
    )
    doc.add_paragraph(
        "• Google Schema.org Markup: Each page contains full JSON-LD structured data (MusicRecording, VideoObject, MusicGroup). "
        "This tells Google Search exactly what your song is, qualifying it for Google Video Carousels and Rich Snippets."
    )
    doc.add_paragraph(
        "• IndexNow Protocol Dispatch: Whenever a page is generated or updated, the bot notifies Microsoft Bing, Yandex, "
        "and Seznam via the free IndexNow protocol, pushing your pages into search engine indexes within minutes."
    )

    add_heading_2("D. 100% Zero-Touch Autopilot Mode")
    doc.add_paragraph(
        "When you run 'run_autopilot.bat', the bot runs 24/7 on autopilot. It checks hourly for new uploads, "
        "auto-generates SEO metadata, rotates daily spotlight tracks, rebuilds the static hub, and notifies search engines automatically."
    )

    # --- SECTION 3: HOW IT GROWS YOUR AUDIENCE ---
    add_heading_1("3. How This Directly Helps Your Songs Grow")
    doc.add_paragraph(
        "Modern music discovery is governed by four algorithmic growth levers. The bot is specifically engineered to target each one:"
    )

    add_callout(
        "When YouTube has only a song title to go by, it has to guess who might like it. By populating 500 characters of tags, "
        "detailed descriptions, and lyrics, the bot teaches YouTube's recommendation engine to group your songs with established "
        "synthwave artists (such as The Midnight, Gunship, and Timecop1983). Furthermore, when listeners search for specific lyrics "
        "on Google, your videos are indexed to appear.",
        bold_prefix="Engine 1: YouTube Search & Suggested Videos."
    )

    add_callout(
        "Short-form video is currently the #1 driver of music streaming. However, viewers swipe past audio within 2 seconds if the visual "
        "text doesn't hook them. The bot generates relatable, narrative-driven 3-second text hooks (e.g. 'POV: You found the synthwave song "
        "made for 2 AM drives...'). Additionally, Gen Z heavily uses TikTok search; our keyword-optimized captions help your clips rank for terms "
        "like 'night drive synth songs'.",
        bold_prefix="Engine 2: TikTok & Instagram Reels Discovery."
    )

    add_callout(
        "YouTube heavily weights 'external authority'. When your video is embedded on external web pages and shared on external domains, "
        "YouTube's algorithm treats the video as high-value content and boosts its impressions across user homepages. The static web hub in dist/ "
        "provides this external embed foundation.",
        bold_prefix="Engine 3: External Embeds & Google Rich Snippets."
    )

    add_callout(
        "Synthwave, Retrowave, and Cyberpunk fans are concentrated in dedicated subreddits and Pinterest boards. "
        "They love discovering independent artists, but despise generic spam links. The bot generates 'creator-first' backstory posts "
        "that invite discussion on analog synth tones and 80s hardware, sparking genuine listener engagement.",
        bold_prefix="Engine 4: Targeted Community Syndication."
    )

    # --- SECTION 4: WHAT YOU NEED TO DO ---
    add_heading_1("4. What You Need to Do On Your End")
    doc.add_paragraph(
        "You do not need to spend hours learning SEO or marketing. The bot produces copy-paste-ready assets. "
        "Here are your quick checklists:"
    )

    add_heading_2("Workflow A: When You Upload a New Song or Reel (3 to 5 Minutes)")
    doc.add_paragraph("Step 1: Open the Dashboard by double-clicking 'run_dashboard.bat' (or navigate to http://localhost:3000).")
    doc.add_paragraph("Step 2: Click the 'Sync Feed' button at the top. The bot will ingest your new release and build its complete SEO package.")
    doc.add_paragraph("Step 3: Go to the 'Catalog & SEO Studio' tab, select your track, and update YouTube Studio:")
    doc.add_paragraph("       • Click 'Copy Title' → Paste into YouTube Studio Title.")
    doc.add_paragraph("       • Click 'Copy Tags' → Paste into YouTube Studio Tags.")
    doc.add_paragraph("       • Click 'Copy Full Description' → Paste into YouTube Studio Description.")
    doc.add_paragraph("       • Click 'Copy Comment' → Post it as a comment on your video and click 'Pin'.")
    doc.add_paragraph("Step 4: For TikTok and Instagram Reels:")
    doc.add_paragraph("       • Switch to the 'TikTok & Reels' sub-tab.")
    doc.add_paragraph("       • Add the recommended 3-second hook as on-screen text at the beginning of your video.")
    doc.add_paragraph("       • Click 'Copy Caption' and paste it into your TikTok/Instagram post.")

    add_heading_2("Workflow B: Daily Spotlight Routine (1 to 2 Minutes)")
    doc.add_paragraph("Step 1: Keep 'run_daemon.bat' running in the background, or check the 'Today’s Spotlight' card on http://localhost:3000.")
    doc.add_paragraph("Step 2: Note which track is in spotlight rotation.")
    doc.add_paragraph("Step 3: Switch to the 'Reddit Syndication' tab in the studio, click 'Copy Post', and paste it into the weekly promo thread in r/synthwave or r/promoteyourmusic.")

    add_heading_2("Workflow C: One-Time Setup for Maximum SEO Backlinks (Free Hosting)")
    doc.add_paragraph("To make your static SEO hub live on the open web for free:")
    doc.add_paragraph("1. Create a free GitHub account (if you don't have one) and create a repository named 'merakimusics.github.io'.")
    doc.add_paragraph("2. Upload the files inside your 'F:\\SEO Bot\\dist' directory to this repository.")
    doc.add_paragraph("3. In repository Settings > Pages, select the 'main' branch and save.")
    doc.add_paragraph("4. All 16+ pages are now permanently live, indexed by search engines, and generating authoritative embeds to your YouTube channel.")

    # --- SECTION 5: COMMANDS & FILE LOCATIONS ---
    add_heading_1("5. Quick Reference & Commands")

    tbl_ref = doc.add_table(rows=1, cols=2)
    tbl_ref.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = tbl_ref.rows[0].cells
    hdr[0].text = "Action / Tool"
    hdr[1].text = "How to Access / Execute"
    for c in hdr:
        shd = parse_xml(r'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="clear" w:color="auto" w:fill="1A103C"/>')
        c._tc.get_or_add_tcPr().append(shd)
        for p in c.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    data = [
        ("Run 100% Autopilot Mode", "Double-click 'run_autopilot.bat' (Runs 24/7 silently)"),
        ("Open Control Dashboard", "Double-click 'run_dashboard.bat' or visit http://localhost:3000"),
        ("Preview Static Web Hub", "Visit http://localhost:3000/preview"),
        ("Run Autopilot Cycle (CLI)", "node src/cli.js autopilot"),
        ("Sync Catalog (CLI)", "node src/cli.js sync"),
        ("Optimize All Tracks (CLI)", "node src/cli.js optimize-all"),
        ("Re-build Static Site (CLI)", "node src/cli.js build-site"),
        ("Check Catalog Stats (CLI)", "node src/cli.js stats")
    ]

    for row_idx, (act, how) in enumerate(data):
        row = tbl_ref.add_row().cells
        row[0].text = act
        row[1].text = how
        bg_color = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
        for c in row:
            shd = parse_xml(f'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="clear" w:color="auto" w:fill="{bg_color}"/>')
            c._tc.get_or_add_tcPr().append(shd)
            for p in c.paragraphs:
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)

    # Footer Notes
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rf = p_foot.add_run("Generated for Meraki Musics • Where the pulse of the machine meets the human soul.")
    rf.font.size = Pt(9.5)
    rf.font.italic = True
    rf.font.color.rgb = COLOR_MUTED

    output_path = r"F:\SEO Bot\Meraki_Musics_SEO_Bot_Complete_Guide.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
