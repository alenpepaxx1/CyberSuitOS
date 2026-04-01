# CyberSuite OS - Sample Python Security Script
# This script demonstrates a simple file integrity checker.

import hashlib
import os

def calculate_sha256(file_path):
    """Calculate the SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            # Read and update hash string value in blocks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except FileNotFoundError:
        return None

def check_integrity(directory):
    """Check integrity of files in a directory."""
    print(f"[*] Starting integrity check for directory: {directory}")
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            file_hash = calculate_sha256(file_path)
            if file_hash:
                print(f"[+] {file}: {file_hash}")
            else:
                print(f"[-] {file}: FAILED TO READ")

if __name__ == "__main__":
    # Example usage (checks current directory)
    # In a real scenario, you'd compare these hashes against a known-good baseline.
    print("--- CyberSuite Integrity Checker ---")
    # check_integrity(".")
    print("[!] Integrity check script loaded. Ready for execution.")
