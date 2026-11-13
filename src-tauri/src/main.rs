// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Prevent PipeWire / PulseAudio from corking background audio on Linux
    unsafe {
        std::env::set_var("PULSE_PROP_media.role", "music");
        std::env::set_var("PULSE_PROP_media.category", "playback");
    }
    studyos_lib::run();
}
