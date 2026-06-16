from flask import Flask, jsonify, render_template, request
import urllib.request
import xml.etree.ElementTree as ET
import html
import re

app = Flask(__name__)

# Cache releases to prevent excessive external requests and rate limits
cached_releases = None

def fetch_and_parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title_el = entry.find('atom:title', ns)
        link_el = entry.find('atom:link', ns)
        content_el = entry.find('atom:content', ns)
        
        date_str = title_el.text if title_el is not None else "Unknown Date"
        
        link = ""
        if link_el is not None:
            link = link_el.attrib.get('href', '')
            
        content_html = content_el.text if content_el is not None else ""
        
        # Split individual updates inside the entry
        parts = re.split(r'(?i)<h3>(.*?)</h3>', content_html)
        
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                update_type = parts[i].strip()
                update_content = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # Get plain text of content (for Twitter sharing pre-fill)
                plain_text = re.sub(r'<[^>]+>', '', update_content)
                plain_text = html.unescape(plain_text)
                plain_text = re.sub(r'\s+', ' ', plain_text).strip()
                
                entries.append({
                    "date": date_str,
                    "type": update_type,
                    "content_html": update_content,
                    "content_text": plain_text,
                    "link": link
                })
        else:
            plain_text = re.sub(r'<[^>]+>', '', content_html)
            plain_text = html.unescape(plain_text)
            plain_text = re.sub(r'\s+', ' ', plain_text).strip()
            
            entries.append({
                "date": date_str,
                "type": "Update",
                "content_html": content_html,
                "content_text": plain_text,
                "link": link
            })
            
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    global cached_releases
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if cached_releases is None or force_refresh:
        try:
            cached_releases = fetch_and_parse_feed()
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify(cached_releases)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
