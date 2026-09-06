import sys
import subprocess
import json
import os

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def export_catalog(channel_url="https://www.youtube.com/@merakiMusics"):
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--flat-playlist",
        "--print", "%(id)s\t%(title)s\t%(duration)s\t%(view_count)s\t%(upload_date)s",
        channel_url
    ]
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
        
    lines = result.stdout.strip().split('\n')
    videos = []
    
    for line in lines:
        parts = line.split('\t')
        if len(parts) >= 2:
            vid_id = parts[0].strip()
            title = parts[1].strip()
            
            duration_str = parts[2].strip() if len(parts) > 2 else "NA"
            duration = int(duration_str) if duration_str.isdigit() else None
            
            views_str = parts[3].strip() if len(parts) > 3 else "0"
            views = int(views_str) if views_str.isdigit() else 0
            
            upload_date = parts[4].strip() if len(parts) > 4 and parts[4].strip() != "NA" else None
            
            is_short = "#shorts" in title.lower() or (duration is not None and duration <= 60) or (duration is None and "short" in title.lower())
            
            videos.append({
                "id": vid_id,
                "title": title,
                "description": "",
                "publishedAt": upload_date or "2026-08-01T00:00:00Z",
                "thumbnailUrl": f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg",
                "url": f"https://www.youtube.com/watch?v={vid_id}" if not is_short else f"https://www.youtube.com/shorts/{vid_id}",
                "views": views,
                "duration": duration,
                "type": "short" if is_short else "song"
            })
            
    print(json.dumps(videos, ensure_ascii=False))

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/@merakiMusics"
    export_catalog(url)
