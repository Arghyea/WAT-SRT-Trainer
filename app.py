from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_words(filename):
    with open(filename, "r") as f:
        return [line.strip() for line in f if line.strip()]

wat_words = load_words("./wat_words.txt")
srt_words = load_words("./srt_prompts.txt")

# session only exists AFTER start
current_session = None


@app.get("/start/{mode}")
def start(mode: str):
    global current_session

    if mode == "wat":
        words = random.sample(wat_words, min(60, len(wat_words)))
    else:
        words = random.sample(srt_words, min(60, len(srt_words)))

    current_session = {
        "mode": mode,
        "words": words,
        "index": 0
    }

    return {"status": "started"}


@app.get("/next")
def next_word():
    global current_session

    if current_session is None:
        return {"done": True}

    idx = current_session["index"]

    if idx >= len(current_session["words"]):
        return {"done": True}

    word = current_session["words"][idx]
    current_session["index"] += 1

    return {
        "done": False,
        "word": word,
        "count": current_session["index"]
    }


@app.get("/history")
def history():
    if current_session is None:
        return []
    return current_session["words"]

@app.get("/reset")
def reset():
    global current_session
    current_session = None
    return {"status": "reset"}


from fastapi.responses import FileResponse

# Mount static files FIRST
app.mount("/static", StaticFiles(directory="static"), name="static")

# Then define root route
@app.get("/")
def root():
    return FileResponse("static/index.html", headers={
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    })

import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
