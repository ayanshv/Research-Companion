import sqlite3


def init_db():
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT,
            title TEXT,
            summary TEXT,
            keywords TEXT,
            topic TEXT,
            date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        c.execute("ALTER TABLE summaries ADD COLUMN folder_id INTEGER")
    except:
        pass

    conn.commit()
    conn.close()

def create_folder(folder_name):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute(
        "INSERT INTO folders (name) VALUES (?)",
        (folder_name,))

    conn.commit()
    conn.close()

def get_all_folders():
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute(
        "SELECT * FROM folders ORDER BY date_created DESC"
    )
    rows = c.fetchall()
    conn.close()
    return rows


def assign_folder(summary_id, folder_id):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute(
        "UPDATE summaries SET folder_id = ? WHERE id = ?",
        (folder_id, summary_id))

    conn.commit()
    conn.close()

def save_summary(url, title, summary, keywords, topic):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute(
        "INSERT INTO summaries (url, title, summary, keywords, topic) VALUES (?, ?, ?, ?, ?)",
        (url, title, summary, keywords, topic)
    )
    conn.commit()
    conn.close()

def get_all_summaries():
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute("SELECT * FROM summaries ORDER BY date_saved DESC")
    rows = c.fetchall()
    conn.close()
    return rows

def get_summaries_by_topic(topic):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute("SELECT * FROM summaries WHERE topic = ? ORDER BY date_saved DESC", (topic,))
    rows = c.fetchall()
    conn.close()
    return rows

def search_summaries(query):
    conn = sqlite3.connect('research.db')
    c = conn.cursor()
    c.execute(
        "SELECT * FROM summaries WHERE summary LIKE ? OR title LIKE ? ORDER BY date_saved DESC",
        (f'%{query}%', f'%{query}%')
    )
    rows = c.fetchall()
    conn.close()
    return rows



if __name__ == "__main__":
    init_db()
    print("Database created!")