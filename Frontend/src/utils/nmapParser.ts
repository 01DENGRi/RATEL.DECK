import type { Task, TaskCategory } from '@/types/ctf';

export interface NmapPort {
  port: string;
  protocol: string;
  state: string;
  service: string;
  product?: string;
  version?: string;
  extraInfo?: string;
}

export interface NmapHost {
  ip: string;
  hostname?: string;
  ports: NmapPort[];
  os?: string;
}

export interface NmapResult {
  hosts: NmapHost[];
  scanInfo?: {
    type: string;
    protocol: string;
    numServices: number;
  };
}

/**
 * Parse Nmap XML output and extract hosts/ports
 */
export function parseNmapXML(xmlContent: string): NmapResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  const result: NmapResult = {
    hosts: [],
  };

  // Parse scan info
  const scanInfoEl = xmlDoc.querySelector('scaninfo');
  if (scanInfoEl) {
    result.scanInfo = {
      type: scanInfoEl.getAttribute('type') || '',
      protocol: scanInfoEl.getAttribute('protocol') || '',
      numServices: parseInt(scanInfoEl.getAttribute('numservices') || '0'),
    };
  }

  // Parse hosts
  const hostElements = xmlDoc.querySelectorAll('host');
  hostElements.forEach((hostEl) => {
    const host: NmapHost = {
      ip: '',
      ports: [],
    };

    // Get IP address
    const addressEl = hostEl.querySelector('address[addrtype="ipv4"]');
    if (addressEl) {
      host.ip = addressEl.getAttribute('addr') || '';
    }

    // Get hostname
    const hostnameEl = hostEl.querySelector('hostname');
    if (hostnameEl) {
      host.hostname = hostnameEl.getAttribute('name') || undefined;
    }

    // Get OS detection
    const osmatchEl = hostEl.querySelector('osmatch');
    if (osmatchEl) {
      host.os = osmatchEl.getAttribute('name') || undefined;
    }

    // Parse ports
    const portElements = hostEl.querySelectorAll('port');
    portElements.forEach((portEl) => {
      const stateEl = portEl.querySelector('state');
      const serviceEl = portEl.querySelector('service');
      
      if (stateEl?.getAttribute('state') === 'open') {
        const port: NmapPort = {
          port: portEl.getAttribute('portid') || '',
          protocol: portEl.getAttribute('protocol') || 'tcp',
          state: 'open',
          service: serviceEl?.getAttribute('name') || 'unknown',
          product: serviceEl?.getAttribute('product') || undefined,
          version: serviceEl?.getAttribute('version') || undefined,
          extraInfo: serviceEl?.getAttribute('extrainfo') || undefined,
        };
        host.ports.push(port);
      }
    });

    if (host.ip && host.ports.length > 0) {
      result.hosts.push(host);
    }
  });

  return result;
}

/**
 * Convert Nmap results to Task items for the TODO list
 */
export function nmapResultToTasks(result: NmapResult): Omit<Task, 'id'>[] {
  const tasks: Omit<Task, 'id'>[] = [];

  result.hosts.forEach((host) => {
    const hostIdentifier = host.hostname || host.ip;

    host.ports.forEach((port) => {
      const category = getPortCategory(port.service);
      const serviceName = port.service.toUpperCase();
      const productInfo = port.product ? ` (${port.product}${port.version ? ' ' + port.version : ''})` : '';
      
      tasks.push({
        content: `Port ${port.port} – ${serviceName}${productInfo}`,
        completed: false,
        important: isImportantPort(port.port, port.service),
        category,
        status: 'low-priority',
        details: buildPortDetails(host, port),
        notes: '',
      });
    });
  });

  return tasks;
}

function getPortCategory(service: string): TaskCategory {
  const serviceLower = service.toLowerCase();
  
  // Port/Network services
  if (['ssh', 'telnet', 'ftp', 'sftp', 'rpc', 'nfs'].includes(serviceLower)) {
    return 'ports';
  }
  
  // Web services
  if (['http', 'https', 'http-proxy', 'ssl', 'apache', 'nginx', 'iis'].some(s => serviceLower.includes(s))) {
    return 'service';
  }
  
  // Host enumeration
  if (['smb', 'netbios', 'ldap', 'dns', 'kerberos', 'msrpc', 'microsoft-ds'].some(s => serviceLower.includes(s))) {
    return 'host';
  }
  
  // Database services (potential exploits)
  if (['mysql', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis', 'memcached'].some(s => serviceLower.includes(s))) {
    return 'exploit';
  }
  
  return 'ports';
}

function isImportantPort(port: string, service: string): boolean {
  const importantServices = ['ssh', 'smb', 'rdp', 'winrm', 'http', 'https', 'ftp', 'mysql', 'mssql'];
  const importantPorts = ['21', '22', '23', '80', '443', '445', '3389', '5985', '5986'];
  
  return importantPorts.includes(port) || importantServices.some(s => service.toLowerCase().includes(s));
}

function buildPortDetails(host: NmapHost, port: NmapPort): string {
  const lines: string[] = [];
  
  lines.push(`Host: ${host.ip}${host.hostname ? ` (${host.hostname})` : ''}`);
  lines.push(`Port: ${port.port}/${port.protocol}`);
  lines.push(`Service: ${port.service}`);
  
  if (port.product) {
    lines.push(`Product: ${port.product}${port.version ? ' ' + port.version : ''}`);
  }
  
  if (port.extraInfo) {
    lines.push(`Info: ${port.extraInfo}`);
  }
  
  if (host.os) {
    lines.push(`OS: ${host.os}`);
  }
  
  // Add suggested commands based on service
  const commands = getSuggestedCommands(port.service, host.ip, port.port);
  if (commands.length > 0) {
    lines.push('');
    lines.push('Suggested commands:');
    commands.forEach(cmd => lines.push(`  ${cmd}`));
  }
  
  return lines.join('\n');
}

function getSuggestedCommands(service: string, ip: string, port: string): string[] {
  const serviceLower = service.toLowerCase();
  const commands: string[] = [];
  
  if (serviceLower.includes('http')) {
    commands.push(`gobuster dir -u http://${ip}:${port} -w /usr/share/wordlists/dirb/common.txt`);
    commands.push(`nikto -h http://${ip}:${port}`);
  }
  
  if (serviceLower === 'ssh') {
    commands.push(`ssh ${ip} -p ${port}`);
    commands.push(`hydra -L users.txt -P passwords.txt ${ip} ssh -s ${port}`);
  }
  
  if (serviceLower === 'ftp') {
    commands.push(`ftp ${ip} ${port}`);
    commands.push(`nmap --script ftp-anon -p ${port} ${ip}`);
  }
  
  if (serviceLower.includes('smb') || serviceLower.includes('microsoft-ds')) {
    commands.push(`smbclient -L //${ip} -N`);
    commands.push(`enum4linux -a ${ip}`);
    commands.push(`crackmapexec smb ${ip}`);
  }
  
  if (serviceLower.includes('mysql')) {
    commands.push(`mysql -h ${ip} -P ${port} -u root -p`);
  }
  
  if (serviceLower.includes('ldap')) {
    commands.push(`ldapsearch -x -H ldap://${ip}:${port} -b "dc=example,dc=com"`);
  }
  
  return commands;
}
