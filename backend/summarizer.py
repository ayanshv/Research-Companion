from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize(url, title, content):
    prompt = f"""
    You are a research companion attempting to help a student organize the pages and website they visit (their research)
    
    IGNORE ANY MEDIA CONTENT (eg. PHOTOS, VIDEOS, etc.), LOOK ONLY FOR TEXT
    
    Page title: {title}
    URL: {url}
    Content: {content[:3000]}

    Please provide:
    1. A 3-5 sentence summary of the main points
    2. 5-8 keywords separated by commas
    3. The main argument or conclusion in one sentence
    4. Suggested topic folder (e.g. Biology, History, Technology)

    Format your response exactly like this:
    SUMMARY: ...
    KEYWORDS: ...
    MAIN ARGUMENT: ...
    TOPIC: ...
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return response.text


def summarize_with_key(url, title, content, api_key):
    from google import genai
    user_client = genai.Client(api_key=api_key)
    prompt = f"""
    You are a research assistant attempting to help a student organize the pages and websites they visit (their research)

    Page title: {title}
    URL: {url}
    Content: {content[:3000]}

    Please provide:
    1. A 3-5 sentence summary of the main points
    2. 5-8 keywords separated by commas
    3. The main argument or conclusion in one sentence
    4. Suggested topic folder (e.g. Biology, History, Technology)

    Format your response exactly like this:
    SUMMARY: ...
    KEYWORDS: ...
    MAIN ARGUMENT: ...
    TOPIC: ...
    """
    response = user_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return response.text