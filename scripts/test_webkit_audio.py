import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib
import os, sys, time

html = """
<!DOCTYPE html>
<html>
<head><title>WebKitGTK Audio Test</title></head>
<body>
<h1>WebKit Audio Test</h1>
<button id="btn">CLICK TO PLAY</button>
<div id="log"></div>
<script>
function log(msg) {
    console.log("[JS-LOG] " + msg);
}

let ctx;
let srcNode;

document.getElementById('btn').addEventListener('click', async () => {
    log("BUTTON CLICKED!");

    try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        await ctx.resume();

        // 2-second buffer
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }

        srcNode = ctx.createBufferSource();
        srcNode.buffer = buffer;
        srcNode.loop = true;
        srcNode.loopStart = 0;
        srcNode.loopEnd = buffer.duration;

        srcNode.onended = () => {
            log("srcNode onended FIRED!");
        };

        srcNode.connect(ctx.destination);
        srcNode.start(0);
        log("srcNode.start(0) executed!");

        window._srcNode = srcNode;

    } catch(err) {
        log("Error: " + err);
    }
});

let prevTime = 0;
setInterval(() => {
    if (ctx) {
        const cur = ctx.currentTime;
        log("Tick: ctx.state=" + ctx.state + " currentTime=" + cur.toFixed(3) + " diff=" + (cur - prevTime).toFixed(3));
        prevTime = cur;
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
settings.set_enable_webaudio(True)

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
        print("SIMULATING TRUSTED CLICK...")
        view.run_javascript("document.getElementById('btn').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));", None, None, None)
    if elapsed > 8:
        Gtk.main_quit()
        return False
    return True

GLib.timeout_add(500, timer_tick)
Gtk.main()
print("Test complete.")
