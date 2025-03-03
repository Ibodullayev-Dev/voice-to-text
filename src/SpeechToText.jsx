import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SpeechToText.css"; // External CSS fayl

const SpeechToText = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const textAreaRef = useRef(null);
  const wakeLockRef = useRef(null);
  const lastWordsRef = useRef([]); // Buyruqlarni tekshirish uchun

  useEffect(() => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = async (event) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
            .trim()
            .toLowerCase();

          if (event.results[i].isFinal) {
            lastWordsRef.current.push(transcript);
            if (lastWordsRef.current.length > 2) {
              lastWordsRef.current.shift();
            }

            const lastTwoWords = lastWordsRef.current.join(" ");

            if (transcript === "clear one" || transcript === "clear 1") {
              setText("");
              lastWordsRef.current = [];
              return;
            } else if (transcript === "stop recording") {
              stopListening();
              return;
            } else if (transcript === "dot dot") {
              setText((prev) => prev + ".");
            } else {
              finalTranscript += transcript + " ";
            }
          }
        }

        if (finalTranscript) {
          setText((prev) => prev + finalTranscript);
          translateText(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
      };
    }

    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [text]);

  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.error("Wake Lock error: ", err);
      }
    }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  };

  const startListening = useCallback(() => {
    setIsListening(true);
    recognitionRef.current?.start();
    requestWakeLock();
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
    releaseWakeLock();
  }, []);

  // tranlator
  const translateText = async (text) => {
    try {
      const response = await fetch(
        "https://translation.googleapis.com/language/translate/v2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer AIzaSyCV540ada-LiIucrL0f_2bWs2Vgu1r6GwA`,
          },
          body: JSON.stringify({
            q: text,
            source: "en",
            target: "uz",
            format: "text",
          }),
        }
      );

      const data = await response.json();
      if (data?.data?.translations?.[0]?.translatedText) {
        setTranslatedText(
          (prev) => prev + data.data.translations[0].translatedText + " "
        );
      }
    } catch (error) {
      console.error("Translation error: ", error);
    }
  };

  return (
    <div className="container">
      <h1>Voice to Text</h1>
      <h2>Ovozdan Matn</h2>

      <div className="text-containers">
        <div className="text-box">
          <h3>Original Matn</h3>
          <textarea ref={textAreaRef} value={text || ""} readOnly />
        </div>
        <div className="text-box">
          <h3>Tarjima</h3>
          <textarea value={translatedText || ""} readOnly />
        </div>
      </div>

      <div className="buttons">
        <button onClick={startListening} disabled={isListening}>
          🎙 Start Listening
        </button>
        <button onClick={stopListening} disabled={!isListening}>
          ⏹ Stop Listening
        </button>
      </div>
    </div>
  );
};

export default SpeechToText;
