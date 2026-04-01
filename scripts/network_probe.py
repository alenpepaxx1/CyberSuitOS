# CyberSuite OS - Network Probe Script
# This script demonstrates a simple network reachability probe.

import socket
import time

def probe_target(target, port=80):
    """Probe a target to see if a port is open."""
    print(f"[*] Probing {target}:{port}...")
    try:
        # Create a socket object
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2) # 2 second timeout
        
        # Connect to the target
        start_time = time.time()
        result = s.connect_ex((target, port))
        end_time = time.time()
        
        if result == 0:
            print(f"[+] {target}:{port} is OPEN (Response time: {(end_time - start_time) * 1000:.2f}ms)")
        else:
            print(f"[-] {target}:{port} is CLOSED or FILTERED")
            
        s.close()
    except socket.error as e:
        print(f"[!] Socket error: {e}")

if __name__ == "__main__":
    print("--- CyberSuite Network Probe ---")
    # probe_target("google.com", 443)
    # probe_target("127.0.0.1", 3000)
    print("[!] Network probe script loaded. Ready for execution.")
