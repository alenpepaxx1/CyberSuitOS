import https from 'https';

https.get('https://isc.sans.edu/api/summary?json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
