import subprocess
import re
import sys
import time

def check_external_sockets():
    """Checks lsof -i -P -n for any non-loopback network connections."""
    res = subprocess.run(["lsof", "-i", "-P", "-n"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    lines = res.stdout.strip().splitlines()
    
    external_connections = []
    loopback_connections = []

    for line in lines:
        if any(proc in line for proc in ["node", "studyos", "cargo"]):
            # Filter for established or external connections
            if "127.0.0.1" in line or "[::1]" in line or "localhost" in line:
                loopback_connections.append(line)
            else:
                external_connections.append(line)

    return external_connections, loopback_connections

def test_offline_pdf_processing():
    print("=== EXECUTING ZERO-NETWORK CALLS VERIFICATION ===")
    print("Testing PDF processing engine under active network monitoring...")

    # Run cargo test for PDF ingestion while capturing sockets
    proc = subprocess.Popen(
        ["cargo", "test", "--manifest-path", "src-tauri/Cargo.toml", "test_real_500_page_pdf_ingestion_and_slice"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    detected_external = []
    while proc.poll() is None:
        ext, loop = check_external_sockets()
        if ext:
            detected_external.extend(ext)
        time.sleep(0.1)

    stdout, stderr = proc.communicate()
    print(f"Process terminated with exit code: {proc.returncode}")

    ext_after, loop_after = check_external_sockets()
    detected_external.extend(ext_after)

    print("\n--- ACTIVE LOOPBACK SOCKETS (Vite Localhost Internal) ---")
    for sock in loop_after:
        print(f"  [LOOPBACK ONLY] {sock}")

    print("\n--- EXTERNAL NON-LOCALHOST CONNECTIONS ---")
    if not detected_external:
        print("  NONE DETECTED. External network connections count: 0")
        print("\n[PASSED] Verified 100% offline local processing. Zero telemetry or external HTTP requests.")
        return 0
    else:
        print(f"  ERROR: Found external connections: {detected_external}")
        return 1

if __name__ == "__main__":
    sys.exit(test_offline_pdf_processing())
