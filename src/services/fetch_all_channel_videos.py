import json
import sys
import subprocess
import os

# Ensure UTF-8 output on Windows
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def fetch_all(channel_url="https://www.youtube.com/@merakiMusics"):
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--flat-playlist",
        "-J",
        channel_url
    ]
    
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        print(f"Error running yt-dlp: {result.stderr}", file=sys.stderr)
        sys.exit(1)
        
    data = json.loads(result.stdout)
    entries = data.get("entries", [])
    
    videos = []
    for e in entries:
        vid_id = e.get("id")
        title = e.get("title") or ""
        url = e.get("url") or f"https://www.youtube.com/watch?v={vid_id}"
        thumbnail = f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
        
        is_short = "#shorts" in title.lower() or "/shorts/" in url.lower() or (e.get("duration") and e.get("duration") <= 60)
        
        videos.append({
            "id": vid_id,
            "title": title,
            "description": e.get("description") or "",
            "publishedAt": e.get("upload_date") or "",
            "thumbnailUrl": thumbnail,
            "url": url,
            "views": e.get("view_count") or 0,
            "type": "short" if is_short else "song"
        })
        
    print(json.dumps(videos, ensure_ascii=False))

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/@merakiMusics"
    fetch_all(url)
