import os
import time
import logging
import threading


class AudioQueue:
    def __init__(self, fifo_path="audio/live_audio.fifo"):
        self.fifo_path = fifo_path
        self.lock = threading.Lock()
        self.running = True
        self.queue = [] # Queue of audio file paths to play
        self._ensure_fifo()
        
        # Start the writer thread
        self.thread = threading.Thread(target=self._writer_loop, daemon=True)
        self.thread.start()

    def _ensure_fifo(self):
        """Creates the FIFO file if it doesn't exist."""
        if not os.path.exists(os.path.dirname(self.fifo_path)):
            os.makedirs(os.path.dirname(self.fifo_path), exist_ok=True)
            
        if not os.path.exists(self.fifo_path):
            try:
                os.mkfifo(self.fifo_path)
                logging.info(f"Created FIFO at {self.fifo_path}")
            except OSError as e:
                logging.error(f"Failed to create FIFO: {e}")

    def add_audio(self, file_path):
        """Adds an audio file to the playback queue."""
        if os.path.exists(file_path):
            with self.lock:
                self.queue.append(file_path)
            logging.info(f"Queued audio: {file_path}")
        else:
            logging.error(f"Audio file not found: {file_path}")

    def _writer_loop(self):
        """Continuously writes audio or silence to the FIFO."""
        logging.info("Audio writer loop started.")
        
        # Open FIFO for writing. 
        # Opening a FIFO for writing blocks until a reader opens it, 
        # so we must be careful or do this in a non-blocking way?
        # Actually, for this use case, we WANT to block until ffmpeg starts reading.
        # But if we block here, we can't do anything else. Main thread continues though.
        
        try:
            # We open as binary write. 
            # NOTE: this blocks until ffmpeg opens it!
            logging.info("Waiting for FFmpeg to open FIFO...")
            fifo = open(self.fifo_path, 'wb') 
            logging.info("FIFO opened.")
        except Exception as e:
            logging.error(f"Error opening FIFO: {e}")
            return

        while self.running:
            current_audio = None
            
            with self.lock:
                if self.queue:
                    current_audio = self.queue.pop(0)
            
            if current_audio:
                self._stream_file(fifo, current_audio)
            else:
                self._stream_silence(fifo)

        fifo.close()

    def _stream_file(self, fifo, file_path):
        """Reads a raw PCM file and writes its data to the FIFO."""
        try:
            with open(file_path, 'rb') as f:
                chunk_size = 4096
                data = f.read(chunk_size)
                while data:
                    try:
                        fifo.write(data)
                        fifo.flush()
                    except BrokenPipeError:
                        logging.warning("FIFO broken pipe. Re-opening...")
                        return 
                    data = f.read(chunk_size)
            
            message = f"Finished playing: {os.path.basename(file_path)}"
            logging.info(message)
            
        except Exception as e:
            logging.error(f"Error streaming file {file_path}: {e}")

    def _stream_silence(self, fifo, duration=1.0):
        """Writes silence for 24kHz 16-bit Mono PCM."""
        # Rate: 24000 Hz
        # Channels: 1
        # Width: 2 bytes (16-bit)
        # Bytes per sec: 24000 * 2 = 48000
        
        bytes_per_sec = 48000
        total_bytes = int(duration * bytes_per_sec)
        chunk_size = 4096
        
        # Write in chunks to avoid blocking too long
        written = 0
        silence_chunk = b'\x00' * chunk_size
        
        try:
            while written < total_bytes:
                to_write = min(chunk_size, total_bytes - written)
                if to_write < chunk_size:
                    fifo.write(b'\x00' * to_write)
                else:
                    fifo.write(silence_chunk)
                fifo.flush()
                written += to_write
                # slightly sleep to approximate real-time if needed, 
                # but for silence usually we can just fill the buffer.
                # Adding a small sleep prevents CPU spinning if buffer is huge.
                time.sleep(chunk_size / bytes_per_sec)
                
        except BrokenPipeError:
            pass

    def stop(self):
        self.running = False
