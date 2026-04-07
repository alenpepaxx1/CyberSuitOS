import socket
import ssl
import requests
import dns.resolver
import whois
import json
import argparse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

class AdvancedScanner:
    def __init__(self, target):
        self.target = target
        self.hostname = target.replace('https://', '').replace('http://', '').split('/')[0].split(':')[0]
        self.results = {
            "target": target,
            "hostname": self.hostname,
            "timestamp": datetime.now().isoformat(),
            "dns": {},
            "ports": [],
            "subdomains": [],
            "headers": {},
            "ssl": {},
            "whois": {},
            "tech": []
        }

    def run_dns_lookup(self):
        print(f"[*] Running DNS Lookup for {self.hostname}...")
        try:
            for qtype in ['A', 'MX', 'NS', 'TXT', 'SOA']:
                try:
                    answers = dns.resolver.resolve(self.hostname, qtype)
                    self.results["dns"][qtype] = [str(rdata) for rdata in answers]
                except Exception:
                    pass
        except Exception as e:
            self.results["dns"]["error"] = str(e)

    def run_port_scan(self, ports=[21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443]):
        print(f"[*] Scanning common ports on {self.hostname}...")
        def scan_port(port):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1)
                    if s.connect_ex((self.hostname, port)) == 0:
                        return {"port": port, "status": "open"}
            except:
                pass
            return None

        with ThreadPoolExecutor(max_workers=20) as executor:
            scan_results = list(executor.map(scan_port, ports))
            self.results["ports"] = [r for r in scan_results if r]

    def run_subdomain_enum(self):
        print(f"[*] Enumerating subdomains for {self.hostname}...")
        # Passive enumeration using crt.sh
        try:
            url = f"https://crt.sh/?q=%25.{self.hostname}&output=json"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                subdomains = set()
                for entry in data:
                    name = entry['name_value']
                    if '\n' in name:
                        for n in name.split('\n'):
                            subdomains.add(n)
                    else:
                        subdomains.add(name)
                self.results["subdomains"] = list(subdomains)
        except Exception as e:
            print(f"[!] Subdomain enumeration failed: {e}")

    def run_header_analysis(self):
        print(f"[*] Analyzing HTTP headers for {self.target}...")
        try:
            url = self.target if self.target.startswith('http') else f"http://{self.target}"
            response = requests.get(url, timeout=5, verify=False)
            self.results["headers"] = dict(response.headers)
            
            security_headers = [
                'Content-Security-Policy',
                'Strict-Transport-Security',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Referrer-Policy'
            ]
            missing = [h for h in security_headers if h not in response.headers]
            self.results["header_analysis"] = {
                "missing": missing,
                "status_code": response.status_code
            }
        except Exception as e:
            self.results["headers"]["error"] = str(e)

    def run_ssl_inspection(self):
        print(f"[*] Inspecting SSL/TLS for {self.hostname}...")
        try:
            context = ssl.create_default_context()
            with socket.create_connection((self.hostname, 443)) as sock:
                with context.wrap_socket(sock, server_hostname=self.hostname) as ssock:
                    cert = ssock.getpeercert()
                    self.results["ssl"] = cert
        except Exception as e:
            self.results["ssl"]["error"] = str(e)

    def run_whois(self):
        print(f"[*] Performing WHOIS lookup for {self.hostname}...")
        try:
            w = whois.whois(self.hostname)
            self.results["whois"] = dict(w)
        except Exception as e:
            self.results["whois"]["error"] = str(e)

    def run_tech_detection(self):
        print(f"[*] Detecting technology stack...")
        # Basic signature matching
        tech_signatures = {
            "Server": ["Apache", "Nginx", "Microsoft-IIS", "LiteSpeed", "Cloudflare"],
            "X-Powered-By": ["PHP", "Express", "ASP.NET", "Next.js"],
            "Via": ["Varnish", "Squid"]
        }
        
        detected = []
        headers = self.results.get("headers", {})
        for header, sigs in tech_signatures.items():
            val = headers.get(header, "").lower()
            for sig in sigs:
                if sig.lower() in val:
                    detected.append(sig)
        
        self.results["tech"] = detected

    def scan_all(self):
        self.run_dns_lookup()
        self.run_port_scan()
        self.run_subdomain_enum()
        self.run_header_analysis()
        self.run_ssl_inspection()
        self.run_whois()
        self.run_tech_detection()
        return self.results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Advanced Vulnerability Scanner")
    parser.add_argument("target", help="Target domain or IP")
    parser.add_argument("-o", "--output", help="Output JSON file")
    args = parser.parse_args()

    scanner = AdvancedScanner(args.target)
    results = scanner.scan_all()

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=4, default=str)
        print(f"[+] Results saved to {args.output}")
    else:
        print(json.dumps(results, indent=4, default=str))
