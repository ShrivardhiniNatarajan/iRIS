function transcribeAudio() {
    let file = document.getElementById("audioFile").files[0];

    if (!file) {
        alert("Please upload an audio file first!");
        return;
    }

    document.getElementById("transcription").value =
        "transcription";
}

function summarizeText() {
    let text = document.getElementById("transcription").value;

    if (text.trim() === "") {
        alert("No transcription available!");
        return;
    }

    document.getElementById("summary").value =
        "Summary section";
}
