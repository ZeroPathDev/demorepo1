const express = require('express');
const axios = require('axios');
const { URL } = require('url');
const dns = require('dns').promises;
const net = require('net');
const http = require('http');
const https = require('https');
const app = express();

// This endpoint deliberately supports globally routable IPv4 destinations only.
const deniedIPv4Ranges = [
  '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8',
  '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24',
  '192.88.99.0/24', '192.168.0.0/16', '198.18.0.0/15', '198.51.100.0/24',
  '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4'
];

function isPrivateIp(ip) {
  const version = net.isIP(ip);
  if (version === 6) {
    // Permit only global-unicast IPv6, excluding protocol assignments,
    // documentation space, and 6to4 (which can embed private IPv4 targets).
    const [first, second] = ip.toLowerCase().split(':');
    const firstGroup = first ? parseInt(first, 16) : 0;
    const secondGroup = second ? parseInt(second, 16) : 0;
    return firstGroup < 0x2000 || firstGroup > 0x3fff ||
      firstGroup === 0x2001 && (secondGroup <= 0x7f || secondGroup === 0x0db8) ||
      firstGroup === 0x2002;
  }
  if (version !== 4) return true;

  const value = ip.split('.').reduce((result, octet) =>
    (result * 256) + Number(octet), 0);
  return deniedIPv4Ranges.some((range) => {
    const [network, prefixLength] = range.split('/');
    const networkValue = network.split('.').reduce((result, octet) =>
      (result * 256) + Number(octet), 0);
    const prefix = Number(prefixLength);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) === (networkValue & mask);
  });
}

// SSRF
app.get('/fetch', async (req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.query.url);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).send('URL not allowed');
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try {
    // Resolve once and pin the request to a validated address to prevent rebinding.
    addresses = await dns.lookup(hostname, { all: true });
  } catch (e) {
    return res.status(400).send('Invalid hostname');
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    return res.status(400).send('URL not allowed');
  }

  const pinnedAddress = addresses[0].address;
  const pinnedFamily = net.isIP(pinnedAddress);
  const pinnedLookup = (hostname, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (options && options.all) {
      callback(null, [{ address: pinnedAddress, family: pinnedFamily }]);
    } else {
      callback(null, pinnedAddress, pinnedFamily);
    }
  };

  try {
    const resp = await axios.get(parsedUrl.href, {
      proxy: false,
      maxRedirects: 0,
      httpAgent: new http.Agent({ lookup: pinnedLookup }),
      httpsAgent: new https.Agent({ lookup: pinnedLookup })
    });
    res.send(resp.data);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(3000, () => console.log('HTTP vuln on port 3000'));
