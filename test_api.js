const http = require('http');

async function run() {
  // Login first
  const loginData = JSON.stringify({ username: 'budi.santoso', password: 'budi123' });
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Login response:', data);
      const cookies = res.headers['set-cookie'];
      
      // Now create account
      const createData = JSON.stringify({ nama_rekening: 'Tabungan ' + Date.now() });
      const createOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/rekening',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': createData.length,
          'Cookie': cookies ? cookies[0].split(';')[0] : ''
        }
      };

      const req2 = http.request(createOptions, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log('Create response status:', res2.statusCode);
          console.log('Create response body:', data2);
        });
      });
      req2.write(createData);
      req2.end();
    });
  });
  req.write(loginData);
  req.end();
}

run();
