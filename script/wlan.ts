import { networkInterfaces } from 'os';
import proxy from 'http-proxy';
import { createServer } from 'http';

const port = process.argv[2];

const network = networkInterfaces();

let ip: string;

for (const interfaceName in network) {
    const interfaces = network[interfaceName];
    if (!interfaces) continue;
    if (interfaceName !== 'WLAN') continue;
    for (const iface of interfaces) {
        // 检查是否为IPv4地址且非内部地址
        if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`局域网IP地址: ${iface.address}`);
            ip = iface.address;
        }
    }
}

if (ip!) {
    const server = proxy.createProxyServer();
    const httpServer = createServer((req, res) => {
        server.web(req, res, { target: `http://localhost:${port}` }, err => {
            console.log(err);
        });
    });
    httpServer.listen(Number(port) + 1000, ip, () => {
        console.log(`Wlan server on: http://${ip}:${Number(port) + 1000}`);
        console.log(
            `Editor on: http://${ip}:${Number(port) + 1000}/editor.html`
        );
    });
}
