const express = require('express');
const axios = require('axios');
const { URL } = require('url');
const dns = require('dns').promises;
const app = express();

function isPrivateIp(ip) {
  return ip === '::1' ||
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    ip.startsWith('fc') || ip.startsWith('fd') ||
    ip.startsWith('fe80:');
}

// SSRF
app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }
  const hostname = parsedUrl.hostname;
  if (!['http:', 'https:'].includes(parsedUrl.protocol) ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      /^(10|127)\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^192\.168\./.test(hostname)) {
    return res.status(400).send('URL not allowed');
  }
  try {
  // DNS resolution to prevent DNS rebinding
  try {
    const addresses = await dns.lookup(parsedUrl.hostname, { all: true });
    for (const { address } of addresses) {
      if (isPrivateIp(address)) {
        return res.status(400).send('URL not allowed');
      }
    }
  } catch (e) {
    return res.status(400).send('Invalid hostname');
  }

    const resp = await axios.get(url);
    res.send(resp.data);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(3000, () => console.log('HTTP vuln on port 3000'));
