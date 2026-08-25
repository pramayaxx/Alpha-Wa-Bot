const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/search/code?q=requestPairingCode+in:file+language:javascript',
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(JSON.parse(data).items?.[0]?.html_url));
});
