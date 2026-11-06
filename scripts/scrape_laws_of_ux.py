import urllib.request
import ssl
import json
import re
import os
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

laws_slugs = [
    'aesthetic-usability-effect',
    'choice-overload',
    'chunking',
    'cognitive-bias',
    'cognitive-load',
    'doherty-threshold',
    'fittss-law',
    'flow',
    'goal-gradient-effect',
    'hicks-law',
    'jakobs-law',
    'law-of-common-region',
    'law-of-proximity',
    'law-of-pr%C3%A4gnanz',
    'law-of-similarity',
    'law-of-uniform-connectedness',
    'mental-model',
    'millers-law',
    'occams-razor',
    'paradox-of-the-active-user',
    'pareto-principle',
    'parkinsons-law',
    'peak-end-rule',
    'postels-law',
    'selective-attention',
    'serial-position-effect',
    'teslers-law',
    'von-restorff-effect',
    'working-memory',
    'zeigarnik-effect'
]

article_slugs = [
    '2024/familiar-vs-novel',
    '2024/onboarding-for-active-users',
    '2024/teslers-law',
    '2020/ux-psychology-google-search',
    '2020/peak-end-rule',
    '2018/the-psychology-of-design',
    '2017/designing-with-occams-razor',
    '2015/design-principles-for-reducing-cognitive-load'
]

def fetch_markdown(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_law_markdown(raw_md, slug):
    lines = raw_md.split('\n')
    
    # Title
    title = ""
    for line in lines:
        if line.startswith('# '):
            title = line[2:].strip()
            break
            
    # Metadata at bottom
    category = "General"
    tags = []
    source_url = f"https://lawsofux.com/{slug}/"
    for line in lines:
        if line.startswith('Category:'):
            category = line.replace('Category:', '').strip()
        elif line.startswith('Tags:'):
            tags = [t.strip() for t in line.replace('Tags:', '').split(',') if t.strip()]
        elif line.startswith('Source:'):
            source_url = line.replace('Source:', '').strip()
            
    # Extract sections using regex
    # Summary is text between first # Title and ### Takeaways
    summary_match = re.search(r'# [^\n]+\n\n(.*?)(?=\n\n###|\n###)', raw_md, re.DOTALL)
    summary = ""
    if summary_match:
        # Sometimes summary is repeated twice in the Hugo md output
        raw_summary = summary_match.group(1).strip()
        parts = [p.strip() for p in raw_summary.split('\n\n') if p.strip()]
        if parts:
            summary = parts[0]
            
    # Takeaways
    takeaways = []
    takeaways_match = re.search(r'### Takeaways\s*\n\n?(.*?)(?=\n###|\n---)', raw_md, re.DOTALL)
    if takeaways_match:
        tk_text = takeaways_match.group(1)
        # Bullet items: -   or *
        bullets = re.split(r'\n\s*[-*]\s+', '\n' + tk_text)
        for b in bullets:
            clean_b = ' '.join(b.strip().split())
            if clean_b:
                takeaways.append(clean_b)
                
    # Examples
    examples = []
    examples_match = re.search(r'### Examples\s*\n\n?(.*?)(?=\n### Origins|\n### Further Reading|\n---)', raw_md, re.DOTALL)
    if examples_match:
        ex_text = examples_match.group(1).strip()
        # Find ### Subsection titles and contents
        sub_ex = re.findall(r'###\s+([^\n]+)\s*\n\n?(.*?)(?=\n###|\Z)', ex_text, re.DOTALL)
        if sub_ex:
            for ex_title, ex_body in sub_ex:
                examples.append({
                    "title": ex_title.strip(),
                    "description": ' '.join(ex_body.strip().split())
                })
        else:
            examples.append({"title": "Example", "description": ex_text})

    # Origins
    origins = ""
    origins_match = re.search(r'### Origins\s*\n\n?(.*?)(?=\n### Further Reading|\n---)', raw_md, re.DOTALL)
    if origins_match:
        raw_origins = origins_match.group(1).strip()
        # Remove trailing "Source" link if present
        raw_origins = re.sub(r'\s*\[?Source\]?\(?[^\)]*\)?\s*$', '', raw_origins).strip()
        origins = ' '.join(raw_origins.split())
        
    # Further Reading
    reading = []
    reading_match = re.search(r'### Further Reading\s*\n\n?(.*?)(?=\n---|\n\s*Buy Large Format Poster|\Z)', raw_md, re.DOTALL)
    if reading_match:
        rd_text = reading_match.group(1).strip()
        # Matches patterns like ###\n    Title\n\n  Author/Source
        items = re.split(r'###\s*', rd_text)
        for item in items:
            item_lines = [l.strip() for l in item.split('\n') if l.strip() and not l.strip().startswith('Buy Large') and not l.strip().startswith('Download free')]
            if item_lines:
                item_title = item_lines[0]
                item_author = item_lines[1] if len(item_lines) > 1 else ""
                reading.append({
                    "title": item_title,
                    "source": item_author
                })

    return {
        "slug": slug.replace('%C3%A4', 'pragnanz'),
        "url": source_url,
        "title": title,
        "category": category,
        "tags": tags,
        "definition": summary,
        "takeaways": takeaways,
        "examples": examples,
        "origins": origins,
        "further_reading": reading,
        "raw_markdown": raw_md
    }

def main():
    print("Scraping 30 Laws of UX...")
    laws_data = []
    for slug in laws_slugs:
        url = f"https://lawsofux.com/{slug}/index.md"
        raw = fetch_markdown(url)
        if raw:
            parsed = parse_law_markdown(raw, slug)
            laws_data.append(parsed)
            print(f"Processed: {parsed['title']}")
        time.sleep(0.15)
        
    print(f"\nScraping {len(article_slugs)} articles...")
    articles_data = []
    for art_slug in article_slugs:
        url = f"https://lawsofux.com/articles/{art_slug}/index.md"
        raw = fetch_markdown(url)
        if raw:
            title_match = re.search(r'# ([^\n]+)', raw)
            title = title_match.group(1).strip() if title_match else art_slug
            articles_data.append({
                "slug": art_slug,
                "url": f"https://lawsofux.com/articles/{art_slug}/",
                "title": title,
                "content": raw
            })
            print(f"Processed article: {title}")
        time.sleep(0.15)

    os.makedirs('/Users/mac/Artisan/docs', exist_ok=True)
    
    # Save structured JSON
    output_json = {
        "source": "https://lawsofux.com/",
        "author": "Jon Yablonski",
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_laws": len(laws_data),
        "total_articles": len(articles_data),
        "laws": laws_data,
        "articles": [
            {"slug": a["slug"], "url": a["url"], "title": a["title"]} for a in articles_data
        ]
    }
    
    json_path = '/Users/mac/Artisan/docs/laws_of_ux.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_json, f, indent=2, ensure_ascii=False)
    print(f"Saved JSON to {json_path}")
    
if __name__ == '__main__':
    main()
