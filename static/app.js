document.getElementById("end").classList.add("hidden");

let mode = "wat";
let interval = null;
let paused = false;
let started = false;

let total = 60;
let current = 0;

// ---------------- MODE SWITCH ----------------

document.getElementById("wat").onclick = () => {
    if (!started) mode = "wat";
    updateMode();
};

document.getElementById("srt").onclick = () => {
    if (!started) mode = "srt";
    updateMode();
};

function updateMode() {
    document.getElementById("modeLabel").innerText = "MODE: " + mode.toUpperCase();

    document.getElementById("wat").classList.remove("active");
    document.getElementById("srt").classList.remove("active");
    document.getElementById(mode).classList.add("active");

    document.body.className = mode;
}


// ---------------- START ----------------

document.getElementById("start").onclick = async () => {
    if (started) return;

    started = true;
    paused = false;
    current = 0;

    document.getElementById("end").classList.add("hidden");
    document.getElementById("word").innerText = "Ready";
    document.getElementById("progress").innerText = "";

    document.getElementById("start").disabled = true;
    document.getElementById("pause").disabled = false;
    document.getElementById("stop").disabled = false;

    await fetch(`/start/${mode}`);

    document.getElementById("word").innerText = "";
    document.getElementById("progress").innerText = "";

    scheduleNext();
};

// ---------------- PAUSE ----------------

document.getElementById("pause").onclick = () => {
    if (!started) return;

    if (paused) {
        paused = false;
        document.getElementById("pause").innerText = "Pause";
        scheduleNext();
    } else {
        paused = true;
        document.getElementById("pause").innerText = "Resume";
        clearTimeout(interval);
    }
};

// ---------------- STOP ----------------

document.getElementById("stop").onclick = () => {
    clearTimeout(interval);
    started = false;
    paused = false;

    document.getElementById("word").innerText = "Ready";
    document.getElementById("progress").innerText = "";

    document.getElementById("start").disabled = false;
    document.getElementById("pause").disabled = true;
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").innerText = "Pause";
};

// ---------------- TIMER ----------------

function scheduleNext() {
    let delay = mode === "wat" ? 15000 : 30000;

    interval = setTimeout(async () => {
        if (paused) return;

        const res = await fetch("/next");
        const data = await res.json();

        if (data.done) {
            finish();
            return;
        }

        current = data.count;
        document.getElementById("word").innerText = data.word;
        document.getElementById("progress").innerText = `${current} / ${total}`;

        scheduleNext();
    }, delay);
}

// ---------------- FINISH ----------------

function finish() {
    clearTimeout(interval);
    started = false;

    document.getElementById("end").classList.remove("hidden");
    document.getElementById("summary").innerText =
        mode === "wat"
            ? "WAT • 60 Words • 15 Minutes"
            : "SRT • 60 Situations • 30 Minutes";


    document.getElementById("start").disabled = false;
    document.getElementById("pause").disabled = true;
    document.getElementById("stop").disabled = true;
    document.getElementById("debriefTitle").innerText = "TEST COMPLETE";

}

// ---------------- HISTORY ----------------

document.getElementById("historyBtn").onclick = async () => {
    const res = await fetch("/history");
    const data = await res.json();

    const box = document.getElementById("history");
    box.innerHTML = "";

    if (mode === "wat") {
        box.className = "history-wat";
        data.forEach(w => {
            const s = document.createElement("span");
            s.innerText = w;
            box.appendChild(s);
        });
    } else {
        box.className = "history-srt";
        data.forEach((w, i) => {
            const div = document.createElement("div");
            div.innerText = `${i + 1}. ${w}`;
            box.appendChild(div);
        });
    }
};

// ---------------- RESET ----------------

document.getElementById("resetBtn").onclick = async () => {
    await fetch("/reset");

    clearTimeout(interval);
    started = false;
    paused = false;
    current = 0;

    document.getElementById("end").classList.add("hidden");
    document.getElementById("word").innerText = "Ready";
    document.getElementById("progress").innerText = "";
    document.getElementById("history").innerHTML = "";

    document.getElementById("start").disabled = false;
    document.getElementById("pause").disabled = true;
    document.getElementById("stop").disabled = true;
    document.getElementById("pause").innerText = "Pause";
};

// ---------------- INIT ----------------

updateMode();
