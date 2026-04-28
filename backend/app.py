from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, save_summary, get_all_summaries, get_summaries_by_topic, search_summaries
from summarizer import summarize

init_db()

app = Flask(__name__)
CORS(app)

@app.route('/ping')
def ping():
    return jsonify ({"status" : "ok"})


@app.route('/summarize', methods=['POST'])
def summarize_page():
    data = request.json
    url = data.get('url')
    title = data.get('title')
    content = data.get('content')

    result = summarize(url, title, content)

    # parse Gemini's response
    summary = ""
    keywords = ""
    topic = ""

    for line in result.split('\n'):
        if line.startswith('SUMMARY:'):
            summary = line.replace('SUMMARY:', '').strip()
        elif line.startswith('KEYWORDS:'):
            keywords = line.replace('KEYWORDS:', '').strip()
        elif line.startswith('TOPIC:'):
            topic = line.replace('TOPIC:', '').strip()

    save_summary(url, title, summary, keywords, topic)

    return jsonify({"summary": summary, "keywords": keywords, "topic": topic})

@app.route('/summaries', methods=['GET'])
def get_summaries():
    summary = get_all_summaries()
    return jsonify({"summaries": summary})

@app.route('/summaries/topic/<topic>', methods=['GET'])
def get_by_topic(topic):
    topics = get_summaries_by_topic(topic)
    return jsonify({"summaries": topics})

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q')
    results = search_summaries(query)
    return jsonify({"results": results})

if __name__ == "__main__":
    app.run(debug = True)
