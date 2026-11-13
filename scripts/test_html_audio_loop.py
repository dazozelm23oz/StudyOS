import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib
import os, sys, time

html = """
<!DOCTYPE html>
<html>
<head><title>HTML5 Audio Loop Test</title></head>
<body>
<h1>Testing HTML5 Audio Element Loop</h1>
<button id="playBtn">PLAY</button>
<div id="status"></div>
<script>
function log(msg) {
    console.log("[JS-AUDIO-TEST] " + msg);
}

function generateRainWav(seconds = 4) {
    const sampleRate = 48000;
    const numSamples = sampleRate * seconds;
    const buffer = new ArrayBuffer(44 + numSamples * 4); // stereo 16-bit
    const view = new DataView(buffer);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 4, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 2, true); // Stereo
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 4, true);

    let b0L=0, b1L=0, b2L=0, b3L=0, b4L=0, b5L=0, b6L=0;
    let b0R=0, b1R=0, b2R=0, b3R=0, b4R=0, b5R=0, b6R=0;
    let offset = 44;

    for (let i = 0; i < numSamples; i++) {
        // Left Channel
        const whiteL = Math.random() * 2 - 1;
        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        b3L = 0.86650 * b3L + whiteL * 0.3104856;
        b4L = 0.55000 * b4L + whiteL * 0.5329522;
        b5L = -0.7616 * b5L - whiteL * 0.0168980;
        const pinkL = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.25;
        b6L = whiteL * 0.115926;

        // Right Channel (independent decorrelated noise for wide stereo field)
        const whiteR = Math.random() * 2 - 1;
        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        b3R = 0.86650 * b3R + whiteR * 0.3104856;
        b4R = 0.55000 * b4R + whiteR * 0.5329522;
        b5R = -0.7616 * b5R - whiteR * 0.0168980;
        const pinkR = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.25;
        b6R = whiteR * 0.115926;

        const sL = Math.max(-1, Math.min(1, pinkL));
        const sR = Math.max(-1, Math.min(1, pinkR));

        view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
        view.setInt16(offset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
        offset += 4;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

let audio;

document.getElementById('playBtn').addEventListener('click', async () => {
    log("Play button clicked");
    try {
        const blob = generateRainWav(4);
        const url = URL.createObjectURL(blob);
        log("Blob created: " + url);

        audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.8;
        audio.style.display = 'none';
        document.body.appendChild(audio);

        audio.onplay = () => log("onplay event!");
        audio.onplaying = () => log("onplaying event!");
        audio.onpause = () => log("onpause event!");
        audio.onerror = (e) => log("onerror: " + (audio.error ? audio.error.message : e));

        await audio.play();
        log("audio.play() promise resolved successfully!");
    } catch(err) {
        log("Error playing audio: " + err);
    }
});

setInterval(() => {
    if (audio) {
        log("Tick: paused=" + audio.paused + " currentTime=" + audio.currentTime.toFixed(2) + " duration=" + audio.duration.toFixed(2));
    }
}, 1000);
</script>
</body>
</html>
"""

window = Gtk.OffscreenWindow()
view = WebKit2.WebView()
settings = view.get_settings()
settings.set_enable_write_console_messages_to_stdout(True)

window.add(view)
window.show_all()
view.load_html(html, "http://localhost:1420/")

clicked = False
start = time.time()
def timer_tick():
    global clicked
    elapsed = time.time() - start
    if elapsed > 1.0 and not clicked:
        clicked = True
        print("SIMULATING CLICK TO START AUDIO...")
        view.run_javascript("document.getElementById('playBtn').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));", None, None, None)
    if elapsed > 10:
        Gtk.main_quit()
        return False
    return True

GLib.timeout_add(500, timer_tick)
Gtk.main()
print("Test finished.")
