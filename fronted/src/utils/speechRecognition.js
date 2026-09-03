let recognition = null;
let shouldRestart = false;
let restartTimer = null;

export const startSpeechRecognition = ({
    onStart,
    onResult,
    onError,
    onEnd
}) => {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.log("Speech Recognition not supported");
        return null;
    }

    if (recognition) {
        console.log("Recognition already running");
        return recognition;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    shouldRestart = true;

    recognition.onstart = () => {
        console.log("AI Listening Started");

        if (onStart) {
            onStart();
        }
    };

    recognition.onresult = (event) => {

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const text =
                event.results[i][0].transcript.trim();

            console.log(
                "RECOGNIZED TEXT:",
                text
            );

            if (
                event.results[i].isFinal &&
                text
            ) {

                console.log(
                    "FINAL TEXT:",
                    text
                );

                if (onResult) {
                    onResult(text);
                }
            }
        }
    };

    recognition.onerror = (event) => {

        console.log(
            "Speech Recognition Error:",
            event.error
        );

        // no-speech ko fatal error mat mano
        if (event.error !== "no-speech") {

            if (onError) {
                onError(event.error);
            }
        }
    };

    recognition.onend = () => {

        console.log(
            "AI Listening Ended"
        );

        if (onEnd) {
            onEnd();
        }

        if (!shouldRestart) {
            recognition = null;
            return;
        }

        clearTimeout(restartTimer);

        restartTimer = setTimeout(() => {

            if (
                shouldRestart &&
                recognition
            ) {

                try {

                    console.log(
                        "Restarting Speech Recognition"
                    );

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Restart error:",
                        error
                    );
                }
            }

        }, 1000);
    };

    try {

        recognition.start();

        console.log(
            "Speech Recognition Started Successfully"
        );

    } catch (error) {

        console.log(
            "Speech Recognition Start Error:",
            error
        );
    }

    return recognition;
};

export const stopSpeechRecognition = (
    recognitionInstance
) => {

    console.log(
        "STOP SPEECH RECOGNITION"
    );

    // Restart completely band
    shouldRestart = false;

    // Pending restart timer cancel
    clearTimeout(restartTimer);

    if (recognitionInstance) {

        try {

            // IMPORTANT:
            // onresult ko null mat karo
            // taaki final speech result process ho sake.

            recognitionInstance.stop();

        } catch (error) {

            console.log(
                "Stop error:",
                error
            );
        }
    }

    recognition = null;
};