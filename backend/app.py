from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, save_summary, get_all_summaries, get_summaries_by_topic, search_summaries, create_folder, get_all_folders, assign_folder
from summarizer import summarize, client
import sqlite3

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
    folder_id = data.get('folder_id') or None
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
    if folder_id:
        conn = sqlite3.connect('research.db')
        c = conn.cursor()
        c.execute("SELECT id FROM summaries ORDER BY id DESC LIMIT 1")
        summary_id = c.fetchone()[0]
        conn.close()
        assign_folder(summary_id, folder_id)

    return jsonify({"summary": summary, "keywords": keywords, "topic": topic})


@app.route('/summaries', methods=['GET'])
def get_summaries():
    folder_id = request.args.get('folder_id')
    if folder_id:
        conn = sqlite3.connect('research.db')
        c = conn.cursor()
        c.execute("SELECT * FROM summaries WHERE folder_id = ? ORDER BY date_saved DESC", (folder_id,))
        summaries = c.fetchall()
        conn.close()
    else:
        summaries = get_all_summaries()
    return jsonify({"summaries": summaries})

@app.route('/summaries/topic/<topic>', methods=['GET'])
def get_by_topic(topic):
    topics = get_summaries_by_topic(topic)
    return jsonify({"summaries": topics})

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q')
    results = search_summaries(query)
    return jsonify({"results": results})

@app.route('/summaries/<int:id>', methods=['DELETE'])
def delete_summary(id):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute("DELETE FROM summaries WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"status" : "deleted"})

@app.route('/explain/<int:id>', methods=['GET'])
def explain_further(id):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute("SELECT * FROM summaries WHERE id = ?", (id,))
    explained = c.fetchone()
    conn.close()
    prompt = f"""
    
    INFORMATION: {explained[2]}, {explained[3]}, {explained[4]}
    Read the text and visit the URL, then explain what the information is about with key details left out in the summary.
    It should be very in depth, giving the user a true understanding of the information. Also act as if you are speaking directly to the user
    
    Length should be not too short nor too long, hitting the sweet spot which won't give too less info but also won't drive the user away.
    
    
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"explanation" : response.text})

@app.route('/folders/<int:id>/summary', methods=['GET'])
def folder_summary(id):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute("SELECT * FROM summaries WHERE folder_id = ?", (id,))
    summaries = c.fetchall()
    conn.close()

    if not summaries:
        return jsonify({"summary": "No summaries in this folder yet."})

    combined = "\n\n".join([
        f"Title: {row[2]}\nSummary: {row[3]}\nKeywords: {row[4]}"
        for row in summaries
    ])

    prompt = f"""
    You are a research assistant. A student has collected these research summaries in one folder:

    {combined}

    Please provide:
    1. An overall summary of what this folder is about
    2. The main themes and connections between the sources
    3. Key takeaways the student should remember

    Keep it concise and helpful.
    
    DONT USE "###"
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return jsonify({"summary": response.text})
    except Exception as e:
        return jsonify({"summary": f"Could not generate summary: {str(e)}"})


@app.route('/folders', methods = ['GET'])
def get_folders():
    folders = get_all_folders()
    return jsonify({"folders": folders})

@app.route('/folders', methods = ['POST'])
def add_folder():
    folder_name = request.json.get('folder_name')
    create_folder(folder_name)
    return jsonify({"status" : "created"})

@app.route('/summaries/<int:id>/folder', methods=['POST'])
def assign_to_folder(id):
    folder_id = request.json.get('folder_id')
    assign_folder(id, folder_id)
    return jsonify({"status": "assigned"})

if __name__ == "__main__":
    app.run(debug = True)
