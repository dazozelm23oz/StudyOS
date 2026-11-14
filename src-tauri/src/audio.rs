use std::fs::File;
use std::io::BufReader;
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use rand::Rng;
use rodio::{Decoder, OutputStream, Sink, Source};
use tauri::{command, State};

/// Continuous Procedural Pink Noise Source for Rain synthesis
pub struct PinkNoiseSource {
    sample_rate: u32,
    channels: u16,
    b0: f32,
    b1: f32,
    b2: f32,
    b3: f32,
    b4: f32,
    b5: f32,
    b6: f32,
    last_lp: f32,
}

impl PinkNoiseSource {
    pub fn new(sample_rate: u32) -> Self {
        Self {
            sample_rate,
            channels: 2,
            b0: 0.0,
            b1: 0.0,
            b2: 0.0,
            b3: 0.0,
            b4: 0.0,
            b5: 0.0,
            b6: 0.0,
            last_lp: 0.0,
        }
    }
}

impl Iterator for PinkNoiseSource {
    type Item = f32;

    fn next(&mut self) -> Option<Self::Item> {
        let mut rng = rand::thread_rng();
        let white = rng.gen_range(-1.0f32..1.0f32);

        // Paul Kellet's refined pink noise filter
        self.b0 = 0.99886 * self.b0 + white * 0.0555179;
        self.b1 = 0.99332 * self.b1 + white * 0.0750759;
        self.b2 = 0.96900 * self.b2 + white * 0.1538520;
        self.b3 = 0.86650 * self.b3 + white * 0.3104856;
        self.b4 = 0.55000 * self.b4 + white * 0.5329522;
        self.b5 = -0.7616 * self.b5 - white * 0.0168980;
        let pink = (self.b0 + self.b1 + self.b2 + self.b3 + self.b4 + self.b5 + self.b6 + white * 0.5362) * 0.18;
        self.b6 = white * 0.115926;

        // Gentle one-pole lowpass filter (~1200 Hz) to give pleasant soft rainfall texture
        let alpha = 0.18f32;
        self.last_lp = self.last_lp + alpha * (pink - self.last_lp);

        Some(self.last_lp)
    }
}

impl Source for PinkNoiseSource {
    fn current_frame_len(&self) -> Option<usize> {
        None
    }

    fn channels(&self) -> u16 {
        self.channels
    }

    fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    fn total_duration(&self) -> Option<Duration> {
        None
    }
}

pub enum AudioCommand {
    StartRain,
    Stop,
    SetVolume(f32),
    PlayLocalFile(String),
}

pub struct AudioState {
    tx: Mutex<Sender<AudioCommand>>,
}

impl Default for AudioState {
    fn default() -> Self {
        let (tx, rx) = channel::<AudioCommand>();

        // Spawn dedicated audio background thread
        // Rodio's OutputStream stays entirely on this thread, avoiding any !Send / ALSA restrictions
        thread::Builder::new()
            .name("studyos-native-audio".into())
            .spawn(move || {
                let stream_setup = OutputStream::try_default();
                let (_stream, stream_handle) = match stream_setup {
                    Ok(pair) => pair,
                    Err(e) => {
                        log::error!("Failed to initialize audio output stream: {}", e);
                        return;
                    }
                };

                let mut current_sink: Option<Sink> = None;
                let mut current_volume: f32 = 0.8;

                while let Ok(cmd) = rx.recv() {
                    match cmd {
                        AudioCommand::StartRain => {
                            if let Some(s) = current_sink.take() {
                                s.stop();
                            }
                            match Sink::try_new(&stream_handle) {
                                Ok(sink) => {
                                    sink.set_volume(current_volume);
                                    let noise = PinkNoiseSource::new(44100);
                                    sink.append(noise);
                                    current_sink = Some(sink);
                                    log::info!("Native procedural rain started");
                                }
                                Err(e) => {
                                    log::error!("Failed to create audio sink for rain: {}", e);
                                }
                            }
                        }
                        AudioCommand::Stop => {
                            if let Some(s) = current_sink.take() {
                                s.stop();
                                log::info!("Native audio stopped");
                            }
                        }
                        AudioCommand::SetVolume(vol) => {
                            current_volume = vol.max(0.0).min(1.0);
                            if let Some(s) = current_sink.as_ref() {
                                s.set_volume(current_volume);
                            }
                        }
                        AudioCommand::PlayLocalFile(path) => {
                            if let Some(s) = current_sink.take() {
                                s.stop();
                            }
                            match File::open(&path) {
                                Ok(file) => {
                                    let reader = BufReader::new(file);
                                    match Decoder::new(reader) {
                                        Ok(decoder) => {
                                            match Sink::try_new(&stream_handle) {
                                                Ok(sink) => {
                                                    sink.set_volume(current_volume);
                                                    sink.append(decoder.repeat_infinite());
                                                    current_sink = Some(sink);
                                                    log::info!("Playing local audio file: {}", path);
                                                }
                                                Err(e) => log::error!("Failed to create sink for file: {}", e),
                                            }
                                        }
                                        Err(e) => log::error!("Failed to decode audio file '{}': {}", path, e),
                                    }
                                }
                                Err(e) => log::error!("Failed to open audio file '{}': {}", path, e),
                            }
                        }
                    }
                }
            })
            .expect("Failed to spawn native audio worker thread");

        Self { tx: Mutex::new(tx) }
    }
}

#[command]
pub fn start_rain(state: State<'_, AudioState>) -> Result<String, String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::StartRain).map_err(|e| e.to_string())?;
    Ok("Native procedural rain started".to_string())
}

#[command]
pub fn stop_audio(state: State<'_, AudioState>) -> Result<String, String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::Stop).map_err(|e| e.to_string())?;
    Ok("Native audio stopped".to_string())
}

#[command]
pub fn set_audio_volume(volume: f32, state: State<'_, AudioState>) -> Result<String, String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::SetVolume(volume)).map_err(|e| e.to_string())?;
    Ok(format!("Volume set to {:.2}", volume))
}

#[command]
pub fn play_local_file(path: String, state: State<'_, AudioState>) -> Result<String, String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    tx.send(AudioCommand::PlayLocalFile(path)).map_err(|e| e.to_string())?;
    Ok("Playback started".to_string())
}
